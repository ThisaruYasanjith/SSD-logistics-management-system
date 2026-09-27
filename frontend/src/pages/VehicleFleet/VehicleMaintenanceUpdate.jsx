import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { toast } from "react-toastify";

import api, { errorMessage } from "../../utils/apiClient";
const StyledTextField = styled(TextField)(() => ({
  marginBottom: "1rem",
}));

const StyledButton = styled(Button)(() => ({
  fontWeight: "bold",
  borderRadius: "12px",
  paddingX: 3,
  paddingY: 1,
  textTransform: "none",
  "&:hover": {
    background: "linear-gradient(to right, #00897b, #8fbc8f)", // Consistent with VehicleMaintenanceForm
  },
}));

const UpdateVehicleMaintenanceForm = () => {
  const navigate = useNavigate();
  const { MaintenanceID, VehicleNumber } = useParams();

  const [vehicleNumber, setVehicleNumber] = useState(VehicleNumber || "");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMaintenanceData = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/maintenance/${MaintenanceID}`);
        const data = response.data;
        setVehicleNumber(data.VehicleNumber || VehicleNumber || "");
        setMaintenanceDate(data.MaintenanceDate ? data.MaintenanceDate.split("T")[0] : "");
        setMaintenanceType(data.Type || "");
        setDescription(data.Description || "");
        setCost(String(data.Cost || ""));
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching maintenance details.");
        toast.error("Error fetching maintenance details.");
        console.error("Error fetching maintenance details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (MaintenanceID) {
      fetchMaintenanceData();
    } else {
      setError("No Maintenance ID provided.");
      setLoading(false);
    }
  }, [MaintenanceID]);

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

  const handleUpdate = async (event) => {
    event.preventDefault();
    const errors = {};

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
      toast.error("Please fix the validation errors before updating.");
      return;
    }

    const updatedMaintenanceData = {
      MaintenanceDate: maintenanceDate,
      Type: maintenanceType,
      Description: description,
      Cost: parseFloat(cost),
    };

    setLoading(true);
    setError("");
    try {
      const response = await api.put(`/maintenance/${MaintenanceID}`, updatedMaintenanceData);
      console.log("Maintenance details updated:", response.data);
      toast.success("Maintenance details updated successfully!");
      navigate(`/vehicle/VehicleProfile/${vehicleNumber}`);
    } catch (error) {
      setError(errorMessage(error, "Error updating maintenance details."));
      toast.error("Error updating maintenance details.");
      console.error("Error updating maintenance details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      setLoading(true);
      setError("");
      try {
        await api.delete(`/maintenance/${MaintenanceID}`);
        console.log("Maintenance record deleted successfully");
        toast.success("Maintenance record deleted successfully!");
        navigate(`/vehicle/VehicleProfile/${vehicleNumber}`);
      } catch (error) {
        setError(errorMessage(error, "Error deleting maintenance record."));
        toast.error("Error deleting maintenance record.");
        console.error("Error deleting maintenance record:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    navigate(`/vehicle/VehicleProfile/${vehicleNumber}`);
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
    <Box sx={{ p: 4, bgcolor: "#FFFFFF", minHeight: "100vh" }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: "#2E2E2E", fontWeight: "bold", mb: 3 }}
      >
        Update/Delete Vehicle Maintenance Details
      </Typography>

      <form onSubmit={handleUpdate}>
        <StyledTextField
          fullWidth
          label="Vehicle Registration Number"
          value={vehicleNumber}
          name="vehicleNumber"
          InputProps={{ readOnly: true }}
          sx={{ marginBottom: "1rem" }}
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
          sx={{ marginBottom: "1rem" }}
          inputProps={{ max: new Date().toISOString().split("T")[0] }}
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
          <StyledButton
            type="submit"
            sx={{
              background: "linear-gradient(to right, #00b09b, #96c93d)",
              color: "#FFFFFF",
            }}
            disabled={loading}
          >
            Update Maintenance
          </StyledButton>
          <StyledButton
            onClick={handleDelete}
            variant="outlined"
            color="error"
            sx={{ borderRadius: "12px", textTransform: "none" }}
            disabled={loading}
          >
            Delete Maintenance
          </StyledButton>
        </Box>
      </form>
    </Box>
  );
};

export default UpdateVehicleMaintenanceForm;