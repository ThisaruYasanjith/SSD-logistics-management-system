import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const PLACEHOLDER_SECRETS = new Set([
  "your_jwt_secret_key_here",
  "your_jwt_secret",
  "sJY9dS68PU",
  "secret",
  "changeme",
]);

const resolveJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET?.trim();

  if (secret && !PLACEHOLDER_SECRETS.has(secret) && secret.length >= 16) {
    return secret;
  }

  console.warn(
    "⚠️ Note: Using default secure JWT secret for development. Set JWT_SECRET in .env for custom key."
  );
  return "dev_secure_fallback_secret_f4a7c1e9b2d3f6a8e0c2b4d6f8a0c2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c8";
};

const JWT_SECRET = resolveJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30min";

export type TokenPayload = {
  id: string;
  email: string;
  role: string;
  fullName: string;
};

export const generateToken = (user: TokenPayload) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & TokenPayload;
};

export const TOKEN_TTL_MS = (() => {
  const ttl = process.env.JWT_TTL_MS || "1800000";
  const parsed = Number(ttl);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1800000;
})();

export const generateStrongSecret = () => crypto.randomBytes(64).toString("hex");
