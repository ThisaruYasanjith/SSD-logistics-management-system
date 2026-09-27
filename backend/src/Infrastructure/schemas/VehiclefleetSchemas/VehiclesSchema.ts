
import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema({

  OwnersNIC: {
    type: String,
    required: true,
    trim: true,
  },
  OwnersName: {
    type: String,
    required: true,
    trim: true,
  },
  ContactNumber: {
    type: String,
    required: true,
    trim: true,
  },
  Address: {
    type: String,
    required: true,
    trim: true,
  },
  Email: {
    type: String,
    required: true,
    trim: true,
  },
  VehicleNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 4,
    maxlength: 20,
  },
  VehicleType: {
    type: String,
    required: true,
    trim: true,
    enum: ["Lorry", "Van", "Three Wheeler"],
  },
  FuelType: {
    type: String,
    required: true,
    trim: true,
    enum: ["Diesel", "Petrol", "EV"],
  },
  VehicleBrand: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  LoadCapacity: {
    type: Number,
    required: true,
    min: 0,
    max: 1000000,
  },
  DriverID: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },

  Maintenance: [{ type: mongoose.Schema.Types.ObjectId, ref: 'maintenance' }],

  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: String, default: null },
});

const Vehicle = mongoose.model("vehicles", VehicleSchema);
export default Vehicle;
