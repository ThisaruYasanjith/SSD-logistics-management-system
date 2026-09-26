import mongoose from "mongoose";

const WarehouseSchema = new mongoose.Schema({
    WarehouseID: { type: String, unique: true, index: true },
    StreetName: { type: String, required: true, trim: true, maxlength: 200 },
    City: { type: String, required: true, trim: true, maxlength: 100 },
    Province: { type: String, required: true, trim: true, maxlength: 50 },
    SpecialInstruction: { type: String, trim: true, maxlength: 2000 },
    Description: { type: String, trim: true, maxlength: 5000 },
    Bulkysecsize: {type: Number, default: 0, min: 0, max: 1000000 },
    Hazardoussecsize: {type: Number, default: 0, min: 0, max: 1000000 },
    Perishablesecsize: {type: Number, default: 0, min: 0, max: 1000000 },
    Sparesecsize: {type: Number, default: 0, min: 0, max: 1000000 },
    Otheritems: {type: Number, default: 0, min: 0, max: 1000000 },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: String, default: null },
});

const Warehouse = mongoose.model("warehouses", WarehouseSchema);
export default Warehouse;
