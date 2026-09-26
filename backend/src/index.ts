/// <reference path="./types/express.d.ts" />
import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import VehicleFleetRoutes from "./API/VehicleFleet/VehiclefleetAPI";
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
import { connectDB } from "./Infrastructure/db";
import suppliersRouter from "./API/SpplierManagement/suppliers";
import cors from "cors";
import staffRouter from "./API/StaffManagement/staff";
import loginRouter from "./API/login/login";
import getItemRouter from "./API/Return&DamageHandling/damageForm";
import profileRouter from "./API/StaffManagement/profile";
import QRRouter from "./API/StaffManagement/QRCode";
import attendanceRoute from "./API/StaffManagement/attendance";
import leaveRoutes from "./API/StaffManagement/leaveRoutes";
import { authenticateToken } from "./middleware/authentication";
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

// Every remaining route requires a valid, signature-verified JWT. Individual
// routers additionally apply authorizeRole for their own permissions.
app.use(apiLimiter, authenticateToken);

app.use("/api", VehicleFleetRoutes, DeliverySchdeulingRoutes, MaintenenceRoute);
app.use("/api", router);
app.use("/api", router2);
app.use("/api", router3); // Handles routing maintenance
app.use("/staff", staffRouter);
app.use("/suppliers", suppliersRouter);
app.use("/returns", getItemRouter);
app.use("/", profileRouter);
app.use("/dashboard", QRRouter);
app.use("/analytics", attendanceRoute);
app.use("/leaves", leaveRoutes);

app.route("/returns/send-return-report").post(sendReturnReport);
app.route("/returns/add-damage/:id").put(updateDamageReport);
app.route("/returns/add-damage/:id").delete(deleteDamageReport);

// Inventory management routes
app
  .route("/inventory")
  .get(getAllInventoryManagement, getInventoryItems)
  .post(createInventoryManagement);

app
  .route("/inventory/:id")
  .get(getInventoryById)
  .put(updateInventory)
  .delete(deleteInventoryManagement);

// Stockout route
app.route("/inventory/stockout/:id").post(stockoutInventory);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Central error handler: never leak stack traces or driver internals.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT: number = Number(process.env.PORT) || 8000;

app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
