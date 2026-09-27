import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import api, { errorMessage } from "../../utils/apiClient";
export default function WarehouseForm() {
  const navigate = useNavigate();
  const { WarehouseID } = useParams();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!WarehouseID) {
      setError("Invalid warehouse ID.");
      setLoading(false);
      return;
    }

    const fetchWarehouse = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/warehouse/${WarehouseID}`);
        setFormData(response.data);
        console.log("Fetched warehouse:", response.data);
      } catch (error) {
        setError(errorMessage(error, "Error fetching warehouse."));
        toast.error("Error fetching warehouse.");
        console.error("Error fetching warehouse:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [WarehouseID]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.StreetName) errors.StreetName = "Street Name is required.";
    if (!formData.City) errors.City = "City is required.";
    if (!formData.Province) errors.Province = "Province is required.";
    const sectionFields = [
      "Bulkysecsize",
      "Hazardoussecsize",
      "Perishablesecsize",
      "Sparesecsize",
      "Otheritems",
    ];
    sectionFields.forEach((field) => {
      if (!formData[field] || isNaN(formData[field]) || parseFloat(formData[field]) < 0) {
        errors[field] = `${field} must be a positive number.`;
      }
    });
    return errors;
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setValidationErrors({});
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    try {
      const response = await api.put(`/warehouse/${WarehouseID}`, {
        streetName: formData.StreetName,
        city: formData.City,
        province: formData.Province,
        specialInstruction: formData.SpecialInstruction,
        description: formData.Description,
        bulkysecsize: parseFloat(formData.Bulkysecsize),
        hazardoussecsize: parseFloat(formData.Hazardoussecsize),
        perishablesecsize: parseFloat(formData.Perishablesecsize),
        sparesecsize: parseFloat(formData.Sparesecsize),
        otheritems: parseFloat(formData.Otheritems),
      });
      toast.success("Warehouse updated successfully!");
      setEditMode(false);
      navigate("/WarehouseSubmit");
    } catch (error) {
      toast.error(errorMessage(error, "Error updating warehouse."));
      console.error("Error updating warehouse:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/warehouse/${WarehouseID}`);
      toast.success("Warehouse deleted successfully.");
      navigate("/WarehouseSubmit");
    } catch (error) {
      toast.error(errorMessage(error, "Error deleting warehouse."));
      console.error("Error deleting warehouse:", error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/warehouse")}
        >
          Back to Warehouses
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ padding: "16px", maxWidth: "800px", margin: "auto" }}>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
          Warehouse Profile
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          <TextField
            label="Warehouse ID"
            name="WarehouseID"
            value={formData.WarehouseID || ""}
            variant="filled"
            disabled
            fullWidth
          />
          <TextField
            label="Street Name"
            name="StreetName"
            value={formData.StreetName || ""}
            onChange={handleChange}
            variant="filled"
            disabled={!editMode}
            fullWidth
            error={!!validationErrors.StreetName}
            helperText={validationErrors.StreetName}
            required
          />
          <TextField
            label="City"
            name="City"
            value={formData.City || ""}
            onChange={handleChange}
            variant="filled"
            disabled={!editMode}
            fullWidth
            error={!!validationErrors.City}
            helperText={validationErrors.City}
            required
          />
          <TextField
            label="Province"
            name="Province"
            value={formData.Province || ""}
            onChange={handleChange}
            variant="filled"
            disabled={!editMode}
            fullWidth
            error={!!validationErrors.Province}
            helperText={validationErrors.Province}
            required
          />
          <TextField
            label="Special Instruction"
            name="SpecialInstruction"
            value={formData.SpecialInstruction || ""}
            onChange={handleChange}
            variant="filled"
            disabled={!editMode}
            fullWidth
            multiline
            rows={4}
          />
          <TextField
            label="Description"
            name="Description"
            value={formData.Description || ""}
            onChange={handleChange}
            variant="filled"
            disabled={!editMode}
            fullWidth
            multiline
            rows={4}
          />
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Section Sizes
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Section</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Size (sq ft)</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: "Bulky Items", field: "Bulkysecsize" },
                  { label: "Hazardous Items", field: "Hazardoussecsize" },
                  { label: "Perishables", field: "Perishablesecsize" },
                  { label: "Spare Parts", field: "Sparesecsize" },
                  { label: "Other Items", field: "Otheritems" },
                ].map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>
                      {editMode ? (
                        <TextField
                          name={row.field}
                          type="number"
                          value={formData[row.field] || ""}
                          onChange={handleChange}
                          size="small"
                          variant="outlined"
                          error={!!validationErrors[row.field]}
                          helperText={validationErrors[row.field]}
                          inputProps={{ min: "0", step: "0.01" }}
                          required
                        />
                      ) : (
                        formData[row.field] || 0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
          {!editMode ? (
            <>
              <Button variant="contained" color="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#ab47bc" }}
                onClick={handleSubmit}
              >
                Save
              </Button>
              <Button variant="outlined" color="inherit" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </Box>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete warehouse {formData.WarehouseID}? This action cannot
              be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDelete();
                setDeleteDialogOpen(false);
              }}
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Grid>
  );
}