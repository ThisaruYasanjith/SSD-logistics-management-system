import mongoose from "mongoose";

const MaintenanceSchema = new mongoose.Schema({

    VehicleNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    MaintenanceID: { type: String, required: true, unique: true, index: true },
    MaintenanceDate: { type: Date, required: true },
    Type: { type: String, required: true, trim: true, maxlength: 100 },
    Cost: { type: Number, required: true, min: 0, max: 100000000 },
    Description: { type: String, trim: true, maxlength: 2000 },
  });

  const Maintenance = mongoose.model("maintenance", MaintenanceSchema);

  export default Maintenance;
