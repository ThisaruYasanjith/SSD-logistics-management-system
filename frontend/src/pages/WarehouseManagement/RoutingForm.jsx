import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";

import api, { errorMessage } from "../../utils/apiClient";
export default function RoutingMaintenanceForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    warehouse: "",
    date: "",
    waterbill: "",
    currentbill: "",
    description: "",
  });
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/Warehouse");
        console.log("Fetched warehouses:", response.data);
        setWarehouses(response.data);
      } catch (error) {
        setError(errorMessage(error, "Failed to load warehouses."));
        toast.error("Failed to load warehouses.");
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
    if (!formData.warehouse) errors.warehouse = "Warehouse is required.";
    if (!formData.date) errors.date = "Maintenance date is required.";
    if (!formData.waterbill) {
      errors.waterbill = "Water bill is required.";
    } else if (isNaN(formData.waterbill) || parseFloat(formData.waterbill) < 0) {
      errors.waterbill = "Water bill must be a positive number.";
    }
    if (!formData.currentbill) {
      errors.currentbill = "Current bill is required.";
    } else if (isNaN(formData.currentbill) || parseFloat(formData.currentbill) < 0) {
      errors.currentbill = "Current bill must be a positive number.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);

    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await api.post("/routingmaintenance", {
        warehouse: formData.warehouse,
        date: new Date(formData.date).getTime(),
        waterbill: parseFloat(formData.waterbill),
        currentbill: parseFloat(formData.currentbill),
        description: formData.description,
      });
      console.log("Routing Maintenance Created:", response.data);
      toast.success("Routing Maintenance Created Successfully!");
      navigate("/warehouse/Maintainance");
    } catch (error) {
      setError(errorMessage(error, "Failed to create routing maintenance."));
      toast.error("Failed to create routing maintenance. Please try again.");
      console.error("Error creating Routing Maintenance:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      warehouse: "",
      date: "",
      waterbill: "",
      currentbill: "",
      description: "",
    });
    setValidationErrors({});
    toast.info("Form reset.");
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
        <Typography>Loading warehouses…</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "#fff",
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3 }}>
          Routing Maintenance Form
        </Typography>

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <FormControl fullWidth sx={{ mb: 2 }} error={!!validationErrors.warehouse}>
            <InputLabel id="warehouse-label">Select Warehouse</InputLabel>
            <Select
              labelId="warehouse-label"
              id="warehouse"
              name="warehouse"
              value={formData.warehouse}
              onChange={handleChange}
              label="Select Warehouse"
              required
            >
              {warehouses.map((w) => (
                <MenuItem key={w.WarehouseID} value={w.WarehouseID}>
                  {w.WarehouseID} — {w.City}, {w.Province}
                </MenuItem>
              ))}
            </Select>
            {validationErrors.warehouse && (
              <Typography color="error" variant="caption">
                {validationErrors.warehouse}
              </Typography>
            )}
          </FormControl>

          <TextField
            label="Maintenance Date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            required
            error={!!validationErrors.date}
            helperText={validationErrors.date}
          />

          <TextField
            label="Water Bill"
            name="waterbill"
            type="number"
            value={formData.waterbill}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            required
            error={!!validationErrors.waterbill}
            helperText={validationErrors.waterbill}
            inputProps={{ step: "0.01", min: "0" }}
          />

          <TextField
            label="Current Bill"
            name="currentbill"
            type="number"
            value={formData.currentbill}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            required
            error={!!validationErrors.currentbill}
            helperText={validationErrors.currentbill}
            inputProps={{ step: "0.01", min: "0" }}
          />

          <TextField
            label="Description"
            name="description"
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitting}
            >
              {submitting ? <CircularProgress size={24} /> : "Submit"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={handleReset}
              disabled={submitting}
            >
              Reset
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
}