import { redis } from "../utils/redis.js";

export const addUserSocket = async (userId, socketId) => {
  await redis.sadd(`user:${userId}:sockets`, socketId);
  await redis.set(`user:${userId}:status`, "online");
  await redis.set(`user:${userId}:lastActive`, String(Date.now()));
};

export const removeUserSocket = async (userId, socketId) => {
  await redis.srem(`user:${userId}:sockets`, socketId);
  const count = await redis.scard(`user:${userId}:sockets`);
  if (count === 0) {
    await redis.set(`user:${userId}:status`, "offline");
    await redis.del(`user:${userId}:sockets`);
  }
};

export const updateActivity = async (userId) => {
  await redis.set(`user:${userId}:lastActive`, String(Date.now()));
  const count = await redis.scard(`user:${userId}:sockets`);
  if (count > 0) {
    await redis.set(`user:${userId}:status`, "online");
  }
};

export const getUserStatus = async (userId) => {
  const status = await redis.get(`user:${userId}:status`);
  return status || "offline";
};
