import { Request, Response } from "express";
import supplier from "../../Infrastructure/schemas/suppliers";

// Server-side validation helpers
const validateName = (name: any): string | null => {
  if (typeof name !== "string" || !/^[A-Za-z\s]{2,}$/.test(name.trim())) {
    return "Name must contain at least 2 letters and only letters and spaces";
  }
  return null;
};

const validateEmail = (email: any): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== "string" || !emailRegex.test(email.trim())) {
    return "Please enter a valid email address";
  }
  return null;
};

const validateContact = (contact: any): string | null => {
  const contactStr = String(contact).trim();
  if (!/^0[0-9]{9}$/.test(contactStr)) {
    return "Phone number must be 10 digits and start with 0";
  }
  return null;
};

const validateDate = (date: any): string | null => {
  if (!date || isNaN(Date.parse(date))) {
    return "Invalid date format";
  }
  return null;
};

const validateItemsArrays = (items: any, quantity: any, price: any): string | null => {
  if (!Array.isArray(items) || !Array.isArray(quantity) || !Array.isArray(price)) {
    return "Items, quantity, and price must be arrays";
  }

  if (items.length === 0 || quantity.length === 0 || price.length === 0) {
    return "Items, quantity, and price arrays cannot be empty";
  }

  if (items.length !== quantity.length || items.length !== price.length) {
    return "Number of items, quantities, and prices must match";
  }

  if (!items.every((item: any) => typeof item === "string" && item.trim() !== "")) {
    return "All item names must be non-empty strings";
  }

  if (!quantity.every((qty: any) => typeof qty === "number" && !isNaN(qty) && qty > 0)) {
    return "Quantities must be positive numbers";
  }

  if (!price.every((p: any) => typeof p === "number" && !isNaN(p) && p > 0)) {
    return "Unit prices must be positive numbers";
  }

  return null;
};

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

    // Presence checks
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

    // Format & Value validations
    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ error: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });

    const contactErr = validateContact(contact);
    if (contactErr) return res.status(400).json({ error: contactErr });

    const dateErr = validateDate(date);
    if (dateErr) return res.status(400).json({ error: dateErr });

    const arraysErr = validateItemsArrays(items, quantity, price);
    if (arraysErr) return res.status(400).json({ error: arraysErr });

    const dateString = typeof date === "string" && date.includes("T") 
      ? date.split("T")[0] 
      : typeof date === "string" 
      ? date 
      : new Date(date).toISOString().split("T")[0];

    const newSupplier = new supplier({
      name: name.trim(),
      email: email.trim(),
      contact: String(contact).trim(),
      items: items.map((i: string) => i.trim()),
      quantity,
      price,
      date: dateString,
    });

    const savedSupplier = await newSupplier.save();
    return res.status(201).json(savedSupplier);
  } catch (err: any) {
    console.error("Error adding supplier:", err);
    return res.status(500).json({ error: "Internal server error" });
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

    if (name !== undefined) {
      const err = validateName(name);
      if (err) return res.status(400).json({ error: err });
      updatePayload.name = name.trim();
    }

    if (contact !== undefined) {
      const err = validateContact(contact);
      if (err) return res.status(400).json({ error: err });
      updatePayload.contact = String(contact).trim();
    }

    if (email !== undefined) {
      const err = validateEmail(email);
      if (err) return res.status(400).json({ error: err });
      updatePayload.email = email.trim();
    }

    if (date !== undefined) {
      const err = validateDate(date);
      if (err) return res.status(400).json({ error: err });
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

      const arraysErr = validateItemsArrays(newItems, newQuantity, newPrice);
      if (arraysErr) return res.status(400).json({ error: arraysErr });

      if (items !== undefined) updatePayload.items = items.map((i: string) => i.trim());
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