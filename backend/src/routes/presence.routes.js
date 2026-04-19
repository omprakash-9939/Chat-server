import express from "express";
import { getUserStatus } from "../controllers/presence.controller.js";

const router = express.Router();

router.get("/:userId", getUserStatus);

export default router;