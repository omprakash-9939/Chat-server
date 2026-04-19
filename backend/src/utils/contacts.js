import prisma from "./prisma.js";

export async function getBanBetween(userId, otherUserId) {
  if (!userId || !otherUserId) return null;

  return prisma.userBan.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
  });
}

export async function ensureNotBlocked(userId, otherUserId) {
  const ban = await getBanBetween(userId, otherUserId);
  return !ban;
}

export function getDirectPairKey(userId, otherUserId) {
  return [userId, otherUserId].sort().join(":");
}

export async function freezeDirectRoomsForUsers(userId, otherUserId) {
  const pairKey = getDirectPairKey(userId, otherUserId);

  await prisma.room.updateMany({
    where: {
      isDirect: true,
      directPairKey: pairKey,
    },
    data: {
      isFrozen: true,
    },
  });
}
