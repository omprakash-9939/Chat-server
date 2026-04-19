import prisma from "../utils/prisma.js";
import { ensureNotBlocked, getDirectPairKey } from "../utils/contacts.js";

function serializeRoom(room, currentUserId) {
  const otherMember = room.isDirect
    ? room.members.find((member) => member.id !== currentUserId)
    : null;

  return {
    id: room.id,
    name: room.name,
    createdAt: room.createdAt,
    isDirect: room.isDirect,
    isFrozen: room.isFrozen,
    ownerId: room.ownerId,
    displayName: room.isDirect
      ? otherMember?.username || "Direct message"
      : room.name || "Unnamed room",
    otherMember: otherMember
      ? {
          id: otherMember.id,
          username: otherMember.username,
          email: otherMember.email,
        }
      : null,
  };
}

export const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Room name required" });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.json(serializeRoom(room, userId));
  } catch (err) {
    console.error(err);
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Room name already taken" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

export const getRooms = async (req, res) => {
  try {
    const userId = req.user.userId;
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: { id: userId },
        },
      },
      include: {
        members: {
          select: { id: true, username: true, email: true },
        },
      },
      orderBy: [{ isDirect: "asc" }, { createdAt: "asc" }],
    });
    res.json(rooms.map((room) => serializeRoom(room, userId)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const joinRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    if (!existingRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (existingRoom.isDirect) {
      return res.status(400).json({ error: "Direct rooms cannot be joined" });
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.json(serializeRoom(room, userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const createOrGetDirectRoom = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { userId: otherUserId } = req.params;

    if (!otherUserId || otherUserId === userId) {
      return res.status(400).json({ error: "Invalid direct room target" });
    }

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, username: true, email: true },
    });

    if (!otherUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const allowed = await ensureNotBlocked(userId, otherUserId);
    if (!allowed) {
      return res.status(403).json({ error: "Direct messaging is blocked" });
    }

    const pairKey = getDirectPairKey(userId, otherUserId);

    const room = await prisma.room.upsert({
      where: { directPairKey: pairKey },
      update: {
        members: {
          connect: [{ id: userId }, { id: otherUserId }],
        },
      },
      create: {
        isDirect: true,
        directPairKey: pairKey,
        members: {
          connect: [{ id: userId }, { id: otherUserId }],
        },
      },
      include: {
        members: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.json(serializeRoom(room, userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
