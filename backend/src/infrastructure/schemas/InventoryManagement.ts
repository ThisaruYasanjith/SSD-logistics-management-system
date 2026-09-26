import mongoose, { Schema, Document } from "mongoose";

interface IInventory extends Document {
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

const inventorySchema: Schema<IInventory> = new Schema({
  productName: { type: String, required: true },
  brandName: { type: String, required: true },
  description: { type: String, required: true },
  // Inventory numeric constraints - V05 Server-Side Validation Fix - Sithum
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  updatedIn: { type: Date, required: true },
  createdIn: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  supplierName: { type: String, required: true },
  reorderLevel: { type: Number, required: true, min: 0 },
});

export default mongoose.model<IInventory>("Inventory", inventorySchema);