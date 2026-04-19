import express from "express";
import {
  createOrGetDirectRoom,
  createRoom,
  getRooms,
  joinRoomById,
} from "../controllers/room.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createRoom);
router.get("/", authMiddleware, getRooms);
router.post("/join/:roomId", authMiddleware, joinRoomById);
router.post("/direct/:userId", authMiddleware, createOrGetDirectRoom);

export default router;
