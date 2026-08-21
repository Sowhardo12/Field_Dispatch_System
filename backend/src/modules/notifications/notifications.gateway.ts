import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate socket via query token: ws://localhost:3000/notifications?token=<JWT>
      const token = client.handshake.query.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Attach user ID to socket data and join user-specific private room
      client.data.userId = userId;
      const roomName = `user:${userId}`;
      client.join(roomName);

      this.logger.log(`Client connected: Socket ID ${client.id} joined room [${roomName}]`);
    } catch (err) {
      this.logger.error(`WebSocket Authentication failed for socket ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: Socket ID ${client.id}`);
  }

  /**
   * Helper method to emit a real-time event to a specific user
   */
  notifyUser(userId: number, event: string, payload: any) {
    const roomName = `user:${userId}`;
    this.server.to(roomName).emit(event, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Notification [${event}] sent to room [${roomName}]`);
  }
}