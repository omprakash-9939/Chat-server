import express from "express";
// import { upload } from "../utils/multer.js";
// import { uploadFileMessage } from "../controllers/upload.controller.js";
// import { authMiddleware } from "../middlewares/auth.middleware.js";
import { uploadFileMessage } from "../controllers/upload.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { upload } from "../utils/multer.js";

const router = express.Router();

// 📤 file upload endpoint
router.post(
  "/",
  authMiddleware,
  upload.single("file"),
  uploadFileMessage
);

export default router;