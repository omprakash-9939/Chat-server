import jwt from "jsonwebtoken";
import { validateSession } from "../utils/auth.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Format: Bearer TOKEN
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = await validateSession(decoded.sessionId);

    if (!session) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};
