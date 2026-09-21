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
const upload = multer({ storage: multer.memoryStorage() });

const leaveRoutes = express.Router();

const ALL_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager", "Driver", "Maintenance Staff", "Other Staff"];
const MANAGER_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager"];

// Routes for leave requests (Staff routes)
leaveRoutes
  .route("/")
  .post(
    authenticateToken,
    authorizeRole(ALL_ROLES),
    upload.single("attachment"),
    createLeaveRequest
  );

leaveRoutes
  .route("/:id")
  .put(
    authenticateToken,
    authorizeRole(ALL_ROLES),
    upload.single("attachment"),
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