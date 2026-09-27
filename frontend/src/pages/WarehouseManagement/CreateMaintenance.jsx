import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Stack,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const priorityOptions = ["Low", "Medium", "High"];

import api, { errorMessage } from "../../utils/apiClient";
export default function MaintenanceForm() {
  const [formData, setFormData] = useState({
    warehouseId: "",
    issueDescription: "",
    priority: "",
    scheduledDate: "",
    completionDate: "",
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/Warehouse");
        setWarehouses(response.data);
      } catch (error) {
        setError(errorMessage(error, "Failed to fetch warehouses."));
        toast.error("Failed to fetch warehouses.");
        console.error("Error fetching warehouses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.warehouseId) errors.warehouseId = "Warehouse ID is required.";
    if (!formData.issueDescription) errors.issueDescription = "Issue description is required.";
    if (!formData.priority) errors.priority = "Priority is required.";
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/maintenance", formData);
      console.log("Form submitted successfully:", response.data);
      setFormData({
        warehouseId: "",
        issueDescription: "",
        priority: "",
        scheduledDate: "",
        completionDate: "",
      });
      toast.success("Maintenance request submitted successfully!");
      navigate("/warehouse/Maintainance");
    } catch (error) {
      setError(errorMessage(error, "Error submitting the request."));
      toast.error("Error submitting the request.");
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      warehouseId: "",
      issueDescription: "",
      priority: "",
      scheduledDate: "",
      completionDate: "",
    });
    setValidationErrors({});
    toast.info("Form has been canceled and cleared.");
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
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Add Maintenance Request
      </Typography>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            select
            label="Warehouse ID"
            name="warehouseId"
            value={formData.warehouseId}
            onChange={handleChange}
            required
            error={!!validationErrors.warehouseId}
            helperText={validationErrors.warehouseId}
            disabled={warehouses.length === 0}
          >
            {warehouses.length === 0 ? (
              <MenuItem value="" disabled>
                No warehouses available
              </MenuItem>
            ) : (
              warehouses.map((warehouse) => (
                <MenuItem key={warehouse.WarehouseID} value={warehouse.WarehouseID}>
                  {warehouse.WarehouseID}
                </MenuItem>
              ))
            )}
          </TextField>

          <TextField
            label="Issue Description"
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleChange}
            multiline
            rows={3}
            required
            error={!!validationErrors.issueDescription}
            helperText={validationErrors.issueDescription}
          />
          <TextField
            select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            required
            error={!!validationErrors.priority}
            helperText={validationErrors.priority}
          >
            {priorityOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Scheduled Date"
            name="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Completion Date"
            name="completionDate"
            type="date"
            value={formData.completionDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
          />

          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: "#7b1fa2", maxWidth: 200 }}
              disabled={loading}
            >
              Done
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              sx={{ maxWidth: 200 }}
              disabled={loading}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  );
}