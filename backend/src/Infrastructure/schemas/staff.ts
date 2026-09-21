import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    DOB: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        required: true
    },
    address: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        required: false,
        default: null
    },
    dateJoined: {
        type: Date,
        default: Date.now,
        required: true
    },
    warehouseAssigned: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "On Leave", "Suspended", "Terminated"],
        default: "Active"
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [
            "Business Owner",
            "Warehouse Manager",
            "Inventory Manager",
            "Driver",
            "Maintenance Staff",
            "Other Staff"
        ],
        required: true
    },
    NIC: {
        type: String,
        required: true,
        unique: true,
    },
    emName: {
        type: String,
        default: null
    },
    emRelation: {
        type: String,
        default: null
    },
    emNumber: {
        type: String,
        default: null
    },
    qrCode: {
        type: String,
        default: null
    }
}, { timestamps: true });

const staffMembers = mongoose.model("StaffMembers", staffSchema);

export default staffMembers;