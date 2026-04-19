// import prisma from "./prisma.js";

// export const isRoomMember = async (userId, roomId) => {
//   const room = await prisma.room.findFirst({
//     where: {
//       id: roomId,
//       members: {
//         some: {
//           id: userId
//         }
//       }
//     }
//   });

//   return !!room;
// };


import prisma from "./prisma.js";

export const isRoomMember = async (userId, roomId) => {
  const room = await prisma.room.findFirst({
    where: {
      id: roomId,
      members: {
        some: {
          id: userId,
        },
      },
    },
  });

  return !!room;
};