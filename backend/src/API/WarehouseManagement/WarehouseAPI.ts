// API/routes.ts
import express from "express";
import {
  createWarehouse,
  getWarehouseById,
  getAllWarehouses,
  updateWarehouse,
  deleteWarehouse,
  restoreWarehouse,
} from "../../Application/WarehouseManagement/Warehouseapp";
import { authenticateToken, authorizeRole } from "../../middleware/authentication";
import {
  validateBody,
  createWarehouseSchema,
  updateWarehouseSchema,
} from "../../middleware/validation";
import { recordAudit } from "../../Infrastructure/schemas/AuditLogSchema";

const router = express.Router();

const READ_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager"];
const WRITE_ROLES = ["Business Owner", "Warehouse Manager"];

const actorId = (req: express.Request) => req.user?.id ?? "anonymous";
const actorRole = (req: express.Request) => req.user?.role ?? "unknown";

// Route to get all warehouses
router.get(
  "/Warehouse",
  authenticateToken,
  authorizeRole(READ_ROLES),
  async (req, res) => {
    try {
      const warehouses = await getAllWarehouses();
      res.status(200).json(warehouses);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      res.status(500).json({ message: "Error fetching warehouses" });
    }
  }
);

// Route to get a warehouse by ID
router.get(
  "/Warehouse/:WarehouseID",
  authenticateToken,
  authorizeRole(READ_ROLES),
  async (req, res) => {
    const { WarehouseID } = req.params;
    try {
      const warehouse = await getWarehouseById(WarehouseID);
      if (warehouse) {
        res.status(200).json(warehouse);
      } else {
        res.status(404).json({ message: "Warehouse not found" });
      }
    } catch (error) {
      console.error("Error fetching warehouse:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Create a warehouse
router.post(
  "/Warehouse",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  validateBody(createWarehouseSchema),
  async (req, res) => {
    const {
      StreetName,
      City,
      Province,
      SpecialInstruction,
      Description,
      Bulkysecsize,
      Hazardoussecsize,
      Perishablesecsize,
      Sparesecsize,
      Otheritems,
    } = req.body as {
      StreetName: string;
      City: string;
      Province: string;
      SpecialInstruction: string;
      Description: string;
      Bulkysecsize: number;
      Hazardoussecsize: number;
      Perishablesecsize: number;
      Sparesecsize: number;
      Otheritems: number;
    };

    try {
      const newWarehouse = await createWarehouse(
        StreetName,
        City,
        Province,
        SpecialInstruction,
        Description,
        Bulkysecsize,
        Hazardoussecsize,
        Perishablesecsize,
        Sparesecsize,
        Otheritems
      );

      await recordAudit({
        action: "create",
        resource: "warehouse",
        resourceId: String(newWarehouse.WarehouseID),
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        ip: req.ip,
      });

      res.status(201).json(newWarehouse);
    } catch (error) {
      console.error("Error creating warehouse:", error);
      await recordAudit({
        action: "create",
        resource: "warehouse",
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "failure",
        ip: req.ip,
      });
      res.status(400).json({ message: "Error creating warehouse" });
    }
  }
);

// update a warehouse by ID
router.put(
  "/Warehouse/:WarehouseID",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  validateBody(updateWarehouseSchema),
  async (req, res) => {
    const { WarehouseID } = req.params;
    const updates = req.body;

    try {
      const updatedWarehouse = await updateWarehouse(WarehouseID, updates);

      await recordAudit({
        action: "update",
        resource: "warehouse",
        resourceId: WarehouseID,
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        changes: updates,
        ip: req.ip,
      });

      res.status(200).json(updatedWarehouse);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Warehouse not found") {
        await recordAudit({
          action: "update",
          resource: "warehouse",
          resourceId: WarehouseID,
          actorId: actorId(req),
          actorRole: actorRole(req),
          outcome: "failure",
          ip: req.ip,
        });
        return res.status(404).json({ message });
      }
      console.error("Error updating warehouse:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// soft delete a warehouse by ID
router.delete(
  "/Warehouse/:WarehouseID",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  async (req, res) => {
    const { WarehouseID } = req.params;

    try {
      await deleteWarehouse(WarehouseID, actorId(req));

      await recordAudit({
        action: "delete",
        resource: "warehouse",
        resourceId: WarehouseID,
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        ip: req.ip,
      });

      res.status(200).json({ message: "Warehouse deleted successfully" });
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Warehouse not found") {
        await recordAudit({
          action: "delete",
          resource: "warehouse",
          resourceId: WarehouseID,
          actorId: actorId(req),
          actorRole: actorRole(req),
          outcome: "failure",
          ip: req.ip,
        });
        return res.status(404).json({ message });
      }
      console.error("Error deleting warehouse:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// restore a soft-deleted warehouse
router.post(
  "/Warehouse/:WarehouseID/restore",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  async (req, res) => {
    const { WarehouseID } = req.params;

    try {
      const restored = await restoreWarehouse(WarehouseID);

      await recordAudit({
        action: "restore",
        resource: "warehouse",
        resourceId: WarehouseID,
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        ip: req.ip,
      });

      res.status(200).json(restored);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Warehouse not found") {
        return res.status(404).json({ message });
      }
      console.error("Error restoring warehouse:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
