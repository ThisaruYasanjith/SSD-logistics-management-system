import { Request, Response } from "express";
import Inventory from "../../Infrastructure/schemas/InventoryManagement";

interface InventoryItem {
  _id?: string;
  productName: string;
  brandName: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
  updatedIn: Date;
  createdIn: Date;
  expiryDate: Date;
  supplierName: string;
  reorderLevel: number;
}

// Get all inventory items with search and filtering
export const getAllInventoryManagement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { search, category } = req.query;
    let query: any = {};

    // Handle search (across productName, brandName, category)
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      query.$or = [
        { productName: searchRegex },
        { brandName: searchRegex },
        { category: searchRegex },
      ];
    }

    // Handle category filter
    if (category && category !== "All") {
      query.category = category;
    }

    const inventoryItems = await Inventory.find(query);
    // Log the items to verify expiryDate format
    console.log("Fetched inventory items:", inventoryItems.map(item => ({
      productName: item.productName,
      expiryDate: item.expiryDate,
    })));
    return res.status(200).json(inventoryItems);
  } catch (error) {
    console.error("Error in getAllInventoryManagement:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new inventory item
export const createInventoryManagement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const newItem: InventoryItem = req.body;
    // Ensure expiryDate is a valid Date object
    newItem.expiryDate = new Date(newItem.expiryDate);
    if (isNaN(newItem.expiryDate.getTime())) {
      return res.status(400).json({ message: "Invalid expiry date format" });
    }
    const createdItem = await Inventory.create(newItem);
    return res.status(201).json(createdItem);
  } catch (error) {
    console.error("Error in createInventoryManagement:", error);
    // Inventory server-side validation - V05 Fix - Sithum
    if (error instanceof Error && error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid inventory data" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get an inventory item by ID
export const getInventoryById = async (req: Request, res: Response): Promise<Response> => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json(item);
  } catch (error) {
    console.error("Error in getInventoryById:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete an inventory item by ID
export const deleteInventoryManagement = async (req: Request, res: Response): Promise<Response> => {
  try {
    const result = await Inventory.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(204).send();
  } catch (error) {
    console.error("Error in deleteInventoryManagement:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update an inventory item by ID
export const updateInventory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const updatedData: Partial<InventoryItem> = req.body;
    // Ensure expiryDate is a valid Date if provided
    if (updatedData.expiryDate) {
      updatedData.expiryDate = new Date(updatedData.expiryDate);
      if (isNaN(updatedData.expiryDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiry date format" });
      }
    }
    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error in updateInventory:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Stockout an inventory item by ID
export const stockoutInventory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { quantity } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const newQuantity = item.quantity - quantity;
    if (newQuantity < 0) {
      return res.status(400).json({ message: "Stockout quantity exceeds available stock" });
    }

    item.quantity = newQuantity;
    item.updatedIn = new Date();
    await item.save();

    return res.status(200).json(item);
  } catch (error) {
    console.error("Error in stockoutInventory:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};