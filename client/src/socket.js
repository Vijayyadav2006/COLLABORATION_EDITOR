import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Adjust the URL as needed

export const initSocket = () => {
  return io(SOCKET_URL);
};
