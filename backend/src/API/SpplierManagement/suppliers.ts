import express from "express";
import { createSupplierManagement, getAllSuppliers, getSupplierById, deleteSupplier, updateSupplier } from "../../Application/SupplierManagement/suppliers";
import { authenticateToken, authorizeRole } from "../../middleware/authentication";

const suppliersRouter = express.Router();

const MANAGER_ROLES = ["Business Owner", "Warehouse Manager", "Inventory Manager"];
const ADMIN_ROLES = ["Business Owner", "Warehouse Manager"];

suppliersRouter
  .route("/")
  .get(authenticateToken, authorizeRole(MANAGER_ROLES), getAllSuppliers)
  .post(authenticateToken, authorizeRole(ADMIN_ROLES), createSupplierManagement);

suppliersRouter
  .route("/:_id")
  .get(authenticateToken, authorizeRole(MANAGER_ROLES), getSupplierById)
  .put(authenticateToken, authorizeRole(ADMIN_ROLES), updateSupplier)
  .delete(authenticateToken, authorizeRole(ADMIN_ROLES), deleteSupplier);

export default suppliersRouter;
