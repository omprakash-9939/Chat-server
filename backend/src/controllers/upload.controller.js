import prisma from "../utils/prisma.js";
import { isRoomMember } from "../utils/authRoom.js";
import { getSocketIO } from "../sockets/socket-io-instance.js";

export const uploadFileMessage = async (req, res) => {
  try {
    const { roomId, content } = req.body;
    const file = req.file;
    const userId = req.user.userId;

    const allowed = await isRoomMember(userId, roomId);

    if (!allowed) {
      return res.status(403).json({ error: "Not allowed" });
    }

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const [room, user] = await Promise.all([
      prisma.room.findUnique({
        where: { id: roomId },
        select: { isFrozen: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      }),
    ]);

    if (room?.isFrozen) {
      return res.status(403).json({ error: "This conversation is read-only" });
    }

    const publicPath = `/uploads/${file.filename}`;

    const message = await prisma.message.create({
      data: {
        content: content || "",
        roomId,
        senderId: userId,
        senderName: user?.username || "Deleted user",
        fileUrl: publicPath,
        fileName: file.originalname,
      },
      include: {
        sender: { select: { id: true, username: true } },
        reads: { select: { userId: true, readAt: true } },
      },
    });

    const io = getSocketIO();
    if (io) {
      io.to(roomId).emit("receive_message", message);
    }

    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};
