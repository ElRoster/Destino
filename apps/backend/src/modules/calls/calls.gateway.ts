import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CallsService } from './calls.service';
import { WalletService } from '../wallet/wallet.service';
import { CallType, SocketEvents } from '@tarot-platform/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track socket connections (userId -> Socket)
  private activeSockets = new Map<string, Socket>();
  
  // Track active call billing loops (callId -> NodeJS.Timeout)
  private billingLoops = new Map<string, NodeJS.Timeout>();

  // Track call cumulative charges (callId -> totalCharged)
  private callCharges = new Map<string, number>();

  // Track call current tick count (callId -> minuteTick)
  private callTicks = new Map<string, number>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private callsService: CallsService,
    private walletService: WalletService
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        socket.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      socket.data = { userId: payload.sub, role: payload.role, email: payload.email };
      this.activeSockets.set(payload.sub, socket);
      
      console.log(`Socket client connected: ${payload.email} (ID: ${socket.id})`);
    } catch (err) {
      console.log('Socket connection unauthorized, disconnecting...');
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const userId = socket.data?.userId;
    if (userId) {
      this.activeSockets.delete(userId);
      console.log(`Socket client disconnected: ${socket.data.email}`);

      // Handle mid-call disconnections
      // We look up if this user was in an active billing call and terminate it
      for (const [callId, timer] of this.billingLoops.entries()) {
        if (callId.includes(userId)) {
          this.terminateActiveCall(callId, `Usuario desconectado: ${socket.data.email}`);
        }
      }
      
      if (socket.data.role === 'TAROT_READER') {
        this.callsService.setReaderOffline(userId).catch(console.error);
      }
    }
  }

  // --- Call Request / Response ---

  @SubscribeMessage(SocketEvents.CALL_REQUEST)
  async handleCallRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { readerUserId: string; type: CallType }
  ) {
    const clientId = client.data.userId;
    const readerUserId = data.readerUserId;

    const readerSocket = this.activeSockets.get(readerUserId);
    if (!readerSocket) {
      client.emit(SocketEvents.CALL_ERROR, { message: 'El tarotista no se encuentra en línea' });
      return;
    }

    try {
      // 1. Create call database entry (updates Reader status to BUSY)
      const call = await this.callsService.createCall(clientId, readerUserId, data.type);

      // 2. Notify reader about incoming call request
      readerSocket.emit(SocketEvents.CALL_REQUEST, {
        callId: call.id,
        clientId,
        clientEmail: client.data.email,
        type: data.type,
        ratePerMinute: Number(call.ratePerMinute),
      });

      console.log(`Call requested: Client ${client.data.email} to Reader ${readerUserId} (CallId: ${call.id})`);
    } catch (error: any) {
      client.emit(SocketEvents.CALL_ERROR, { message: error.message || 'Error al iniciar llamada' });
    }
  }

  @SubscribeMessage(SocketEvents.CALL_RESPONSE)
  async handleCallResponse(
    @ConnectedSocket() readerSocket: Socket,
    @MessageBody() data: { callId: string; accept: boolean; clientId: string }
  ) {
    const clientSocket = this.activeSockets.get(data.clientId);
    if (!clientSocket) {
      // Clean up reader availability if client disappeared
      await this.callsService.endCall(data.callId, 0.0);
      readerSocket.emit(SocketEvents.CALL_ERROR, { message: 'El cliente se desconectó' });
      return;
    }

    if (!data.accept) {
      // Reject Call: Complete call in DB as FAILED/CANCELLED and reset reader availability
      await this.callsService.endCall(data.callId, 0.0);
      clientSocket.emit(SocketEvents.CALL_RESPONSE, { accept: false });
      return;
    }

    // Accept Call: Connect both to call room
    const roomId = `room:${data.callId}`;
    clientSocket.join(roomId);
    readerSocket.join(roomId);

    // Update DB status to CONNECTED
    const call = await this.callsService.startCall(data.callId, roomId);

    clientSocket.emit(SocketEvents.CALL_RESPONSE, {
      accept: true,
      callId: call.id,
      roomId,
    });
    
    readerSocket.emit(SocketEvents.CALL_RESPONSE, {
      accept: true,
      callId: call.id,
      roomId,
    });

    console.log(`Call accepted. Room created: ${roomId}`);

    // Trigger billing ticks
    this.startBillingLoop(call.id, data.clientId, readerSocket.data.userId, Number(call.ratePerMinute));
  }

  // --- WebRTC signaling relay ---

  @SubscribeMessage(SocketEvents.WEBRTC_OFFER)
  handleOffer(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomId: string; sdp: any }) {
    socket.to(data.roomId).emit(SocketEvents.WEBRTC_OFFER, { sdp: data.sdp });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ANSWER)
  handleAnswer(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomId: string; sdp: any }) {
    socket.to(data.roomId).emit(SocketEvents.WEBRTC_ANSWER, { sdp: data.sdp });
  }

  @SubscribeMessage(SocketEvents.WEBRTC_ICE_CANDIDATE)
  handleIceCandidate(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomId: string; candidate: any }) {
    socket.to(data.roomId).emit(SocketEvents.WEBRTC_ICE_CANDIDATE, { candidate: data.candidate });
  }

  // --- Call Termination ---

  @SubscribeMessage(SocketEvents.CALL_END)
  async handleCallEnd(@ConnectedSocket() socket: Socket, @MessageBody() data: { callId: string }) {
    console.log(`Call hangup requested for CallId: ${data.callId}`);
    await this.terminateActiveCall(data.callId, 'Llamada finalizada por el usuario');
  }

  // --- Real-time Chat ---

  @SubscribeMessage(SocketEvents.CHAT_MESSAGE)
  handleChatMessage(@ConnectedSocket() socket: Socket, @MessageBody() data: { roomId: string; message: string }) {
    this.server.to(data.roomId).emit(SocketEvents.CHAT_MESSAGE, {
      senderId: socket.data.userId,
      email: socket.data.email,
      message: data.message,
      timestamp: new Date().toISOString(),
    });
  }

  // --- Billing Loop Management ---

  private startBillingLoop(callId: string, clientId: string, readerUserId: string, rate: number) {
    this.callCharges.set(callId, 0.0);
    this.callTicks.set(callId, 0);

    const intervalId = setInterval(async () => {
      const currentTick = (this.callTicks.get(callId) || 0) + 1;
      this.callTicks.set(callId, currentTick);

      console.log(`Billing Tick #${currentTick} for Call: ${callId}. Rate: ${rate}`);

      try {
        // Execute atomic consumption transaction
        const result = await this.walletService.consumeTokensPerMinute(
          clientId,
          readerUserId,
          callId,
          rate,
          currentTick
        );

        // Accumulate cost
        const currentCharge = this.callCharges.get(callId) || 0.0;
        this.callCharges.set(callId, currentCharge + rate);

        // Emit updated client balance
        const clientSocket = this.activeSockets.get(clientId);
        if (clientSocket) {
          clientSocket.emit(SocketEvents.WALLET_TICK, { balance: result.clientBalance });
        }

      } catch (error: any) {
        console.log(`Billing Loop Error: ${error.message}. Dropping call...`);
        
        // Notify both parties that tokens have been depleted
        const roomId = `room:${callId}`;
        this.server.to(roomId).emit(SocketEvents.TOKEN_DEPLETED, { message: 'Saldo insuficiente. Llamada finalizada.' });

        // Terminate WebRTC call
        await this.terminateActiveCall(callId, 'Saldo insuficiente');
      }
    }, 60 * 1000); // 1 minute intervals

    this.billingLoops.set(callId, intervalId);
  }

  private async terminateActiveCall(callId: string, reason: string) {
    const timer = this.billingLoops.get(callId);
    if (timer) {
      clearInterval(timer);
      this.billingLoops.delete(callId);
    }

    const charge = this.callCharges.get(callId) || 0.0;
    this.callCharges.delete(callId);
    this.callTicks.delete(callId);

    // Save final call state in Postgres
    await this.callsService.endCall(callId, charge);

    // Emit event to end WebRTC components
    const roomId = `room:${callId}`;
    this.server.to(roomId).emit(SocketEvents.CALL_END, { reason });
    
    // Disconnect clients from room
    this.server.in(roomId).socketsLeave(roomId);
    console.log(`Call ${callId} successfully closed. Total charged: ${charge}. Reason: ${reason}`);
  }
}
