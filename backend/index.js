import "dotenv/config";
import fs from "fs";
import app from "./src/app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocket } from "./src/sockets/chat.socket.js";
import { setSocketIO } from "./src/sockets/socket-io-instance.js";

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

setSocketIO(io);
initSocket(io);

const PORT = Number(process.env.PORT || 3000);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: GET http://localhost:${PORT}/api/health`);
  console.log(`Users:  GET http://localhost:${PORT}/api/users (Bearer token required)`);
});