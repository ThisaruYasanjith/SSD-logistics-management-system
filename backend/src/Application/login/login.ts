import { Request, Response } from "express";
import staffMembers from "../../Infrastructure/schemas/staff";
import bcrypt from "bcryptjs";
import { generateToken, TOKEN_TTL_MS } from "../../utils/jwt";
import { DEFAULT_ACCOUNTS } from "../../seed";
import { recordAudit } from "../../Infrastructure/schemas/AuditLogSchema";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const BCRYPT_ROUNDS = 12;

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_TTL_MS,
    path: "/",
  });
};

/**
 * A user record created before this app hashed passwords may still hold a
 * plaintext value. When that happens we verify it once and immediately
 * upgrade the stored value to a bcrypt hash, so plaintext is never accepted
 * as a lasting credential.
 */
const verifyAndUpgradeLegacyPassword = async (
  user: any,
  password: string
): Promise<boolean> => {
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
  if (isBcryptHash) {
    return bcrypt.compare(password, user.password);
  }

  if (user.password !== password) {
    return false;
  }

  user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await user.save();
  return true;
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check if user exists in database
        // Explicitly load the hash for password verification, not for API responses
        let user = await staffMembers.findOne({ email: normalizedEmail }).select("+password");

        // 2. If the user is not in the database, allow a default account to be
        //    provisioned on first successful login. Only that account's own
        //    seeded password is accepted.
        if (!user) {
            const defaultAccount = DEFAULT_ACCOUNTS.find(
                (acc) => acc.email.toLowerCase() === normalizedEmail
            );

            if (!defaultAccount) {
                await recordAudit({
                    action: "login",
                    resource: "auth",
                    outcome: "failure",
                    ip: req.ip,
                });
                return res.status(401).json({ message: "Invalid email or password" });
            }

            if (password !== defaultAccount.password) {
                await recordAudit({
                    action: "login",
                    resource: "auth",
                    resourceId: normalizedEmail,
                    outcome: "failure",
                    ip: req.ip,
                });
                return res.status(401).json({ message: "Invalid email or password" });
            }

            try {
                const hashedPassword = await bcrypt.hash(defaultAccount.password, BCRYPT_ROUNDS);
                user = await staffMembers.create({
                    ...defaultAccount,
                    email: defaultAccount.email.toLowerCase(),
                    password: hashedPassword
                });
            } catch (seedErr) {
                console.warn("Auto-seed during login failed:", seedErr);
                const token = generateToken({
                    id: "default-" + defaultAccount.role.replace(/\s+/g, "-").toLowerCase(),
                    email: defaultAccount.email,
                    role: defaultAccount.role,
                    fullName: defaultAccount.fullName
                });
                setAuthCookie(res, token);
                return res.status(200).json({ token, role: defaultAccount.role });
            }
        }

        // 3. Validate the password for an existing database user.
        //    Only a bcrypt hash is ever accepted as a stored credential.
        let isMatch = false;

        if (user.password) {
            isMatch = await verifyAndUpgradeLegacyPassword(user, password);
        }

        if (!isMatch) {
            await recordAudit({
                action: "login",
                resource: "auth",
                resourceId: normalizedEmail,
                outcome: "failure",
                ip: req.ip,
            });
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 4. Issue the session token.
        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            fullName: user.fullName
        });

        await recordAudit({
            action: "login",
            resource: "auth",
            resourceId: user._id.toString(),
            actorId: user._id.toString(),
            actorRole: user.role,
            outcome: "success",
            ip: req.ip,
        });

        setAuthCookie(res, token);
        return res.status(200).json({ token, role: user.role });
    } catch (error) {
        console.error("Error logging in:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { credential } = req.body;

        if (!credential || typeof credential !== "string") {
            return res.status(400).json({ message: "Google ID token credential is required" });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        let payload: any;

        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: clientId || undefined,
            });
            payload = ticket.getPayload();
        } catch (verifyErr: any) {
            console.error("Google token verification failed:", verifyErr?.message || verifyErr);
            return res.status(401).json({ message: "Invalid or expired Google authentication token" });
        }

        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Google account does not contain a verified email" });
        }

        const normalizedEmail = payload.email.trim().toLowerCase();

        // 1. Look up existing staff record in database
        let user = await staffMembers.findOne({ email: normalizedEmail });

        // 2. If user is in default seed accounts, auto-provision their record
        if (!user) {
            const defaultAccount = DEFAULT_ACCOUNTS.find(
                (acc) => acc.email.toLowerCase() === normalizedEmail
            );

            if (defaultAccount) {
                try {
                    const hashedPassword = await bcrypt.hash(defaultAccount.password, BCRYPT_ROUNDS);
                    user = await staffMembers.create({
                        ...defaultAccount,
                        email: defaultAccount.email.toLowerCase(),
                        password: hashedPassword,
                        profilePic: payload.picture || null,
                    });
                } catch (seedErr) {
                    console.warn("Auto-provision during Google login failed:", seedErr);
                    const token = generateToken({
                        id: "default-" + defaultAccount.role.replace(/\s+/g, "-").toLowerCase(),
                        email: defaultAccount.email,
                        role: defaultAccount.role,
                        fullName: defaultAccount.fullName,
                    });
                    setAuthCookie(res, token);
                    return res.status(200).json({ token, role: defaultAccount.role, fullName: defaultAccount.fullName });
                }
            }
        }

        // 3. If still not found, deny access with security audit log
        if (!user) {
            await recordAudit({
                action: "google_login",
                resource: "auth",
                resourceId: normalizedEmail,
                outcome: "failure",
                ip: req.ip,
            });
            return res.status(403).json({
                message: `Access denied: No staff member registered for ${normalizedEmail}. Please contact your administrator.`
            });
        }

        // 4. Update avatar if user doesn't have one
        if (!user.profilePic && payload.picture) {
            try {
                user.profilePic = payload.picture;
                await user.save();
            } catch (e) {
                // Non-critical, continue
            }
        }

        // 5. Issue session JWT and secure cookie
        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            fullName: user.fullName,
        });

        await recordAudit({
            action: "google_login",
            resource: "auth",
            resourceId: user._id.toString(),
            actorId: user._id.toString(),
            actorRole: user.role,
            outcome: "success",
            ip: req.ip,
        });

        setAuthCookie(res, token);
        return res.status(200).json({
            token,
            role: user.role,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic || payload.picture
        });
    } catch (error) {
        console.error("Error during Google login:", error);
        return res.status(500).json({ message: "Server error during Google authentication" });
    }
};

