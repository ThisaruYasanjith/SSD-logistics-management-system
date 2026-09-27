import { z } from "zod";
import { NextFunction, Request, Response } from "express";

/** Rejects MongoDB operator injection (`$gt`, `$ne`, ...) and prototype keys. */
export const rejectDangerousKeys = (value: unknown): void => {
  if (value === null || typeof value !== "object") return;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (key.startsWith("$") || key === "__proto__" || key === "constructor" || key === "prototype") {
      throw new Error(`Field name "${key}" is not allowed`);
    }
    rejectDangerousKeys((value as Record<string, unknown>)[key]);
  }
};

export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  try {
    rejectDangerousKeys(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      message: error instanceof Error ? error.message : "Invalid request body",
    });
  }
};

export const validateBody = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      rejectDangerousKeys(req.body);
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : "Invalid request body",
      });
      return;
    }

    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "(body)",
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const sectionSize = z.coerce
  .number()
  .min(0, "must not be negative")
  .max(10000000, "value is too large")
  .optional();

export const createWarehouseSchema = z.object({
  WarehouseID: optionalString(64),
  StreetName: z.string().trim().min(1, "Street Name is required").max(200),
  City: z.string().trim().min(1, "City is required").max(100),
  Province: z.string().trim().min(1, "Province is required").max(100),
  SpecialInstruction: optionalString(2000),
  Description: optionalString(5000),
  Bulkysecsize: sectionSize,
  Hazardoussecsize: sectionSize,
  Perishablesecsize: sectionSize,
  Sparesecsize: sectionSize,
  Otheritems: sectionSize,
}).passthrough();

export const updateWarehouseSchema = z
  .object({
    StreetName: z.string().trim().max(200).optional(),
    City: z.string().trim().max(100).optional(),
    Province: z.string().trim().max(100).optional(),
    SpecialInstruction: optionalString(2000),
    Description: optionalString(5000),
    Bulkysecsize: sectionSize,
    Hazardoussecsize: sectionSize,
    Perishablesecsize: sectionSize,
    Sparesecsize: sectionSize,
    Otheritems: sectionSize,
  })
  .passthrough();

export const createVehicleSchema = z
  .object({
    OwnersNIC: z.string().trim().min(5).max(30),
    OwnersName: z.string().trim().min(1).max(150),
    ContactNumber: z.string().trim().min(7).max(25),
    Address: z.string().trim().min(1).max(300),
    Email: z.string().trim().min(3).max(150),
    VehicleNumber: z.string().trim().min(2).max(30),
    VehicleType: z.string().trim().min(1).max(50),
    FuelType: z.string().trim().min(1).max(50),
    VehicleBrand: z.string().trim().min(1).max(100),
    LoadCapacity: z.coerce.number().min(0).max(10000000),
    DriverID: z.string().trim().min(1).max(200),
  })
  .passthrough();

export const updateVehicleSchema = z
  .object({
    OwnersNIC: z.string().trim().max(30).optional(),
    OwnersName: z.string().trim().max(150).optional(),
    ContactNumber: z.string().trim().max(25).optional(),
    Address: z.string().trim().max(300).optional(),
    Email: z.string().trim().max(150).optional(),
    VehicleType: z.string().trim().max(50).optional(),
    FuelType: z.string().trim().max(50).optional(),
    VehicleBrand: z.string().trim().max(100).optional(),
    LoadCapacity: z.coerce.number().min(0).max(10000000).optional(),
    DriverID: z.string().trim().max(200).optional(),
  })
  .passthrough();

export const createMaintenanceSchema = z.object({
  VehicleNumber: z.string().trim().min(1).max(30),
  MaintenanceDate: z.coerce.date(),
  Type: z.string().trim().min(1).max(100),
  Cost: z.coerce.number().min(0, "Cost must not be negative").max(100000000),
  Description: optionalString(2000),
}).passthrough();

export const updateMaintenanceSchema = z
  .object({
    MaintenanceDate: z.coerce.date().optional(),
    Type: z.string().trim().max(100).optional(),
    Cost: z.coerce.number().min(0).max(100000000).optional(),
    Description: optionalString(2000),
  })
  .passthrough();
