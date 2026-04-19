import prisma from "../utils/prisma.js";
import { isRoomMember } from "../utils/authRoom.js";
import { deleteUploadedFile } from "../utils/fileStorage.js";
import { getSocketIO } from "../sockets/socket-io-instance.js";

async function getRoomForMessageAccess(userId, messageId) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      room: true,
      sender: {
        select: { id: true, username: true },
      },
      reads: { select: { userId: true, readAt: true } },
    },
  });

  if (!message) {
    return null;
  }

  const allowed = await isRoomMember(userId, message.roomId);
  if (!allowed) {
    return null;
  }

  return message;
}

export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { cursor, limit = 50 } = req.query;

    const allowed = await isRoomMember(req.user.userId, roomId);

    if (!allowed) {
      return res.status(403).json({ error: "Forbidden - not a room member" });
    }

    const take = Math.min(Number(limit) || 50, 100);

    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        sender: { select: { id: true, username: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    });

    const nextCursor =
      messages.length > 0 ? messages[messages.length - 1].id : null;

    res.json({
      messages,
      nextCursor,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const message = await getRoomForMessageAccess(userId, messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.room.isFrozen) {
      return res.status(403).json({ error: "This conversation is read-only" });
    }

    if (message.senderId !== userId) {
      return res
        .status(403)
        .json({ error: "You can edit only your own messages" });
    }

    if (message.deletedAt) {
      return res
        .status(400)
        .json({ error: "Deleted messages cannot be edited" });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        editedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, username: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    });

    const io = getSocketIO();
    io?.to(updated.roomId).emit("message_updated", updated);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const message = await getRoomForMessageAccess(userId, messageId);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.room.isFrozen) {
      return res.status(403).json({ error: "This conversation is read-only" });
    }

    const canDelete =
      message.senderId === userId || message.room.ownerId === userId;

    if (!canDelete) {
      return res.status(403).json({
        error: "Only the author or the room owner can delete this message",
      });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: "",
        fileName: null,
        fileUrl: null,
        deletedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, username: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    });

    await deleteUploadedFile(message.fileUrl);

    const io = getSocketIO();
    io?.to(updated.roomId).emit("message_deleted", updated);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
