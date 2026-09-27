import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { toast } from "react-toastify";

const StyledTextField = styled(TextField)(() => ({
  marginBottom: "1rem",
}));

const StyledButton = styled(Button)(() => ({
  background: "linear-gradient(to right, #00b09b, #96c93d)",
  color: "#FFFFFF",
  fontWeight: "bold",
  borderRadius: "12px",
  paddingX: 3,
  paddingY: 1,
  textTransform: "none",
  "&:hover": {
    background: "linear-gradient(to right, #00897b, #8fbc8f)",
  },
}));

import api, { errorMessage } from "../../utils/apiClient";
const VehicleMaintenanceForm = () => {
  const navigate = useNavigate();
  const { VehicleNumber } = useParams();

  const [vehicleNumber, setVehicleNumber] = useState(VehicleNumber || "");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setValidationErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    switch (name) {
      case "vehicleNumber":
        setVehicleNumber(value);
        break;
      case "maintenanceDate":
        setMaintenanceDate(value);
        break;
      case "maintenanceType":
        setMaintenanceType(value);
        break;
      case "description":
        setDescription(value);
        break;
      case "cost":
        setCost(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = {};

    if (!vehicleNumber) {
      errors.vehicleNumber = "Vehicle Registration Number is required.";
    }
    if (!maintenanceDate) {
      errors.maintenanceDate = "Maintenance Date is required.";
    }
    if (!maintenanceType) {
      errors.maintenanceType = "Maintenance Type is required.";
    }
    if (!cost) {
      errors.cost = "Cost is required.";
    } else if (isNaN(parseFloat(cost)) || parseFloat(cost) < 0) {
      errors.cost = "Cost must be a valid non-negative number.";
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    const maintenanceData = {
      VehicleNumber: vehicleNumber,
      MaintenanceDate: maintenanceDate,
      Type: maintenanceType,
      Description: description,
      Cost: parseFloat(cost),
    };

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/maintenance", maintenanceData);
      console.log("Maintenance details saved:", response.data);
      toast.success("Maintenance details saved successfully!");
      navigate(`/vehicle/VehicleProfile/${vehicleNumber}`);
    } catch (error) {
      console.error("Error saving maintenance details:", error);
      setError(errorMessage(error, "Error saving maintenance details."));
      toast.error("Error saving maintenance details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/vehicle/VehicleProfile/${vehicleNumber}`);
  };

  return (
    <Box sx={{ p: 4, bgcolor: "#FFFFFF", minHeight: "100vh" }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: "#2E2E2E", fontWeight: "bold", mb: 3 }}
      >
        Add Vehicle Maintenance Details
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2, textAlign: "center" }}>
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <StyledTextField
          fullWidth
          label="Vehicle Registration Number"
          value={vehicleNumber}
          name="vehicleNumber"
          onChange={handleInputChange}
          InputProps={{ readOnly: true }}
          error={!!validationErrors.vehicleNumber}
          helperText={validationErrors.vehicleNumber}
        />

        <StyledTextField
          fullWidth
          label="Maintenance Date"
          type="date"
          name="maintenanceDate"
          value={maintenanceDate}
          onChange={handleInputChange}
          required
          InputLabelProps={{ shrink: true }}
          error={!!validationErrors.maintenanceDate}
          helperText={validationErrors.maintenanceDate}
        />

        <FormControl
          fullWidth
          sx={{ marginBottom: "1rem" }}
          error={!!validationErrors.maintenanceType}
        >
          <InputLabel id="maintenance-type-label">Maintenance Type</InputLabel>
          <Select
            labelId="maintenance-type-label"
            id="maintenanceType"
            name="maintenanceType"
            value={maintenanceType}
            label="Maintenance Type"
            onChange={handleInputChange}
            required
          >
            <MenuItem value="Routine Service">Routine Service</MenuItem>
            <MenuItem value="Repair">Repair</MenuItem>
            <MenuItem value="Tyre Change">Tyre Change</MenuItem>
            <MenuItem value="Oil Change">Oil Change</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
          {validationErrors.maintenanceType && (
            <Typography variant="caption" color="error">
              {validationErrors.maintenanceType}
            </Typography>
          )}
        </FormControl>

        <StyledTextField
          fullWidth
          label="Description"
          name="description"
          value={description}
          onChange={handleInputChange}
          multiline
          rows={4}
          sx={{ marginBottom: "1rem" }}
        />

        <StyledTextField
          fullWidth
          label="Cost (LKR)"
          type="number"
          name="cost"
          value={cost}
          onChange={handleInputChange}
          required
          sx={{ marginBottom: "2rem" }}
          error={!!validationErrors.cost}
          helperText={validationErrors.cost}
        />

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{ borderRadius: "12px", textTransform: "none" }}
            disabled={loading}
          >
            Cancel
          </Button>
          <StyledButton type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Maintenance Details"}
          </StyledButton>
        </Box>
      </form>
    </Box>
  );
};

export default VehicleMaintenanceForm;