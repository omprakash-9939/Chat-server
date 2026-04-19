import prisma from "./prisma.js";

/**
 * Check if user is member of room
 * Used everywhere: API + Socket
 */
export const isRoomMember = async (userId, roomId) => {
  const member = await prisma.room.findFirst({
    where: {
      id: roomId,
      members: {
        some: {
          id: userId,
        },
      },
    },
  });

  return !!member;
};
