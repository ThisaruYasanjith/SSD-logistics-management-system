import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import staffMembers from "./Infrastructure/schemas/staff";

export const DEFAULT_ACCOUNTS = [
  {
    fullName: "Business Owner",
    email: "owner@grocerease.com",
    password: "Password123!",
    role: "Business Owner",
    phoneNo: "0000000000",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Company Headquarters",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Main HQ",
    status: "Active",
    NIC: "TEST-OWNER-001"
  },
  {
    fullName: "Warehouse Manager",
    email: "warehouse@grocerease.com",
    password: "Password123!",
    role: "Warehouse Manager",
    phoneNo: "0000000001",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Warehouse A",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Warehouse A",
    status: "Active",
    NIC: "TEST-WAREHOUSE-001"
  },
  {
    fullName: "Inventory Manager",
    email: "inventory@grocerease.com",
    password: "Password123!",
    role: "Inventory Manager",
    phoneNo: "0000000002",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Warehouse B",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Warehouse B",
    status: "Active",
    NIC: "TEST-INVENTORY-001"
  },
  {
    fullName: "Delivery Driver",
    email: "driver@grocerease.com",
    password: "Password123!",
    role: "Driver",
    phoneNo: "0000000003",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Delivery Hub 1",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Delivery Hub 1",
    status: "Active",
    NIC: "TEST-DRIVER-001"
  },
  {
    fullName: "Maintenance Staff",
    email: "maintenance@grocerease.com",
    password: "Password123!",
    role: "Maintenance Staff",
    phoneNo: "0000000004",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Maintenance Unit",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Maintenance Unit",
    status: "Active",
    NIC: "TEST-MAINTENANCE-001"
  },
  {
    fullName: "General Staff",
    email: "staff@grocerease.com",
    password: "Password123!",
    role: "Other Staff",
    phoneNo: "0000000005",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "General Operations",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "General Operations",
    status: "Active",
    NIC: "TEST-STAFF-001"
  },

  // Generic alias/login accounts
  {
    fullName: "Warehouse Manager",
    email: "warehouse.manager@grocerease.com",
    password: "Password123!",
    role: "Warehouse Manager",
    phoneNo: "0000000011",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Warehouse A",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Warehouse A",
    status: "Active",
    NIC: "TEST-WAREHOUSE-002"
  },
  {
    fullName: "Business Owner",
    email: "business.owner@grocerease.com",
    password: "Password123!",
    role: "Business Owner",
    phoneNo: "0000000012",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Company Headquarters",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Main HQ",
    status: "Active",
    NIC: "TEST-OWNER-002"
  },
  {
    fullName: "Delivery Driver",
    email: "delivery.driver@grocerease.com",
    password: "Password123!",
    role: "Driver",
    phoneNo: "0000000013",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Delivery Hub 1",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Delivery Hub 1",
    status: "Active",
    NIC: "TEST-DRIVER-002"
  },
  {
    fullName: "General Staff",
    email: "general.staff@grocerease.com",
    password: "Password123!",
    role: "Other Staff",
    phoneNo: "0000000014",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "General Operations",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "General Operations",
    status: "Active",
    NIC: "TEST-STAFF-002"
  },
  {
    fullName: "Inventory Manager",
    email: "inventory.manager@grocerease.com",
    password: "Password123!",
    role: "Inventory Manager",
    phoneNo: "0000000015",
    DOB: new Date("2000-01-01"),
    gender: "Other",
    address: "Warehouse B",
    profilePic: "https://via.placeholder.com/150",
    warehouseAssigned: "Warehouse B",
    status: "Active",
    NIC: "TEST-INVENTORY-002"
  }


];

export const seedDefaultUsers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/logistics_db";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    console.log("Seeding default staff users...");

    for (const account of DEFAULT_ACCOUNTS) {
      const existingUser = await staffMembers.findOne({ email: account.email.toLowerCase() });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(account.password, 10);
        await staffMembers.create({
          ...account,
          email: account.email.toLowerCase(),
          password: hashedPassword
        });
        console.log(`Created default user: ${account.email} (${account.role})`);
      } else {
        console.log(`User already exists: ${account.email}`);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding default users:", err);
  }
};

// Execute if run directly
if (require.main === module) {
  seedDefaultUsers().then(() => mongoose.disconnect());
}
