import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  CircularProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api, { errorMessage } from "../../utils/apiClient";
export default function WarehouseForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    StreetName: "",
    City: "",
    Province: "",
    SpecialInstruction: "",
    Description: "",
    Bulkysecsize: "",
    Hazardoussecsize: "",
    Perishablesecsize: "",
    Sparesecsize: "",
    Otheritems: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sri Lanka provinces array
  const provinces = [
    "Western",
    "Central",
    "Southern",
    "Northern",
    "Eastern",
    "North Western",
    "North Central",
    "Uva",
    "Sabaragamuwa",
  ];

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.StreetName.trim()) newErrors.StreetName = "Street Name is required";
    if (!formData.City.trim()) newErrors.City = "City is required";
    if (!formData.Province.trim()) newErrors.Province = "Province is required";

    // Section size validation (numeric and non-negative)
    const sections = [
      { field: "Bulkysecsize", label: "Bulky Items" },
      { field: "Hazardoussecsize", label: "Hazardous Items" },
      { field: "Perishablesecsize", label: "Perishables" },
      { field: "Sparesecsize", label: "Spare Parts" },
      { field: "Otheritems", label: "Other Items" },
    ];

    sections.forEach(({ field, label }) => {
      const value = formData[field];
      if (value && isNaN(value)) {
        newErrors[field] = `${label} size must be a number`;
      } else if (value && Number(value) < 0) {
        newErrors[field] = `${label} size cannot be negative`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(), // Trim all whitespace
    }));

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await api.post("/warehouse", formData);
      toast.success("Warehouse created successfully!");
      setFormData({
        StreetName: "",
        City: "",
        Province: "",
        SpecialInstruction: "",
        Description: "",
        Bulkysecsize: "",
        Hazardoussecsize: "",
        Perishablesecsize: "",
        Sparesecsize: "",
        Otheritems: "",
      });
      setErrors({});
      navigate("/Warehouse");
    } catch (error) {
      const message =
        errorMessage(error, "An error occurred while creating the warehouse");
      setError(message);
      toast.error(message);
      console.error("Error creating warehouse:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      StreetName: "",
      City: "",
      Province: "",
      SpecialInstruction: "",
      Description: "",
      Bulkysecsize: "",
      Hazardoussecsize: "",
      Perishablesecsize: "",
      Sparesecsize: "",
      Otheritems: "",
    });
    setErrors({});
    setError("");
    toast.info("Form has been canceled and cleared.");
    navigate("/Warehouse");
  };

  if (error && !errors.submit) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => setError("")}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={2} sx={{ padding: "16px", maxWidth: "800px", margin: "auto" }}>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", textAlign: "center" }}>
          Create Warehouse Profile
        </Typography>

        {errors.submit && (
          <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
            {errors.submit}
          </Typography>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          <TextField
            label="Street Name"
            name="StreetName"
            value={formData.StreetName}
            onChange={handleChange}
            variant="filled"
            fullWidth
            error={!!errors.StreetName}
            helperText={errors.StreetName}
            required
          />
          <TextField
            label="City"
            name="City"
            value={formData.City}
            onChange={handleChange}
            variant="filled"
            fullWidth
            error={!!errors.City}
            helperText={errors.City}
            required
          />

          <TextField
            select
            label="Province"
            name="Province"
            value={formData.Province}
            onChange={handleChange}
            variant="filled"
            fullWidth
            error={!!errors.Province}
            helperText={errors.Province}
            required
          >
            {provinces.map((province) => (
              <MenuItem key={province} value={province}>
                {province}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Special Instruction"
            name="SpecialInstruction"
            value={formData.SpecialInstruction}
            onChange={handleChange}
            variant="filled"
            fullWidth
            multiline
            rows={4}
          />
          <TextField
            label="Description"
            name="Description"
            value={formData.Description}
            onChange={handleChange}
            variant="filled"
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
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Size (sq ft)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { label: "Bulky Items", field: "Bulkysecsize" },
                  { label: "Hazardous Items", field: "Hazardoussecsize" },
                  { label: "Perishables", field: "Perishablesecsize" },
                  { label: "Spare Parts", field: "Sparesecsize" },
                  { label: "Other Items", field: "Otheritems" },
                ].map((row) => (
                  <TableRow key={row.field}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>
                      <TextField
                        name={row.field}
                        type="number"
                        value={formData[row.field]}
                        onChange={handleChange}
                        size="small"
                        variant="outlined"
                        error={!!errors[row.field]}
                        helperText={errors[row.field]}
                        inputProps={{ min: 0 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#ab47bc" }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : "Create"}
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Grid>
  );
}