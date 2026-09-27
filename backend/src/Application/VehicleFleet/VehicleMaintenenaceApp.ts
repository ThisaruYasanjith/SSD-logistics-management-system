import crypto from "crypto";
import Maintenance from "../../Infrastructure/schemas/VehiclefleetSchemas/MaintenenceSchema";
import Vehicle from "../../Infrastructure/schemas/VehiclefleetSchemas/VehiclesSchema";

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
  try {
    const newMaintenance = new Maintenance({
      VehicleNumber,
      MaintenanceID: generateMaintenanceId(),
      MaintenanceDate,
      Type,
      Cost,
      Description,
    });

    const savedMaintenance = await newMaintenance.save();

    await Vehicle.updateOne(
      { VehicleNumber },
      { $push: { Maintenance: savedMaintenance._id } }
    ).catch(() => {});

    return savedMaintenance;
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    throw new Error("Error creating maintenance record");
  }
};

// Function to get a maintenance record by ID
export const getMaintenanceById = async (maintenanceId: string) => {
  try {
    return await Maintenance.findOne({
      $or: [{ MaintenanceID: maintenanceId }, { _id: maintenanceId.match(/^[0-9a-fA-F]{24}$/) ? maintenanceId : null }],
    });
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
    const changes: Record<string, unknown> = {};
    if (MaintenanceDate !== undefined) changes.MaintenanceDate = MaintenanceDate;
    if (Type !== undefined) changes.Type = Type;
    if (Cost !== undefined) changes.Cost = Cost;
    if (Description !== undefined) changes.Description = Description;

    const updatedMaintenance = await Maintenance.findOneAndUpdate(
      {
        $or: [{ MaintenanceID: maintenanceId }, { _id: maintenanceId.match(/^[0-9a-fA-F]{24}$/) ? maintenanceId : null }],
      },
      { $set: changes },
      { new: true }
    );

    return updatedMaintenance;
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    throw new Error("Error updating maintenance record");
  }
};

// Function to delete a maintenance record by MaintenanceID
export const deleteMaintenance = async (maintenanceId: string) => {
  try {
    const deletedMaintenance = await Maintenance.findOneAndDelete({
      $or: [{ MaintenanceID: maintenanceId }, { _id: maintenanceId.match(/^[0-9a-fA-F]{24}$/) ? maintenanceId : null }],
    });

    if (deletedMaintenance) {
      await Vehicle.updateMany(
        { Maintenance: deletedMaintenance._id },
        { $pull: { Maintenance: deletedMaintenance._id } }
      ).catch(() => {});
    }

    return deletedMaintenance;
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    throw new Error("Error deleting maintenance record");
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
