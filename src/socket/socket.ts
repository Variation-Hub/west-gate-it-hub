import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | undefined;

export function initSocket(server: Server): void {
  io = new SocketIOServer(server, { cors: { origin: process.env.Frontend_URL } });
  console.log("socket initialized")
}

export function getIo(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
