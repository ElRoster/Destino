import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [
      totalUsers,
      clients,
      readers,
      admins,
      verifiedUsers,
      activeUsers,
      suspendedUsers,
      deletedUsers,
      onlineReaders,
      activeCalls,
      walletAggregate,
      deposits,
      consumption,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.CLIENT } }),
      this.prisma.user.count({ where: { role: UserRole.TAROT_READER } }),
      this.prisma.user.count({ where: { role: UserRole.ADMIN } }),
      this.prisma.user.count({ where: { isEmailVerified: true } }),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count({ where: { status: 'DELETED' } }),
      this.prisma.tarotReader.count({ where: { availability: 'ONLINE' } }),
      this.prisma.call.count({ where: { status: { in: ['INITIATED', 'CONNECTED'] } } }),
      this.prisma.wallet.aggregate({ _sum: { balance: true } }),
      this.prisma.walletTransaction.aggregate({
        where: { type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.aggregate({
        where: { type: 'CONSUMPTION', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        clients,
        readers,
        admins,
        verified: verifiedUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        deleted: deletedUsers,
      },
      operations: {
        onlineReaders,
        activeCalls,
      },
      accounting: {
        totalWalletBalance: Number(walletAggregate._sum.balance ?? 0),
        totalDeposits: Number(deposits._sum.amount ?? 0),
        totalConsumption: Number(consumption._sum.amount ?? 0),
      },
    };
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        birthDate: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
          },
        },
        tarotReader: {
          select: {
            displayName: true,
            availability: true,
            ratePerMinute: true,
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
      wallet: user.wallet ? { balance: Number(user.wallet.balance) } : null,
      tarotReader: user.tarotReader
        ? {
            ...user.tarotReader,
            ratePerMinute: Number(user.tarotReader.ratePerMinute),
          }
        : null,
    }));
  }

  async updateUserRole(userId: string, role: UserRole, actorId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tarotReader: true },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      if (role === UserRole.TAROT_READER && !user.tarotReader) {
        await tx.tarotReader.create({
          data: {
            userId,
            displayName: `${user.firstName} ${user.lastName}`.trim() || user.email,
            bio: 'Perfil creado desde administración.',
            ratePerMinute: 2.0,
          },
        });
      }

      await tx.auditTrail.create({
        data: {
          action: 'ADMIN_USER_ROLE_UPDATED',
          actorId,
          metadata: { targetUserId: userId, email: user.email, role },
        },
      });

      return updatedUser;
    });
  }

  async getAccounting() {
    const transactions = await this.prisma.walletTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        wallet: {
          select: {
            user: {
              select: {
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: Number(transaction.amount),
      description: transaction.description,
      createdAt: transaction.createdAt,
      user: transaction.wallet.user,
    }));
  }
}
