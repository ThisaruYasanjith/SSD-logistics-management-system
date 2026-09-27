/// <reference path="./types/express.d.ts" />
import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { connectDB } from "./Infrastructure/db";
import { authenticateToken, authorizeRole } from "./middleware/authentication";
import VehicleFleetRoutes from "./API/VehicleFleet/VehiclefleetAPI"; // Import routes
import DeliverySchdeulingRoutes from "./API/DeliveryScheduling/DeliverySchedulingAPI";
import MaintenenceRoute from "./API/VehicleFleet/VehicleMaintenanceAPI";
import router from "./API/WarehouseManagement/WarehouseAPI";
import router2 from "./API/Maintenance/MaintenanceAPI";
import router3 from "./API/RoutingMaintenance/MaintenanceRAPI";
import {
  getAllInventoryManagement,
  createInventoryManagement,
  getInventoryById,
  deleteInventoryManagement,
  updateInventory,
} from "./Application/Inventory/InventoryManagement";
import { stockoutInventory } from "./Application/Inventory/stockout";
import suppliersRouter from "./API/SpplierManagement/suppliers";
import staffRouter from "./API/StaffManagement/staff";
import loginRouter from "./API/login/login";
import getItemRouter from "./API/Return&DamageHandling/damageForm";
import profileRouter from "./API/StaffManagement/profile";
import QRRouter from "./API/StaffManagement/QRCode";
import attendanceRoute from "./API/StaffManagement/attendance";
import leaveRoutes from "./API/StaffManagement/leaveRoutes";
import {
  deleteDamageReport,
  getInventoryItems,
  sendReturnReport,
  updateDamageReport,
} from "./Application/Return&DamageHandling/DamageReport";

const app: Express = express();

const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];

// Middleware
app.use(
  helmet({
    // Uploaded documents are served as attachments rather than inline HTML.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Only explicitly trusted origins may call the API from a browser.
const allowedOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Brute-force protection on the credential endpoint.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

// Broad backstop against resource exhaustion.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down" },
});

// Connect to MongoDB
connectDB();

// Routes that do not require authentication.
// The limiter is scoped to /login so it cannot throttle unrelated endpoints.
app.use("/login", loginLimiter);
app.use("/", loginRouter);

// Uploaded files are no longer served as an open static directory. Anything
// under /uploads must be fetched through an authorised route.
app.use(
  "/uploads",
  authenticateToken,
  rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
  express.static("uploads", { dotfiles: "deny", index: false, fallthrough: false })
);

// Rate limiter backstop
app.use(apiLimiter);

// Warehouse and Vehicle Fleet Management routes (accessible directly or via /api without strict token rejection)
app.use("/api", VehicleFleetRoutes, DeliverySchdeulingRoutes, MaintenenceRoute);
app.use("/api", router);
app.use("/api", router2);
app.use("/api", router3); // Handles routing maintenance

app.use("/", VehicleFleetRoutes);
app.use("/", MaintenenceRoute);
app.use("/", router);
app.use("/", router2);
app.use("/", router3);

// Routes requiring authentication for other components
app.use("/staff", authenticateToken, staffRouter);
app.use("/suppliers", authenticateToken, suppliersRouter);
app.use("/returns", authenticateToken, getItemRouter);
app.use("/dashboard", authenticateToken, QRRouter);
app.use("/analytics", authenticateToken, attendanceRoute);
app.use("/leaves", authenticateToken, leaveRoutes);
app.use("/", profileRouter);

const DAMAGE_MANAGER_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager"];
app.route("/returns/send-return-report").post(authorizeRole(DAMAGE_MANAGER_ROLES), sendReturnReport);
app.route("/returns/add-damage/:id").put(authorizeRole(DAMAGE_MANAGER_ROLES), updateDamageReport);
app.route("/returns/add-damage/:id").delete(authorizeRole(DAMAGE_MANAGER_ROLES), deleteDamageReport);

// Inventory management routes - V01 JWT Authentication Bypass Fix + V02 RBAC Authorization Fix - Sithum
app
  .route("/inventory")
  .get(authenticateToken, authorizeRole(["Business Owner", "Warehouse Manager", "Inventory Manager"]), getAllInventoryManagement, getInventoryItems)
  .post(authenticateToken, authorizeRole(["Business Owner", "Warehouse Manager"]), createInventoryManagement);

app
  .route("/inventory/:id")
  .get(authenticateToken, authorizeRole(["Business Owner", "Warehouse Manager", "Inventory Manager"]), getInventoryById)
  .put(authenticateToken, authorizeRole(["Business Owner", "Warehouse Manager", "Inventory Manager"]), updateInventory)
  .delete(authenticateToken, authorizeRole(["Business Owner", "Warehouse Manager", "Inventory Manager"]), deleteInventoryManagement);

// Inventory stockout route - V01 JWT Authentication Bypass Fix - Sithum
app
  .route("/inventory/stockout/:id")
  .post(authenticateToken, authorizeRole(["Business Owner", "Warehouse Manager", "Inventory Manager"]), stockoutInventory);

const PORT: number = Number(process.env.PORT) || 8000;

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
