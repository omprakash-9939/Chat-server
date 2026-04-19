import express from "express";
import cors from "cors";
// import authRoutes from "./routes/auth.routes.js";
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js";
import roomRoutes from "./routes/room.routes.js";
import messageRoutes from "./routes/message.routes.js";
import presenceRoutes from "./routes/presence.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "chat-backend",
    hint: "GET /api/users requires header: Authorization: Bearer <jwt>",
  });
});

app.use("/api/presence", presenceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static("uploads"));


export default app;
