import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CallType, CallStatus, ReaderAvailability } from '@prisma/client';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async createCall(clientId: string, readerUserId: string, type: CallType) {
    // 1. Get reader profile rate
    const reader = await this.prisma.tarotReader.findUnique({
      where: { userId: readerUserId },
    });

    if (!reader) {
      throw new NotFoundException('Tarotista no encontrado');
    }

    if (reader.availability !== ReaderAvailability.ONLINE) {
      throw new BadRequestException('El tarotista no está disponible en este momento');
    }

    // 2. Set reader status to busy
    await this.prisma.tarotReader.update({
      where: { id: reader.id },
      data: { availability: ReaderAvailability.BUSY },
    });

    // 3. Create call record
    return this.prisma.call.create({
      data: {
        clientId,
        readerId: reader.id,
        type,
        status: CallStatus.INITIATED,
        ratePerMinute: reader.ratePerMinute,
        totalCharged: 0.00,
      },
    });
  }

  async startCall(callId: string, socketRoomId: string) {
    return this.prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.CONNECTED,
        startTime: new Date(),
        socketRoomId,
      },
    });
  }

  async endCall(callId: string, totalCharged: number) {
    const call = await this.prisma.call.findUnique({
      where: { id: callId },
      include: { reader: true },
    });

    if (!call) return;

    // 1. Update call record
    const updatedCall = await this.prisma.call.update({
      where: { id: callId },
      data: {
        status: CallStatus.COMPLETED,
        endTime: new Date(),
        totalCharged,
      },
    });

    // 2. Set reader profile back to ONLINE
    await this.prisma.tarotReader.update({
      where: { id: call.readerId },
      data: { availability: ReaderAvailability.ONLINE },
    });

    // 3. Record Audit
    await this.prisma.auditTrail.create({
      data: {
        action: 'CALL_ENDED',
        actorId: call.clientId,
        metadata: { callId, totalCharged, rate: Number(call.ratePerMinute) },
      },
    });

    return updatedCall;
  }

  async setReaderOffline(readerUserId: string) {
    return this.prisma.tarotReader.update({
      where: { userId: readerUserId },
      data: { availability: ReaderAvailability.OFFLINE },
    });
  }

  async getOnlineReaders() {
    return this.prisma.tarotReader.findMany({
      where: { availability: ReaderAvailability.ONLINE },
      select: {
        id: true,
        displayName: true,
        bio: true,
        ratePerMinute: true,
        availability: true,
        profileImage: true,
        user: {
          select: { id: true, email: true }
        }
      }
    });
  }
}
