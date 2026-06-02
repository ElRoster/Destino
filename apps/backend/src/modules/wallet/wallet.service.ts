import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('Billetera no encontrada para este usuario');
    }
    return {
      id: wallet.id,
      balance: Number(wallet.balance),
      updatedAt: wallet.updatedAt,
    };
  }

  async deposit(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('El monto a depositar debe ser mayor a cero');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Lock the wallet row to prevent concurrent updates (pessimistic lock)
      const wallets: any[] = await tx.$queryRaw`
        SELECT id, balance, version FROM "Wallet" 
        WHERE "userId" = ${userId}::uuid 
        FOR UPDATE
      `;

      if (wallets.length === 0) {
        throw new NotFoundException('Billetera no encontrada');
      }

      const wallet = wallets[0];
      const currentBalance = Number(wallet.balance);
      const newBalance = currentBalance + amount;

      // 2. Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          version: { increment: 1 },
        },
      });

      // 3. Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          amount,
          status: TransactionStatus.COMPLETED,
          description: `Depósito exitoso de ${amount} tokens`,
        },
      });

      // 4. Create Audit Trail
      await tx.auditTrail.create({
        data: {
          action: 'WALLET_DEPOSIT',
          actorId: userId,
          metadata: { amount, newBalance, transactionId: transaction.id },
        },
      });

      return {
        balance: Number(updatedWallet.balance),
        transactionId: transaction.id,
      };
    });
  }

  /**
   * Consume per-minute rate during calls. Executed atomically.
   */
  async consumeTokensPerMinute(
    clientId: string,
    readerUserId: string,
    callId: string,
    ratePerMinute: number,
    minuteTick: number
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Ensure we lock the wallets in a consistent order to prevent database deadlocks.
      // Order: alphabetically by UUID
      const firstId = clientId < readerUserId ? clientId : readerUserId;
      const secondId = clientId < readerUserId ? readerUserId : clientId;

      // 1. Lock first wallet
      const lockFirst: any[] = await tx.$queryRaw`
        SELECT id, balance FROM "Wallet" WHERE "userId" = ${firstId}::uuid FOR UPDATE
      `;
      // 2. Lock second wallet
      const lockSecond: any[] = await tx.$queryRaw`
        SELECT id, balance FROM "Wallet" WHERE "userId" = ${secondId}::uuid FOR UPDATE
      `;

      const clientWallet = lockFirst[0]?.id && firstId === clientId ? lockFirst[0] : lockSecond[0];
      const readerWallet = lockFirst[0]?.id && firstId === readerUserId ? lockFirst[0] : lockSecond[0];

      if (!clientWallet || !readerWallet) {
        throw new BadRequestException('Error en billeteras. Uno de los usuarios no tiene billetera.');
      }

      const clientBalance = Number(clientWallet.balance);

      // Check if client has enough tokens for this minute
      if (clientBalance < ratePerMinute) {
        throw new BadRequestException('Saldo insuficiente para continuar la llamada');
      }

      const newClientBalance = clientBalance - ratePerMinute;
      const newReaderBalance = Number(readerWallet.balance) + ratePerMinute;

      // 3. Deduct from client
      await tx.wallet.update({
        where: { id: clientWallet.id },
        data: { balance: newClientBalance },
      });

      // 4. Add to reader
      await tx.wallet.update({
        where: { id: readerWallet.id },
        data: { balance: newReaderBalance },
      });

      // 5. Create token consumption tick
      await tx.tokenConsumption.create({
        data: {
          callId,
          walletId: clientWallet.id,
          minuteTick,
          amount: ratePerMinute,
        },
      });

      // 6. Record in transaction logs
      await tx.walletTransaction.create({
        data: {
          walletId: clientWallet.id,
          type: TransactionType.CONSUMPTION,
          amount: ratePerMinute,
          status: TransactionStatus.COMPLETED,
          referenceId: callId,
          description: `Consumo minuto ${minuteTick} de la llamada`,
        },
      });

      // Add corresponding transaction for the reader
      await tx.walletTransaction.create({
        data: {
          walletId: readerWallet.id,
          type: TransactionType.DEPOSIT,
          amount: ratePerMinute,
          status: TransactionStatus.COMPLETED,
          referenceId: callId,
          description: `Ganancia minuto ${minuteTick} de la llamada`,
        },
      });

      return {
        clientBalance: newClientBalance,
      };
    });
  }

  async getTransactions(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) {
      throw new NotFoundException('Billetera no encontrada');
    }

    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
