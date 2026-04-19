import express from "express";
import {
  deleteMessage,
  editMessage,
  getMessages,
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:roomId", authMiddleware, getMessages);
router.patch("/item/:messageId", authMiddleware, editMessage);
router.delete("/item/:messageId", authMiddleware, deleteMessage);

export default router;
