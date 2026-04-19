import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "./prisma.js";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_DURATION_MS = 60 * 60 * 1000;

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateResetToken() {
  return crypto.randomBytes(24).toString("hex");
}

export async function createSession(userId) {
  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.userSession.create({
    data: {
      tokenId,
      userId,
      expiresAt,
    },
  });

  const token = jwt.sign({ userId, sessionId: tokenId }, requireJwtSecret(), {
    expiresIn: "30d",
  });

  return { token, tokenId, expiresAt };
}

export async function revokeSession(tokenId) {
  if (!tokenId) return;

  await prisma.userSession.updateMany({
    where: {
      tokenId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function validateSession(tokenId) {
  if (!tokenId) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenId },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export function getPasswordResetExpiry() {
  return new Date(Date.now() + PASSWORD_RESET_DURATION_MS);
}
