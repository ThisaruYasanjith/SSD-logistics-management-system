import express from "express";
import {
  updateVehicleByID,
  createVehicle,
  getVehicles,
  getVehicleByID,
  deleteVehicleByID,
  restoreVehicleByID,
  getBriefStaffDetails,
} from "../../Application/VehicleFleet/VehicleApp";
import { authenticateToken, authorizeRole } from "../../middleware/authentication";
import {
  validateBody,
  createVehicleSchema,
  updateVehicleSchema,
} from "../../middleware/validation";

const router = express.Router();

const READ_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager", "Staff", "Driver"];
const WRITE_ROLES = ["Business Owner", "Warehouse Manager"];

// Create vehicle
router.post("/vehicles", authenticateToken, authorizeRole(WRITE_ROLES), validateBody(createVehicleSchema), async (req, res) => {
  const {
    OwnersNIC,
    OwnersName,
    ContactNumber,
    Address,
    Email,
    VehicleNumber,
    VehicleType,
    FuelType,
    VehicleBrand,
    LoadCapacity,
    DriverID,
  } = req.body;

  try {
    const newVehicle = await createVehicle(
      OwnersNIC,
      OwnersName,
      ContactNumber,
      Address,
      Email,
      VehicleNumber,
      VehicleType,
      FuelType,
      VehicleBrand,
      Number(LoadCapacity) || 0,
      DriverID
    );

    res.status(201).json(newVehicle);
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(400).json({ message: "Error creating vehicle" });
  }
});

// Get all vehicles
router.get("/vehicles", authenticateToken, authorizeRole(READ_ROLES), async (req, res) => {
  try {
    const vehicles = await getVehicles();
    res.status(200).json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Error fetching vehicles" });
  }
});

// Route to get vehicle details by VehicleNumber
router.get("/vehicles/:vehicleId", authenticateToken, authorizeRole(READ_ROLES), async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const vehicle = await getVehicleByID(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.json(vehicle);
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Vehicle not found") {
      return res.status(404).json({ message });
    }
    console.error("Error fetching vehicle:", error);
    res.status(500).json({ message: "Error fetching vehicle" });
  }
});

// Route to Update vehicle details
router.put("/vehicles/:vehicleId", authenticateToken, authorizeRole(WRITE_ROLES), validateBody(updateVehicleSchema), async (req, res) => {
  const { vehicleId } = req.params;
  const updateData = req.body;

  try {
    const result = await updateVehicleByID(vehicleId, updateData);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Vehicle not found") {
      return res.status(404).json({ message });
    }
    console.error("Error updating vehicle:", error);
    res.status(500).json({ message: "Error updating vehicle" });
  }
});

// Soft delete vehicle by ID
router.delete("/vehicles/:vehicleId", authenticateToken, authorizeRole(WRITE_ROLES), async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const result = await deleteVehicleByID(vehicleId, req.user?.id || "user");
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Vehicle not found or already deleted") {
      return res.status(404).json({ message });
    }
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ message: "Error deleting vehicle" });
  }
});

// Restore a soft-deleted vehicle
router.post("/vehicles/:vehicleId/restore", authenticateToken, authorizeRole(WRITE_ROLES), async (req, res) => {
  const { vehicleId } = req.params;

  try {
    const result = await restoreVehicleByID(vehicleId);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Vehicle not found") {
      return res.status(404).json({ message });
    }
    console.error("Error restoring vehicle:", error);
    res.status(500).json({ message: "Error restoring vehicle" });
  }
});

// Route to get brief driver details for the assignment dropdown
router.get("/drivers", authenticateToken, async (req, res) => {
  try {
    const staffDetails = await getBriefStaffDetails();

    if (!staffDetails || staffDetails.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(staffDetails);
  } catch (error) {
    console.error("Error fetching brief staff details:", error);
    return res.status(500).json({ message: "Error fetching staff details" });
  }
});

export default router;
