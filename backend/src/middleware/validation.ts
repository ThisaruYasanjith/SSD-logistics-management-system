import { z } from "zod";
import { NextFunction, Request, Response } from "express";

/** Rejects MongoDB operator injection (`$gt`, `$ne`, ...) and prototype keys. */
const rejectDangerousKeys = (value: unknown): void => {
  if (value === null || typeof value !== "object") return;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (key.startsWith("$") || key === "__proto__" || key === "constructor" || key === "prototype") {
      throw new Error(`Field name "${key}" is not allowed`);
    }
    rejectDangerousKeys((value as Record<string, unknown>)[key]);
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

    // Replace the raw body with the parsed/coerced value so downstream code
    // never touches unsanitised input.
    req.body = result.data;
    next();
  };
};

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const sectionSize = z.coerce
  .number()
  .min(0, "must not be negative")
  .max(1000000, "value is too large")
  .optional();

export const createWarehouseSchema = z.object({
  WarehouseID: optionalString(64),
  StreetName: z.string().trim().min(1, "Street Name is required").max(200),
  City: z.string().trim().min(1, "City is required").max(100),
  Province: z.string().trim().min(1, "Province is required").max(50),
  SpecialInstruction: optionalString(2000),
  Description: optionalString(5000),
  Bulkysecsize: sectionSize,
  Hazardoussecsize: sectionSize,
  Perishablesecsize: sectionSize,
  Sparesecsize: sectionSize,
  Otheritems: sectionSize,
}).strict();

export const updateWarehouseSchema = z
  .object({
    StreetName: z.string().trim().min(1).max(200).optional(),
    City: z.string().trim().min(1).max(100).optional(),
    Province: z.string().trim().min(1).max(50).optional(),
    SpecialInstruction: optionalString(2000),
    Description: optionalString(5000),
    Bulkysecsize: sectionSize,
    Hazardoussecsize: sectionSize,
    Perishablesecsize: sectionSize,
    Sparesecsize: sectionSize,
    Otheritems: sectionSize,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updatable fields supplied",
  });

export const createVehicleSchema = z
  .object({
    OwnersNIC: z.string().trim().regex(/^[0-9]{12,14}[vV]?$/i, "NIC must be 12-14 digits with an optional trailing 'v'"),
    OwnersName: z.string().trim().min(3).max(100),
    ContactNumber: z.string().trim().regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits"),
    Address: z.string().trim().min(5).max(255),
    Email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/, "Please enter a valid email address"),
    VehicleNumber: z.string().trim().min(4).max(20),
    VehicleType: z.enum(["Lorry", "Van", "Three Wheeler"]),
    FuelType: z.enum(["Diesel", "Petrol", "EV"]),
    VehicleBrand: z.string().trim().min(1).max(50),
    LoadCapacity: z.coerce.number().min(0).max(1000000),
    DriverID: z.string().trim().min(1).max(200),
  })
  .strict();

export const updateVehicleSchema = z
  .object({
    OwnersNIC: z.string().trim().regex(/^[0-9]{12,14}[vV]?$/i).optional(),
    OwnersName: z.string().trim().min(3).max(100).optional(),
    ContactNumber: z.string().trim().regex(/^[0-9]{10}$/).optional(),
    Address: z.string().trim().min(5).max(255).optional(),
    Email: z.string().trim().regex(/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/).optional(),
    VehicleType: z.enum(["Lorry", "Van", "Three Wheeler"]).optional(),
    FuelType: z.enum(["Diesel", "Petrol", "EV"]).optional(),
    VehicleBrand: z.string().trim().min(1).max(50).optional(),
    LoadCapacity: z.coerce.number().min(0).max(1000000).optional(),
    DriverID: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updatable fields supplied",
  });

export const createMaintenanceSchema = z.object({
  VehicleNumber: z.string().trim().min(1).max(20),
  MaintenanceDate: z.coerce.date().max(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), "Maintenance date is too far in the future"),
  Type: z.string().trim().min(1).max(100),
  Cost: z.coerce.number().min(0, "Cost must not be negative").max(100000000),
  Description: optionalString(2000),
}).strict();

export const updateMaintenanceSchema = z
  .object({
    MaintenanceDate: z.coerce.date().optional(),
    Type: z.string().trim().min(1).max(100).optional(),
    Cost: z.coerce.number().min(0).max(100000000).optional(),
    Description: optionalString(2000),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "No updatable fields supplied",
  });
