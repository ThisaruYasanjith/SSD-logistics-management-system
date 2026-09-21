import { Request, Response } from "express";
import staffMembers from "../../Infrastructure/schemas/staff";
import { generatePassword } from "../../utils/password";
import bcrypt from "bcryptjs";
import { generateQRCode } from "../../utils/qrCode";
import { sendCredentialsEmail } from "../../utils/email";
import { generateToken } from "../../utils/jwt";
import { uploadToCloudinary } from "../../utils/cloudinary";

export const addStaff = async (req: Request, res: Response) => {
  try {
    console.log("Received request body:", req.body);
    console.log("Received file:", req.file);

    const {
      fullName,
      email,
      phoneNo,
      DOB,
      gender,
      address,
      warehouseAssigned,
      status,
      role,
      NIC,
      dateJoined,
    } = req.body;

    // Ensure all fields are strings and trim them
    const fields = {
      fullName: fullName ? String(fullName).trim() : "",
      email: email ? String(email).trim() : "",
      phoneNo: phoneNo ? String(phoneNo).trim() : "",
      DOB: DOB ? String(DOB).trim() : "",
      gender: gender ? String(gender).trim() : "",
      address: address ? String(address).trim() : "",
      warehouseAssigned: warehouseAssigned ? String(warehouseAssigned).trim() : "",
      status: status ? String(status).trim() : "",
      role: role ? String(role).trim() : "",
      NIC: NIC ? String(NIC).trim() : "",
      dateJoined: dateJoined ? String(dateJoined).trim() : "",
    };

    // Debug which field is missing or empty
    const missingFields = [];
    for (const [key, value] of Object.entries(fields)) {
      if (key !== "dateJoined" && (!value || value === "")) { // dateJoined has separate validation
        missingFields.push(key);
      }
    }

    if (missingFields.length > 0) {
      console.log("Missing or empty fields:", missingFields);
      return res.status(400).json({ message: "All fields are required", missingFields });
    }

    // Use trimmed fields
    const {
      fullName: trimmedFullName,
      email: trimmedEmail,
      phoneNo: trimmedPhoneNo,
      DOB: trimmedDOB,
      gender: trimmedGender,
      address: trimmedAddress,
      warehouseAssigned: trimmedWarehouseAssigned,
      status: trimmedStatus,
      role: trimmedRole,
      NIC: trimmedNIC,
      dateJoined: trimmedDateJoined,
    } = fields;

    // Validate dateJoined
    if (!trimmedDateJoined || trimmedDateJoined === "") {
      return res.status(400).json({ message: "Date joined is required" });
    }
    const dateJoinedDate = new Date(trimmedDateJoined);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dateJoinedDate.getTime())) {
      return res.status(400).json({ message: "Date joined must be a valid date" });
    }
    if (dateJoinedDate > today) {
      return res.status(400).json({ message: "Date joined cannot be in the future" });
    }

    const nic = trimmedNIC.toUpperCase();
    const oldNicRegex = /^[0-9]{9}[VX]$/;
    const newNicRegex = /^[0-9]{12}$/;
    const isOldFormat = oldNicRegex.test(nic);
    const isNewFormat = newNicRegex.test(nic);
    if (!isOldFormat && !isNewFormat) {
      return res.status(400).json({
        message: "NIC must be either 9 digits followed by V/X (e.g., 123456789V) or 12 digits (e.g., 122345698872)",
      });
    }

    const existingUser = await staffMembers.findOne({ $or: [{ email: trimmedEmail }, { NIC: nic }] });
    if (existingUser) {
      if (existingUser.email === trimmedEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (existingUser.NIC === nic) {
        return res.status(400).json({ message: "NIC already exists" });
      }
    }

    let profilePic = null;
    if (req.file) {
      const fileName = `${nic}-profile`;
      try {
        profilePic = await uploadToCloudinary(req.file, fileName, "staff_profile_pics");
      } catch (uploadErr) {
        console.warn("Cloudinary profile pic upload failed, falling back to base64 Data URL:", uploadErr);
        profilePic = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const qrCodeData = { email: trimmedEmail, fullName: trimmedFullName, phoneNo: trimmedPhoneNo, NIC: nic };
    const qrCodePath = await generateQRCode(qrCodeData);

    const newStaff = new staffMembers({
      fullName: trimmedFullName,
      email: trimmedEmail,
      phoneNo: trimmedPhoneNo,
      DOB: new Date(trimmedDOB),
      gender: trimmedGender,
      address: trimmedAddress,
      profilePic,
      dateJoined: dateJoinedDate,
      warehouseAssigned: trimmedWarehouseAssigned,
      status: trimmedStatus,
      role: trimmedRole,
      password: hashedPassword,
      qrCode: qrCodePath,
      NIC: nic,
    });

    await newStaff.save();

    const token = generateToken({
      id: newStaff._id.toString(),
      email: newStaff.email,
      role: newStaff.role,
      fullName: newStaff.fullName,
    });

    try {
      await sendCredentialsEmail(trimmedEmail, trimmedFullName, password);
    } catch (emailErr) {
      console.warn("Could not send credentials email (check EMAIL_USER / EMAIL_PASS in .env):", emailErr);
    }

    return res.status(201).json({ message: "Staff member added successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error adding staff:", error.message, error.stack);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
    console.error("Unknown error:", error);
    return res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
  }
};

export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const staff = await staffMembers.find();
    console.log("Staff Data Sent:", staff);

    if (staff.length === 0) {
      return res.status(404).json({ message: "No staff found" });
    }

    return res.status(200).json(staff);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching staff:", error.message, error.stack);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
    console.error("Unknown error:", error);
    return res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const staff = await staffMembers.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    return res.status(200).json(staff);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching staff by ID:", error.message, error.stack);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
    console.error("Unknown error:", error);
    return res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const staff = await staffMembers.findByIdAndDelete(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    return res.status(204).send();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error deleting staff:", error.message, error.stack);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
    console.error("Unknown error:", error);
    return res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const staff = await staffMembers.findById(req.params.id);
    if (!staff) {
      return res.status(404).json({ message: "Staff member not found" });
    }

    if (req.body.NIC) {
      const NIC = req.body.NIC.trim().toUpperCase();
      const oldNicRegex = /^[0-9]{9}[VX]$/;
      const newNicRegex = /^[0-9]{12}$/;
      const isOldFormat = oldNicRegex.test(NIC);
      const isNewFormat = newNicRegex.test(NIC);
      if (!isOldFormat && !isNewFormat) {
        return res.status(400).json({
          message: "NIC must be either 9 digits followed by V/X (e.g., 123456789V) or 12 digits (e.g., 122345698872)",
        });
      }

      const existingUser = await staffMembers.findOne({ NIC, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: "NIC already exists" });
      }
      req.body.NIC = NIC;
    }

    if (req.body.email && req.body.email !== staff.email) {
      const existingEmail = await staffMembers.findOne({
        email: req.body.email,
        _id: { $ne: req.params.id },
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    if (req.body.dateJoined) {
      const trimmedDateJoined = req.body.dateJoined.trim();
      const dateJoinedDate = new Date(trimmedDateJoined);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(dateJoinedDate.getTime())) {
        return res.status(400).json({ message: "Date joined must be a valid date" });
      }
      if (dateJoinedDate > today) {
        return res.status(400).json({ message: "Date joined cannot be in the future" });
      }
      req.body.dateJoined = dateJoinedDate;
    }

    if (req.file) {
      const nic = req.body.NIC || staff.NIC;
      const fileName = `${nic}-profile`;
      req.body.profilePic = await uploadToCloudinary(req.file, fileName, "staff_profile_pics");
    }

    const updatedStaff = await staffMembers.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    return res.status(200).json(updatedStaff);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error updating staff:", error.message, error.stack);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
    console.error("Unknown error:", error);
    return res.status(500).json({ message: "Server error", error: "An unknown error occurred" });
  }
};