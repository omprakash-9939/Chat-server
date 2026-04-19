import { redis } from "../utils/redis.js";

export const getUserStatus = async (req, res) => {
  const { userId } = req.params;

  const status = await redis.get(`user:${userId}:status`);

  res.json({
    userId,
    status: status || "offline",
  });
};