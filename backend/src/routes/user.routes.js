import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  banUser,
  changePassword,
  deleteAccount,
  getContacts,
  getMe,
  listUsersWithPresence,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", authMiddleware, listUsersWithPresence);
router.get("/me", authMiddleware, getMe);
router.get("/contacts", authMiddleware, getContacts);
router.post("/friend-requests", authMiddleware, sendFriendRequest);
router.post(
  "/friend-requests/:requestId/respond",
  authMiddleware,
  respondToFriendRequest,
);
router.delete("/friends/:friendId", authMiddleware, removeFriend);
router.post("/bans/:userId", authMiddleware, banUser);
router.post("/change-password", authMiddleware, changePassword);
router.post("/delete-account", authMiddleware, deleteAccount);

export default router;
