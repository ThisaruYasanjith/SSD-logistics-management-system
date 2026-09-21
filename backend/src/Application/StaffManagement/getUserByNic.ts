import { Request, Response } from "express";
import staffMembers from "../../Infrastructure/schemas/staff";

// Define the response type for the frontend
interface UserDetails {
  nic: string;
  name: string;
  role: string;
  warehouse: string;
  photo: string;
}

export const getUserByNic = async (req: Request, res: Response): Promise<void> => {
  const { nic } = req.params;

  try {
    const staff = await staffMembers.findOne({ NIC: nic });
    if (!staff) {
      res.status(404).json({ message: "Staff not found" });
      return;
    }

    const userDetails: UserDetails = {
      nic: staff.NIC,
      name: staff.fullName,
      role: staff.role,
      warehouse: staff.warehouseAssigned,
      photo: staff.profilePic || "",
    };

    res.status(200).json(userDetails);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};