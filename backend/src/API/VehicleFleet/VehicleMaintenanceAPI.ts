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

const router = express.Router();

const READ_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff", "Driver"];
const WRITE_ROLES = ["Business Owner", "Warehouse Manager"];

// Route to create a new maintenance record
router.post("/maintenance", authenticateToken, authorizeRole(WRITE_ROLES), validateBody(createMaintenanceSchema), async (req, res) => {
  const { VehicleNumber, MaintenanceDate, Type, Cost, Description } = req.body;

  try {
    const newMaintenance = await createMaintenance(
      VehicleNumber,
      MaintenanceDate,
      Type,
      Number(Cost) || 0,
      Description
    );

    res.status(201).json(newMaintenance);
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    res.status(400).json({ message: "Error creating maintenance record" });
  }
});

// Route to get a maintenance record by ID
router.get("/maintenance/:id", authenticateToken, authorizeRole(READ_ROLES), async (req, res) => {
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
});

// Route to update an existing maintenance record by ID
router.put("/maintenance/:id", authenticateToken, authorizeRole(WRITE_ROLES), validateBody(updateMaintenanceSchema), async (req, res) => {
  const { id } = req.params;
  const { MaintenanceDate, Type, Cost, Description } = req.body;

  try {
    const updatedMaintenance = await updateMaintenance(
      id,
      MaintenanceDate,
      Type,
      Cost !== undefined ? Number(Cost) : undefined,
      Description
    );

    if (!updatedMaintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    res.json(updatedMaintenance);
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    res.status(400).json({ message: "Error updating maintenance record" });
  }
});

// Route to delete a maintenance record by ID
router.delete("/maintenance/:id", authenticateToken, authorizeRole(WRITE_ROLES), async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMaintenance = await deleteMaintenance(id);

    if (!deletedMaintenance) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }

    res.json({ message: "Maintenance record deleted successfully" });
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    res.status(400).json({ message: "Error deleting maintenance record" });
  }
});

// Route to get all maintenance records
router.get("/maintenance", authenticateToken, authorizeRole(READ_ROLES), async (req, res) => {
  try {
    const allMaintenance = await getAllMaintenance();
    res.json(allMaintenance);
  } catch (error) {
    console.error("Error fetching all maintenance records:", error);
    res.status(500).json({ message: "Error fetching all maintenance records" });
  }
});

export default router;
