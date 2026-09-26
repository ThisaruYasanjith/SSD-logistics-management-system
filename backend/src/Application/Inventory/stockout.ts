
import { Request, Response } from "express";
import inventory from "../../Infrastructure/schemas/InventoryManagement";

export const stockoutInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity }: { quantity: number } = req.body;

    // Validate input
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      res.status(400).json({ error: "Quantity must be a positive number" });
      return;
    }

    // Atomic stock deduction - V07 Race Condition Fix - Sithum
    const updatedItem = await inventory.findOneAndUpdate(
      { _id: id, quantity: { $gte: quantity } },
      {
        $inc: { quantity: -quantity },
        $set: { updatedIn: new Date() }
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      const existingItem = await inventory.findById(id);

      if (!existingItem) {
        res.status(404).json({ error: "Item not found" });
        return;
      }

      res.status(400).json({
        error: `Requested quantity (${quantity}) exceeds available stock (${existingItem.quantity})`
      });
      return;
    }

    res.status(200).json(updatedItem);
  } catch (err: any) {
    console.error("Error during stockout:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};