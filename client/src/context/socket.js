import { io } from 'socket.io-client';

import React from 'react';

export const socket = io(window.location.origin, {
  autoConnect: false
});
socket.on('connect', () => {
  console.log('connected to server');
});
socket.on('connect_error', err => {
  console.log(`Could not connect to the socket api - ${err.message}`);
});
socket.on('disconnect', (reason) => {
  console.log(`disconnected from server - ${reason}`);
});
export const SocketContext = React.createContext();
