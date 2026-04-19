import { io } from "socket.io-client";
import { getSocketOrigin } from "../config";

export const socket = io(getSocketOrigin(), {
  autoConnect: false,
  path: "/socket.io",
});
