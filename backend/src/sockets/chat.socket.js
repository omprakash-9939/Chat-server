import prisma from "../utils/prisma.js";
import jwt from "jsonwebtoken";

import {
  addUserSocket,
  removeUserSocket,
  updateActivity,
} from "./presence.js";

import { isRoomMember } from "../utils/authRoom.js";
import { redis } from "../utils/redis.js";
import { validateSession } from "../utils/auth.js";

async function getRoomForWrite(userId, roomId) {
  const allowed = await isRoomMember(userId, roomId);
  if (!allowed) {
    return null;
  }

  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, isFrozen: true },
  });
}

export const initSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const session = await validateSession(decoded.sessionId);

      if (!session) {
        return next(new Error("Session expired"));
      }

      socket.user = decoded;

      next();
    } catch (err) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user.userId;

    await addUserSocket(userId, socket.id);

    io.emit("presence_update", {
      userId,
      status: "online",
    });

    socket.on("join_room", async (roomId) => {
      const allowed = await isRoomMember(userId, roomId);

      if (!allowed) {
        return socket.emit("error", "Not a room member");
      }

      socket.join(roomId);
    });

    socket.on("typing", async (roomIdRaw) => {
      const roomId = roomIdRaw;
      if (!roomId || typeof roomId !== "string") return;

      const room = await getRoomForWrite(userId, roomId);
      if (!room || room.isFrozen) return;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });

      socket.to(roomId).emit("user_typing", {
        userId,
        username: user?.username ?? "User",
      });
    });

    socket.on("stop_typing", async (roomIdRaw) => {
      const roomId = roomIdRaw;
      if (!roomId || typeof roomId !== "string") return;

      const allowed = await isRoomMember(userId, roomId);
      if (!allowed) return;

      socket.to(roomId).emit("user_stop_typing", {
        userId,
      });
    });

    socket.on("send_message", async (data) => {
      const { roomId, content } = data;

      try {
        const room = await getRoomForWrite(userId, roomId);

        if (!room) {
          return socket.emit("error", "Not allowed");
        }

        if (room.isFrozen) {
          return socket.emit("error", "This conversation is read-only");
        }

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });

        const message = await prisma.message.create({
          data: {
            content: content ?? "",
            roomId,
            senderId: userId,
            senderName: user?.username ?? "Deleted user",
          },
          include: {
            sender: { select: { id: true, username: true } },
            reads: { select: { userId: true, readAt: true } },
          },
        });

        io.to(roomId).emit("receive_message", message);
      } catch (err) {
        console.error("Message error:", err);
      }
    });

    socket.on("activity", async () => {
      await updateActivity(userId);
    });

    socket.on("mark_seen", async ({ roomId }) => {
      const allowed = await isRoomMember(userId, roomId);
      if (!allowed) return;

      const messages = await prisma.message.findMany({
        where: { roomId },
        select: { id: true },
      });

      await prisma.messageRead.createMany({
        data: messages.map((m) => ({
          messageId: m.id,
          userId,
        })),
        skipDuplicates: true,
      });

      socket.to(roomId).emit("messages_seen", {
        userId,
        roomId,
      });
    });

    socket.on("disconnect", async () => {
      await removeUserSocket(userId, socket.id);

      const remaining = await redis.scard(`user:${userId}:sockets`);
      if (remaining === 0) {
        io.emit("presence_update", {
          userId,
          status: "offline",
        });
      }
    });
  });

  setInterval(async () => {
    const keys = await redis.keys("user:*:sockets");
    const now = Date.now();

    for (const key of keys) {
      const userId = key.split(":")[1];
      const openTabs = await redis.scard(key);
      if (openTabs === 0) continue;

      const lastActive = await redis.get(`user:${userId}:lastActive`);
      if (!lastActive) continue;

      if (now - Number(lastActive) > 60_000) {
        const status = await redis.get(`user:${userId}:status`);

        if (status !== "afk") {
          await redis.set(`user:${userId}:status`, "afk");

          io.emit("presence_update", {
            userId,
            status: "afk",
          });
        }
      }
    }
  }, 10_000);
};
