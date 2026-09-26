import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: { type: String, index: true },
  actorId: { type: String, default: "anonymous", index: true },
  actorRole: { type: String, default: "unknown" },
  outcome: { type: String, enum: ["success", "failure"], required: true },
  changes: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Retain audit entries for one year.
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 });

const AuditLog = mongoose.model("auditlogs", AuditLogSchema);

export const recordAudit = async (entry: {
  action: string;
  resource: string;
  resourceId?: string;
  actorId?: string;
  actorRole?: string;
  outcome: "success" | "failure";
  changes?: unknown;
  ip?: string;
}): Promise<void> => {
  try {
    await AuditLog.create({
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      actorId: entry.actorId ?? "anonymous",
      actorRole: entry.actorRole ?? "unknown",
      outcome: entry.outcome,
      changes: entry.changes,
      ip: entry.ip,
    });
  } catch (error) {
    // Auditing must never break the request path.
    console.error("Audit log write failed:", error instanceof Error ? error.message : error);
  }
};

export default AuditLog;
