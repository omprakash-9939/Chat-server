import bcrypt from "bcrypt";
import prisma from "../utils/prisma.js";
import {
  createSession,
  generateResetToken,
  getPasswordResetExpiry,
  hashToken,
  revokeSession,
} from "../utils/auth.js";

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}

export const register = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existing) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        username: username.trim(),
        password: hashed,
      },
    });

    res.json({
      message: "User created",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email?.trim() },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const { token } = await createSession(user.id);

    res.json({
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    await revokeSession(req.user.sessionId);
    res.json({ message: "Signed out from this session" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.json({
        message: "If the account exists, a reset token has been issued.",
      });
    }

    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: getPasswordResetExpiry(),
      },
    });

    res.json({
      message: "Password reset token created.",
      resetToken: rawToken,
      expiresInMinutes: 60,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, reset token, and new password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid reset request" });
    }

    const storedToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!storedToken) {
      return res.status(400).json({ error: "Reset token is invalid or expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: storedToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.userSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    res.json({ message: "Password has been reset" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
