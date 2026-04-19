import bcrypt from "bcrypt";
import prisma from "../utils/prisma.js";
import { redis } from "../utils/redis.js";
import { revokeSession } from "../utils/auth.js";
import {
  ensureNotBlocked,
  freezeDirectRoomsForUsers,
} from "../utils/contacts.js";
import { deleteUploadedFile } from "../utils/fileStorage.js";

async function getPresenceStatus(userId) {
  try {
    return (await redis.get(`user:${userId}:status`)) || "offline";
  } catch {
    return "offline";
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, username: true },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const listUsersWithPresence = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const [users, outgoingRequests, incomingRequests, friends, bans] =
      await Promise.all([
        prisma.user.findMany({
          select: { id: true, username: true, email: true },
          orderBy: { username: "asc" },
        }),
        prisma.friendRequest.findMany({
          where: {
            senderId: currentUserId,
            status: "PENDING",
          },
          select: { receiverId: true },
        }),
        prisma.friendRequest.findMany({
          where: {
            receiverId: currentUserId,
            status: "PENDING",
          },
          select: { senderId: true },
        }),
        prisma.friendship.findMany({
          where: { userId: currentUserId },
          select: { friendId: true },
        }),
        prisma.userBan.findMany({
          where: {
            OR: [{ blockerId: currentUserId }, { blockedId: currentUserId }],
          },
          select: { blockerId: true, blockedId: true },
        }),
      ]);

    const sentTo = new Set(outgoingRequests.map((item) => item.receiverId));
    const receivedFrom = new Set(incomingRequests.map((item) => item.senderId));
    const friendIds = new Set(friends.map((item) => item.friendId));
    const blockedIds = new Set(
      bans.map((item) =>
        item.blockerId === currentUserId ? item.blockedId : item.blockerId,
      ),
    );

    const withStatus = await Promise.all(
      users.map(async (u) => ({
        ...u,
        status: await getPresenceStatus(u.id),
        isFriend: friendIds.has(u.id),
        hasPendingRequestFromThem: receivedFrom.has(u.id),
        hasPendingRequestToThem: sentTo.has(u.id),
        isBlocked: blockedIds.has(u.id),
      })),
    );

    res.json(withStatus);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [friends, incomingRequests, outgoingRequests, bans] =
      await Promise.all([
        prisma.friendship.findMany({
          where: { userId },
          orderBy: { createdAt: "asc" },
          include: {
            friend: {
              select: { id: true, username: true, email: true },
            },
          },
        }),
        prisma.friendRequest.findMany({
          where: {
            receiverId: userId,
            status: "PENDING",
          },
          orderBy: { createdAt: "desc" },
          include: {
            sender: { select: { id: true, username: true, email: true } },
          },
        }),
        prisma.friendRequest.findMany({
          where: {
            senderId: userId,
            status: "PENDING",
          },
          orderBy: { createdAt: "desc" },
          include: {
            receiver: { select: { id: true, username: true, email: true } },
          },
        }),
        prisma.userBan.findMany({
          where: { blockerId: userId },
          orderBy: { createdAt: "desc" },
          include: {
            blocked: { select: { id: true, username: true, email: true } },
          },
        }),
      ]);

    res.json({
      friends: friends.map((item) => ({
        id: item.friend.id,
        username: item.friend.username,
        email: item.friend.email,
        createdAt: item.createdAt,
      })),
      incomingRequests: incomingRequests.map((item) => ({
        id: item.id,
        message: item.message,
        createdAt: item.createdAt,
        user: item.sender,
      })),
      outgoingRequests: outgoingRequests.map((item) => ({
        id: item.id,
        message: item.message,
        createdAt: item.createdAt,
        user: item.receiver,
      })),
      bans: bans.map((item) => ({
        id: item.blocked.id,
        username: item.blocked.username,
        email: item.blocked.email,
        createdAt: item.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { username, message } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ error: "Username is required" });
    }

    const receiver = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: { id: true, username: true, email: true },
    });

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    if (receiver.id === senderId) {
      return res.status(400).json({ error: "You cannot add yourself" });
    }

    const allowed = await ensureNotBlocked(senderId, receiver.id);
    if (!allowed) {
      return res.status(403).json({ error: "Contact is blocked" });
    }

    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        userId_friendId: {
          userId: senderId,
          friendId: receiver.id,
        },
      },
    });

    if (existingFriendship) {
      return res.status(400).json({ error: "Already friends" });
    }

    const inversePending = await prisma.friendRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: receiver.id,
          receiverId: senderId,
        },
      },
    });

    if (inversePending?.status === "PENDING") {
      return res.status(400).json({
        error: "This user already sent you a request. Accept it instead.",
      });
    }

    const request = await prisma.friendRequest.upsert({
      where: {
        senderId_receiverId: {
          senderId,
          receiverId: receiver.id,
        },
      },
      update: {
        status: "PENDING",
        message: message?.trim() || null,
      },
      create: {
        senderId,
        receiverId: receiver.id,
        message: message?.trim() || null,
      },
    });

    res.json({
      message: "Friend request sent",
      request,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const respondToFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const receiverId = req.user.userId;

    if (!["accept", "decline"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.receiverId !== receiverId) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ error: "Friend request already handled" });
    }

    if (action === "decline") {
      await prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "DECLINED" },
      });
      return res.json({ message: "Friend request declined" });
    }

    const allowed = await ensureNotBlocked(request.senderId, receiverId);
    if (!allowed) {
      return res.status(403).json({ error: "Contact is blocked" });
    }

    await prisma.$transaction([
      prisma.friendRequest.update({
        where: { id: request.id },
        data: { status: "ACCEPTED" },
      }),
      prisma.friendship.upsert({
        where: {
          userId_friendId: {
            userId: request.senderId,
            friendId: receiverId,
          },
        },
        update: {},
        create: {
          userId: request.senderId,
          friendId: receiverId,
        },
      }),
      prisma.friendship.upsert({
        where: {
          userId_friendId: {
            userId: receiverId,
            friendId: request.senderId,
          },
        },
        update: {},
        create: {
          userId: receiverId,
          friendId: request.senderId,
        },
      }),
    ]);

    res.json({ message: "Friend request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const removeFriend = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    await prisma.$transaction([
      prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      }),
      prisma.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId, status: "PENDING" },
            { senderId: friendId, receiverId: userId, status: "PENDING" },
          ],
        },
        data: {
          status: "CANCELED",
        },
      }),
    ]);

    res.json({ message: "Friend removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const banUser = async (req, res) => {
  try {
    const blockerId = req.user.userId;
    const { userId: blockedId } = req.params;

    if (blockerId === blockedId) {
      return res.status(400).json({ error: "You cannot ban yourself" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userBan.upsert({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
        update: {},
        create: {
          blockerId,
          blockedId,
        },
      });

      await tx.friendship.deleteMany({
        where: {
          OR: [
            { userId: blockerId, friendId: blockedId },
            { userId: blockedId, friendId: blockerId },
          ],
        },
      });

      await tx.friendRequest.updateMany({
        where: {
          OR: [
            { senderId: blockerId, receiverId: blockedId, status: "PENDING" },
            { senderId: blockedId, receiverId: blockerId, status: "PENDING" },
          ],
        },
        data: {
          status: "CANCELED",
        },
      });
    });

    await freezeDirectRoomsForUsers(blockerId, blockedId);

    res.json({ message: "User banned" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ message: "Password changed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Password is incorrect" });
    }

    const ownedRooms = await prisma.room.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        messages: {
          where: {
            fileUrl: {
              not: null,
            },
          },
          select: {
            fileUrl: true,
          },
        },
      },
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    await Promise.all(
      ownedRooms.flatMap((room) =>
        room.messages.map((message) => deleteUploadedFile(message.fileUrl)),
      ),
    );

    await revokeSession(req.user.sessionId);

    res.json({ message: "Account deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
