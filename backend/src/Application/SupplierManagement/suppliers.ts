import { Request, Response } from "express";
import supplier from "../../Infrastructure/schemas/suppliers";

// Get all suppliers
export const getAllSuppliers = async (req: Request, res: Response) => {
  try {
    const suppliers = await supplier.find();
    return res.status(200).json(suppliers);
  } catch (err: any) {
    console.error("Error fetching suppliers:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new supplier
export const createSupplierManagement = async (req: Request, res: Response) => {
  try {
    const { name, email, contact, items, quantity, price, date } = req.body;

    // Detailed validation
    const missingFields: string[] = [];
    if (!name) missingFields.push("name");
    if (!email) missingFields.push("email");
    if (!contact) missingFields.push("contact");
    if (!items) missingFields.push("items");
    if (!quantity) missingFields.push("quantity");
    if (!price) missingFields.push("price");
    if (!date) missingFields.push("date");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json({ error: `Missing required fields: ${missingFields.join(", ")}` });
    }

    // Additional email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate date
    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (!Array.isArray(items) || !Array.isArray(quantity) || !Array.isArray(price)) {
      return res.status(400).json({ error: "Items, quantity, and price must be arrays" });
    }

    if (items.length !== quantity.length || items.length !== price.length) {
      return res
        .status(400)
        .json({ error: "Items, quantity, and price arrays must have the same length" });
    }

    if (!quantity.every((qty: any) => typeof qty === "number" && !isNaN(qty))) {
      return res.status(400).json({ error: "All quantities must be valid numbers" });
    }

    if (!price.every((p: any) => typeof p === "number" && !isNaN(p))) {
      return res.status(400).json({ error: "All prices must be valid numbers" });
    }

    const dateString = typeof date === "string" && date.includes("T") 
      ? date.split("T")[0] 
      : typeof date === "string" 
      ? date 
      : new Date(date).toISOString().split("T")[0];

    const newSupplier = new supplier({
      name,
      email,
      contact,
      items,
      quantity,
      price,
      date: dateString,
    });

    const savedSupplier = await newSupplier.save();
    return res.status(201).json(savedSupplier);
  } catch (err: any) {
    console.error("Error adding supplier:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};

// Get supplier by ID
export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const supplierData = await supplier.findById(req.params._id);
    if (!supplierData) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    return res.status(200).json(supplierData);
  } catch (err: any) {
    console.error("Error fetching supplier:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Delete supplier
export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }

    const allowedRoles = ["Business Owner", "Warehouse Manager"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied: Insufficient permissions to delete supplier" });
    }

    const deletedSupplier = await supplier.findByIdAndDelete(req.params._id);
    if (!deletedSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }
    return res.status(204).send();
  } catch (err: any) {
    console.error("Error deleting supplier:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Update supplier
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Authentication required" });
    }

    const allowedRoles = ["Business Owner", "Warehouse Manager", "Inventory Manager"];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Access denied: Insufficient permissions to update supplier" });
    }

    const { name, email, contact, items, quantity, price, date } = req.body;

    const supplierToUpdate = await supplier.findById(req.params._id);
    if (!supplierToUpdate) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const updatePayload: Record<string, any> = {};

    if (name !== undefined) updatePayload.name = name;
    if (contact !== undefined) updatePayload.contact = contact;

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      updatePayload.email = email;
    }

    if (date !== undefined) {
      if (isNaN(Date.parse(date))) {
        return res.status(400).json({ error: "Invalid date format" });
      }
      updatePayload.date = typeof date === "string" && date.includes("T")
        ? date.split("T")[0]
        : typeof date === "string"
        ? date
        : new Date(date).toISOString().split("T")[0];
    }

    if (items !== undefined || quantity !== undefined || price !== undefined) {
      const newItems = items !== undefined ? items : supplierToUpdate.items;
      const newQuantity = quantity !== undefined ? quantity : supplierToUpdate.quantity;
      const newPrice = price !== undefined ? price : supplierToUpdate.price;

      if (!Array.isArray(newItems) || !Array.isArray(newQuantity) || !Array.isArray(newPrice)) {
        return res.status(400).json({ error: "Items, quantity, and price must be arrays" });
      }

      if (newItems.length !== newQuantity.length || newItems.length !== newPrice.length) {
        return res
          .status(400)
          .json({ error: "Items, quantity, and price arrays must have the same length" });
      }

      if (!newQuantity.every((qty: any) => typeof qty === "number" && !isNaN(qty) && qty >= 0)) {
        return res.status(400).json({ error: "All quantities must be valid non-negative numbers" });
      }

      if (!newPrice.every((p: any) => typeof p === "number" && !isNaN(p) && p >= 0)) {
        return res.status(400).json({ error: "All prices must be valid non-negative numbers" });
      }

      if (items !== undefined) updatePayload.items = items;
      if (quantity !== undefined) updatePayload.quantity = quantity;
      if (price !== undefined) updatePayload.price = price;
    }

    const updatedSupplier = await supplier.findByIdAndUpdate(
      req.params._id,
      { $set: updatePayload },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json(updatedSupplier);
  } catch (err: any) {
    console.error("Error updating supplier:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};