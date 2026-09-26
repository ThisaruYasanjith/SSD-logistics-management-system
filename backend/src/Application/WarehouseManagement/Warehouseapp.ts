// Application/userService.ts
import Warehouse from "../../Infrastructure/schemas/WarehouseManagement/Warehouseschema";
import crypto from "crypto";

/**
 * The set of fields a client is permitted to change. Anything outside this
 * list is ignored, so a caller can never overwrite the primary key or inject
 * arbitrary attributes (mass assignment).
 */
export const WAREHOUSE_UPDATABLE_FIELDS = [
  "StreetName",
  "City",
  "Province",
  "SpecialInstruction",
  "Description",
  "Bulkysecsize",
  "Hazardoussecsize",
  "Perishablesecsize",
  "Sparesecsize",
  "Otheritems",
] as const;

export type WarehouseUpdates = Partial<Record<(typeof WAREHOUSE_UPDATABLE_FIELDS)[number], unknown>>;

const pickUpdatableFields = (updates: Record<string, unknown>): WarehouseUpdates => {
  const sanitized: Record<string, unknown> = {};
  for (const field of WAREHOUSE_UPDATABLE_FIELDS) {
    if (updates[field] !== undefined) {
      sanitized[field] = updates[field];
    }
  }
  return sanitized as WarehouseUpdates;
};

/** Read all non-deleted warehouses. */
export const getAllWarehouses = async () => {
  try {
    return await Warehouse.find({ deletedAt: null }).lean();
  } catch (error) {
    console.error("Error retrieving Warehouse:", error);
    throw new Error("Error retrieving Warehouse");
  }
};

/** Read a warehouse by ID, including soft-deleted ones (for restore flows). */
export const getWarehouseById = async (Wname: string) => {
  try {
    return await Warehouse.findOne({ WarehouseID: Wname });
  } catch (error) {
    console.error("Error fetching warehouse:", error);
    throw new Error("Error fetching warehouse");
  }
};

/**
 * Generate a warehouse ID from a cryptographically secure random source.
 * Sequential values (and Date.now()) made the whole estate enumerable.
 */
const generateWarehouseId = (): string =>
  `WH-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

export const createWarehouse = async (
  StreetName: string,
  City: string,
  Province: string,
  SpecialInstruction: string,
  Description: string,
  Bulkysecsize: number,
  Hazardoussecsize: number,
  Perishablesecsize: number,
  Sparesecsize: number,
  Otheritems: number
) => {
  try {
    const W = new Warehouse({
      WarehouseID: generateWarehouseId(),
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
    });

    return await W.save();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new Error("A warehouse with a conflicting identifier already exists");
    }
    console.error("Error creating warehouse:", error);
    throw new Error("Error creating warehouse");
  }
};

export const updateWarehouse = async (WarehouseID: string, updates: Record<string, unknown>) => {
  try {
    const sanitized = pickUpdatableFields(updates);

    if (Object.keys(sanitized).length === 0) {
      throw new Error("No updatable fields supplied");
    }

    const updatedWarehouse = await Warehouse.findOneAndUpdate(
      { WarehouseID, deletedAt: null },
      { $set: sanitized },
      { new: true, runValidators: true }
    );

    if (!updatedWarehouse) {
      throw new Error("Warehouse not found");
    }

    return updatedWarehouse;
  } catch (error) {
    if ((error as Error).message === "Warehouse not found") throw error;
    console.error("Error updating warehouse:", error);
    throw new Error("Error updating warehouse");
  }
};

/** Soft delete: the document is retained so it can be restored or audited. */
export const deleteWarehouse = async (WarehouseID: string, deletedBy: string) => {
  try {
    const deletedWarehouse = await Warehouse.findOneAndUpdate(
      { WarehouseID, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: deletedBy ?? "unknown" } },
      { new: true }
    );

    if (!deletedWarehouse) {
      throw new Error("Warehouse not found");
    }

    return deletedWarehouse;
  } catch (error) {
    if ((error as Error).message === "Warehouse not found") throw error;
    console.error("Error deleting warehouse:", error);
    throw new Error("Error deleting warehouse");
  }
};

export const restoreWarehouse = async (WarehouseID: string) => {
  try {
    const restored = await Warehouse.findOneAndUpdate(
      { WarehouseID, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, deletedBy: null } },
      { new: true }
    );

    if (!restored) {
      throw new Error("Warehouse not found");
    }

    return restored;
  } catch (error) {
    if ((error as Error).message === "Warehouse not found") throw error;
    console.error("Error restoring warehouse:", error);
    throw new Error("Error restoring warehouse");
  }
};
