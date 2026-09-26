import express from "express";
import { authenticateToken, authorizeRole } from "../../middleware/authentication";
import {
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getMyLeaveRequests,
  getLeaveBalance,
  getAllLeaveRequests,
  updateLeaveStatus,
  generateLeaveReport,
} from "../../Application/StaffManagement/leaveController";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  // Limit attachment and form sizes before they are buffered in memory
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 4,
    fieldSize: 16 * 1024,
    parts: 6,
  },
});

// Return a clear client error instead of continuing with a rejected upload
const uploadAttachment: express.RequestHandler = (req, res, next) => {
  upload.single("attachment")(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? "Leave attachment must be smaller than 5 MB"
          : "Invalid leave upload. Too many files, fields or oversized form data",
      });
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
};

const leaveRoutes = express.Router();

const ALL_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager", "Driver", "Maintenance Staff", "Other Staff"];
const MANAGER_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager"];

// Routes for leave requests (Staff routes)
leaveRoutes
  .route("/")
  .post(
    authenticateToken,
    authorizeRole(ALL_ROLES),
    uploadAttachment,
    createLeaveRequest
  );

leaveRoutes
  .route("/:id")
  .put(
    authenticateToken,
    authorizeRole(ALL_ROLES),
    uploadAttachment,
    updateLeaveRequest
  )
  .delete(authenticateToken, deleteLeaveRequest);

leaveRoutes
  .route("/my-requests")
  .get(
    authenticateToken,
    authorizeRole(ALL_ROLES),
    getMyLeaveRequests
  );

leaveRoutes
  .route("/balance")
  .get(
    authenticateToken,
    authorizeRole(ALL_ROLES),
    getLeaveBalance
  );

// Admin & Manager routes
leaveRoutes
  .route("/all")
  .get(authenticateToken, authorizeRole(MANAGER_ROLES), getAllLeaveRequests);

leaveRoutes
  .route("/:id/status")
  .patch(authenticateToken, authorizeRole(MANAGER_ROLES), updateLeaveStatus);

leaveRoutes
  .route("/report/:employeeId")
  .get(authenticateToken, authorizeRole(MANAGER_ROLES), generateLeaveReport);

export default leaveRoutes;