// API/WarehouseManagement/WarehouseAPI.ts
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

const router = express.Router();

const READ_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff"];
const WRITE_ROLES = ["Business Owner", "Warehouse Manager"];

// Route to get all warehouses
router.get(["/Warehouse", "/warehouse"], authenticateToken, authorizeRole(READ_ROLES), async (req, res) => {
  try {
    const warehouses = await getAllWarehouses();
    res.status(200).json(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    res.status(500).json({ message: "Error fetching warehouses" });
  }
});

// Route to get a warehouse by ID
router.get(["/Warehouse/:WarehouseID", "/warehouse/:WarehouseID"], authenticateToken, authorizeRole(READ_ROLES), async (req, res) => {
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
});

// Create a warehouse
router.post(["/Warehouse", "/warehouse"], authenticateToken, authorizeRole(WRITE_ROLES), validateBody(createWarehouseSchema), async (req, res) => {
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
  } = req.body;

  try {
    const newWarehouse = await createWarehouse(
      StreetName,
      City,
      Province,
      SpecialInstruction,
      Description,
      Number(Bulkysecsize) || 0,
      Number(Hazardoussecsize) || 0,
      Number(Perishablesecsize) || 0,
      Number(Sparesecsize) || 0,
      Number(Otheritems) || 0
    );

    res.status(201).json(newWarehouse);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    res.status(400).json({ message: "Error creating warehouse" });
  }
});

// Update a warehouse by ID
router.put(["/Warehouse/:WarehouseID", "/warehouse/:WarehouseID"], authenticateToken, authorizeRole(WRITE_ROLES), validateBody(updateWarehouseSchema), async (req, res) => {
  const { WarehouseID } = req.params;
  const updates = req.body;

  try {
    const updatedWarehouse = await updateWarehouse(WarehouseID, updates);
    res.status(200).json(updatedWarehouse);
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Warehouse not found") {
      return res.status(404).json({ message });
    }
    console.error("Error updating warehouse:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Soft delete a warehouse by ID
router.delete(["/Warehouse/:WarehouseID", "/warehouse/:WarehouseID"], authenticateToken, authorizeRole(WRITE_ROLES), async (req, res) => {
  const { WarehouseID } = req.params;

  try {
    await deleteWarehouse(WarehouseID, req.user?.id || "user");
    res.status(200).json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Warehouse not found") {
      return res.status(404).json({ message });
    }
    console.error("Error deleting warehouse:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Restore a soft-deleted warehouse
router.post(["/Warehouse/:WarehouseID/restore", "/warehouse/:WarehouseID/restore"], authenticateToken, authorizeRole(WRITE_ROLES), async (req, res) => {
  const { WarehouseID } = req.params;

  try {
    const restored = await restoreWarehouse(WarehouseID);
    res.status(200).json(restored);
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Warehouse not found") {
      return res.status(404).json({ message });
    }
    console.error("Error restoring warehouse:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
