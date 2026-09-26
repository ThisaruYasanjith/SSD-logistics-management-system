
import mongoose from "mongoose";
import crypto from "crypto";
import Maintenance from "../../Infrastructure/schemas/VehiclefleetSchemas/MaintenenceSchema";
import Vehicle from "../../Infrastructure/schemas/VehiclefleetSchemas/VehiclesSchema";

/** Maintenance IDs used to be `M-${Date.now()}` — predictable and collidable. */
const generateMaintenanceId = (): string =>
  `M-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

// Function to create a new maintenance record
export const createMaintenance = async (
  VehicleNumber: string,
  MaintenanceDate: Date,
  Type: string,
  Cost: number,
  Description: string
) => {
  // Confirm the vehicle actually exists, otherwise the $push below silently
  // matches nothing and leaves an orphan record.
  const vehicle = await Vehicle.findOne({ VehicleNumber }).select("_id").lean();
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  // Both writes must succeed or neither should be visible.
  const session = await mongoose.startSession();
  try {
    let savedMaintenance: InstanceType<typeof Maintenance> | undefined;

    await session.withTransaction(async () => {
      const newMaintenance = new Maintenance({
        VehicleNumber,
        MaintenanceID: generateMaintenanceId(),
        MaintenanceDate,
        Type,
        Cost,
        Description,
      });

      savedMaintenance = await newMaintenance.save({ session });

      const linkResult = await Vehicle.updateOne(
        { _id: vehicle._id },
        { $push: { Maintenance: savedMaintenance!._id } },
        { session }
      );

      if (linkResult.matchedCount === 0) {
        throw new Error("Vehicle not found");
      }
    });

    return savedMaintenance!;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new Error("A maintenance record with a conflicting identifier already exists");
    }
    if ((error as Error).message === "Vehicle not found") throw error;
    console.error("Error creating maintenance record:", error);
    throw new Error("Error creating maintenance record");
  } finally {
    await session.endSession();
  }
};

// Function to get a maintenance record by ID
export const getMaintenanceById = async (maintenanceId: string) => {
  try {
    return await Maintenance.findOne({ MaintenanceID: maintenanceId });
  } catch (error) {
    console.error("Error fetching maintenance record:", error);
    throw new Error("Error fetching maintenance record");
  }
};

// Function to update an existing maintenance record by ID
export const updateMaintenance = async (
  maintenanceId: string,
  MaintenanceDate?: Date,
  Type?: string,
  Cost?: number,
  Description?: string
) => {
  try {
    // Build the $set from provided values only, so a partial update does not
    // blank out fields the caller left out.
    const changes: Record<string, unknown> = {};
    if (MaintenanceDate !== undefined) changes.MaintenanceDate = MaintenanceDate;
    if (Type !== undefined) changes.Type = Type;
    if (Cost !== undefined) changes.Cost = Cost;
    if (Description !== undefined) changes.Description = Description;

    if (Object.keys(changes).length === 0) {
      throw new Error("No updatable fields supplied");
    }

    const updatedMaintenance = await Maintenance.findOneAndUpdate(
      { MaintenanceID: maintenanceId },
      { $set: changes },
      { new: true, runValidators: true }
    );

    if (!updatedMaintenance) {
      return null;
    }

    return updatedMaintenance;
  } catch (error) {
    if ((error as Error).message === "No updatable fields supplied") throw error;
    console.error("Error updating maintenance record:", error);
    throw new Error("Error updating maintenance record");
  }
};

// Function to delete a maintenance record by MaintenanceID
export const deleteMaintenance = async (maintenanceId: string) => {
  const session = await mongoose.startSession();
  try {
    let deletedMaintenance: InstanceType<typeof Maintenance> | null = null;

    await session.withTransaction(async () => {
      deletedMaintenance = await Maintenance.findOneAndDelete(
        { MaintenanceID: maintenanceId },
        { session }
      );

      if (deletedMaintenance) {
        await Vehicle.updateMany(
          { Maintenance: deletedMaintenance!._id },
          { $pull: { Maintenance: deletedMaintenance!._id } },
          { session }
        );
      }
    });

    return deletedMaintenance;
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    throw new Error("Error deleting maintenance record");
  } finally {
    await session.endSession();
  }
};

// New function to get all maintenance details
export const getAllMaintenance = async () => {
  try {
    return await Maintenance.find().lean();
  } catch (error) {
    console.error("Error fetching all maintenance records:", error);
    throw new Error("Error fetching all maintenance records");
  }
};
