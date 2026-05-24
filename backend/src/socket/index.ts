import { Application } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer as ExpressHttpServer } from 'http';

let io: SocketIOServer | null = null;

/**
 * Khởi tạo Socket.IO server.
 * Được gọi trong server.ts sau khi app.listen().
 *
 * Room naming: show_{showId}
 * Events:
 *  - 'seat:hold'    — Ghế vừa được khóa tạm (10 phút)
 *  - 'seat:release' — Ghế vừa được giải phóng
 *  - 'seat:booked'  — Ghế đã được đặt thành công (thanh toán xong)
 *  - 'booking:expired' — Đơn đặt hết hạn 10 phút
 */
export function initSocketIO(app: Application | ExpressHttpServer): SocketIOServer {
  io = new SocketIOServer(app as any, {
    cors: {
      origin: process.env.WS_CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client join vào room suất chiếu
    // Client gọi: socket.emit('join_show', { showId })
    socket.on('join_show', (data: { showId: number }) => {
      const room = `show_${data.showId}`;
      socket.join(room);
      console.log(`[Socket.IO] ${socket.id} joined room ${room}`);
    });

    // Client rời khỏi room
    socket.on('leave_show', (data: { showId: number }) => {
      const room = `show_${data.showId}`;
      socket.leave(room);
      console.log(`[Socket.IO] ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Lấy Socket.IO server instance — dùng trong jobs để broadcast.
 */
export function getSocketIO(): SocketIOServer | null {
  return io;
}

/**
 * Helper: broadcast seat status change đến tất cả client trong room.
 */
export function broadcastSeatUpdate(
  showId: number,
  seatId: number,
  seatNumber: string,
  status: 'HOLDING' | 'AVAILABLE' | 'BOOKED',
  holdBy?: number | null
) {
  if (!io) return;
  const room = `show_${showId}`;
  io.to(room).emit('seat_update', {
    showId,
    seatId,
    seatNumber,
    status,
    holdBy: holdBy ?? null,
  });
}
