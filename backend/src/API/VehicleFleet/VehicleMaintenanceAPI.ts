

import express from "express";
import {
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenanceById,
  getAllMaintenance,
} from "../../Application/VehicleFleet/VehicleMaintenenaceApp";
import { authenticateToken, authorizeRole } from "../../middleware/authentication";
import {
  validateBody,
  createMaintenanceSchema,
  updateMaintenanceSchema,
} from "../../middleware/validation";
import { recordAudit } from "../../Infrastructure/schemas/AuditLogSchema";

const router = express.Router();

const READ_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager"];
const WRITE_ROLES = ["Business Owner", "Warehouse Manager"];

const actorId = (req: express.Request) => req.user?.id ?? "anonymous";
const actorRole = (req: express.Request) => req.user?.role ?? "unknown";

// Route to create a new maintenance record
router.post(
  "/maintenance",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  validateBody(createMaintenanceSchema),
  async (req, res) => {
    const { VehicleNumber, MaintenanceDate, Type, Cost, Description } = req.body;

    try {
      const newMaintenance = await createMaintenance(
        VehicleNumber,
        MaintenanceDate,
        Type,
        Cost,
        Description
      );

      await recordAudit({
        action: "create",
        resource: "maintenance",
        resourceId: newMaintenance.MaintenanceID,
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        ip: req.ip,
      });

      res.status(201).json(newMaintenance);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "Vehicle not found") {
        return res.status(404).json({ message });
      }
      console.error("Error creating maintenance record:", error);
      res.status(400).json({ message: "Error creating maintenance record" });
    }
  }
);

// Route to get a maintenance record by ID
router.get(
  "/maintenance/:id",
  authenticateToken,
  authorizeRole(READ_ROLES),
  async (req, res) => {
    const { id } = req.params;

    try {
      const maintenance = await getMaintenanceById(id);
      if (!maintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      res.json(maintenance);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      res.status(400).json({ message: "Error fetching maintenance record" });
    }
  }
);

// Route to update an existing maintenance record by ID
router.put(
  "/maintenance/:id",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  validateBody(updateMaintenanceSchema),
  async (req, res) => {
    const { id } = req.params;
    const { MaintenanceDate, Type, Cost, Description } = req.body;

    try {
      const updatedMaintenance = await updateMaintenance(
        id,
        MaintenanceDate,
        Type,
        Cost,
        Description
      );

      if (!updatedMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }

      await recordAudit({
        action: "update",
        resource: "maintenance",
        resourceId: id,
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        ip: req.ip,
      });

      res.json(updatedMaintenance);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(400).json({ message: "Error updating maintenance record" });
    }
  }
);

// Route to delete a maintenance record by ID
router.delete(
  "/maintenance/:id",
  authenticateToken,
  authorizeRole(WRITE_ROLES),
  async (req, res) => {
    const { id } = req.params;

    try {
      const deletedMaintenance = await deleteMaintenance(id);

      if (!deletedMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }

      await recordAudit({
        action: "delete",
        resource: "maintenance",
        resourceId: id,
        actorId: actorId(req),
        actorRole: actorRole(req),
        outcome: "success",
        ip: req.ip,
      });

      res.json({ message: "Maintenance record deleted successfully" });
    } catch (error) {
      console.error("Error deleting maintenance record:", error);
      res.status(400).json({ message: "Error deleting maintenance record" });
    }
  }
);

// New route to get all maintenance records
router.get(
  "/maintenance",
  authenticateToken,
  authorizeRole(READ_ROLES),
  async (req, res) => {
    try {
      const allMaintenance = await getAllMaintenance();
      res.json(allMaintenance);
    } catch (error) {
      console.error("Error fetching all maintenance records:", error);
      res.status(500).json({ message: "Error fetching all maintenance records" });
    }
  }
);

export default router;
