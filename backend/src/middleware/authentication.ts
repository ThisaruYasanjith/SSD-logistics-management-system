import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  return cookies?.access_token;
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email, fullName: decoded.fullName };
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied: Insufficient permissions" });
    }

    next();
  };
};
