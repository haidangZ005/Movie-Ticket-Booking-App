import { io, Socket } from 'socket.io-client';
import { API_ORIGIN } from '../config/api';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(API_ORIGIN, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }

  return socket;
};

export default {
  getSocket,
};
