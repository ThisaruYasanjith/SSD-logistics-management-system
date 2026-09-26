// Application/userService.ts
import User from "../../Infrastructure/schemas/VehiclefleetSchemas/VehiclesSchema"; // Import User schema
import Vehicle from "../../Infrastructure/schemas/VehiclefleetSchemas/VehiclesSchema";
import staffMembers from "../../Infrastructure/schemas/staff";

/**
 * Fields a client may change. `VehicleNumber` is deliberately excluded: it is
 * the primary key and permitting it would let a caller take over the identity
 * of an existing vehicle.
 */
export const VEHICLE_UPDATABLE_FIELDS = [
  "OwnersNIC",
  "OwnersName",
  "ContactNumber",
  "Address",
  "Email",
  "VehicleType",
  "FuelType",
  "VehicleBrand",
  "LoadCapacity",
  "DriverID",
] as const;

export type VehicleUpdates = Partial<Record<(typeof VEHICLE_UPDATABLE_FIELDS)[number], unknown>>;

/** Columns safe to return from the list endpoint (no owner PII). */
export const VEHICLE_LIST_FIELDS =
  "VehicleNumber VehicleType VehicleBrand OwnersName DriverID LoadCapacity deletedAt";

const pickUpdatableFields = (updateData: Record<string, unknown>): VehicleUpdates => {
  const sanitized: Record<string, unknown> = {};
  for (const field of VEHICLE_UPDATABLE_FIELDS) {
    if (updateData[field] !== undefined) {
      sanitized[field] = updateData[field];
    }
  }
  return sanitized as VehicleUpdates;
};

// Get user by email
export const getUserByEmail = async (email: string) => {
  return await User.findOne({ email });
};

// Function to create a new user
export const createUser = async (name: string, email: string, password: string) => {
  const newUser = new User({ name, email, password });
  return newUser.save();
};

export const createVehicle = async (
  OwnersNIC: string,
  OwnersName: string,
  ContactNumber: string,
  Address: string,
  Email: string,
  VehicleNumber: string,
  VehicleType: string,
  FuelType: string,
  VehicleBrand: string,
  LoadCapacity: number,
  DriverID: string
) => {
  try {
    const newVehicle = new Vehicle({
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
    });

    return await newVehicle.save();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new Error("A vehicle with this registration number or owner email already exists");
    }
    console.error("Error creating vehicle:", error);
    throw new Error("Error creating vehicle");
  }
};

/**
 * List endpoint. Deliberately projects away owner PII (NIC, phone, address,
 * email) — callers that legitimately need those must use the detail endpoint,
 * which is role-gated.
 */
export const getVehicles = async () => {
  try {
    return await Vehicle.find({ deletedAt: null })
      .select(
        "VehicleNumber VehicleType VehicleBrand OwnersName DriverID LoadCapacity deletedAt"
      )
      .lean();
  } catch (error) {
    console.error("Error retrieving vehicles:", error);
    throw new Error("Error retrieving vehicles");
  }
};

// Get vehicle by registered number
export const getVehicleByID = async (VehicleNumber: string) => {
  try {
    const vehicle = await Vehicle.findOne({ VehicleNumber })
      .populate("Maintenance")
      .exec();

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }

    return vehicle;
  } catch (error) {
    if ((error as Error).message === "Vehicle not found") throw error;
    console.error("Error fetching vehicle:", error);
    throw new Error("Error fetching vehicle");
  }
};

// update vehicle details
export const updateVehicleByID = async (vehicleId: string, updateData: Record<string, unknown>) => {
  try {
    const sanitized = pickUpdatableFields(updateData);

    if (Object.keys(sanitized).length === 0) {
      throw new Error("No updatable fields supplied");
    }

    const updateResult = await Vehicle.updateOne(
      { VehicleNumber: vehicleId, deletedAt: null },
      { $set: sanitized },
      { runValidators: true }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error("Vehicle not found");
    }

    return { message: "Vehicle updated successfully" };
  } catch (error) {
    if ((error as Error).message === "Vehicle not found") throw error;
    console.error("Error updating vehicle:", error);
    throw new Error("Error updating vehicle");
  }
};

/** Soft delete, retaining the record for audit and restore. */
export const deleteVehicleByID = async (vehicleId: string, deletedBy: string) => {
  try {
    const deleteResult = await Vehicle.updateOne(
      { VehicleNumber: vehicleId, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: deletedBy ?? "unknown" } }
    );

    if (deleteResult.matchedCount === 0) {
      throw new Error("Vehicle not found or already deleted");
    }

    return { message: "Vehicle deleted successfully" };
  } catch (error) {
    if ((error as Error).message === "Vehicle not found or already deleted") throw error;
    console.error("Error deleting vehicle:", error);
    throw new Error("Error deleting vehicle");
  }
};

export const restoreVehicleByID = async (vehicleId: string) => {
  try {
    const restoreResult = await Vehicle.updateOne(
      { VehicleNumber: vehicleId, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, deletedBy: null } }
    );

    if (restoreResult.matchedCount === 0) {
      throw new Error("Vehicle not found");
    }

    return { message: "Vehicle restored successfully" };
  } catch (error) {
    if ((error as Error).message === "Vehicle not found") throw error;
    console.error("Error restoring vehicle:", error);
    throw new Error("Error restoring vehicle");
  }
};

/**
 * Drivers for the assignment dropdown. Only the fields the picker needs are
 * returned — no DOB, address, NIC or status.
 */
export const getBriefStaffDetails = async () => {
  try {
    return await staffMembers
      .find({ role: "Driver", status: "Active" })
      .select("fullName email phoneNo role")
      .lean();
  } catch (error) {
    console.error("Error fetching brief staff details:", error);
    throw new Error("Error fetching staff details");
  }
};
