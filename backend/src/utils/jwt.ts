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

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Refusing to start. Generate one with: " +
        "node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }

  if (PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      `JWT_SECRET is set to a known placeholder value ("${secret}"). ` +
        "Refusing to start, otherwise anyone could forge valid tokens. " +
        "Generate a strong secret with: " +
        "node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
  }

  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET is too short (${secret.length} chars). At least 32 characters are required.`
    );
  }

  return secret;
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
