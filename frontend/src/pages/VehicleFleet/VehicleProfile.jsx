import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  Grid,
  Paper,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import { toast } from "react-toastify";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import ReportDownloader from "./MaintenanceSpecificVehicleReport";
import {
  validateNIC,
  validateName,
  validateContactNumber,
  validateAddress,
  validateEmail,
  validateVehicleNumber,
  validateVehicleTypeAndFuelType,
  validateVehicleBrand,
  validateLoadCapacity,
  validateDriverSelection,
} from "./vehicleValidations";

import api, { errorMessage } from "../../utils/apiClient";
const StyledTableHead = styled(TableHead)(() => ({
  backgroundColor: "#f0f0f0",
}));

const StyledTableCell = styled(TableCell)(() => ({
  color: "#333333",
  fontWeight: "bold",
  fontSize: 15,
}));

const StyledTableRow = styled(TableRow)(() => ({
  "&:hover": {
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
  },
}));

const TotalCostPaper = styled(Paper)(() => ({
  padding: "16px",
  marginTop: "20px",
  marginBottom: "20px",
  borderRadius: "8px",
  backgroundColor: "#e0f7fa",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  display: "inline-block",
}));

const TotalCostTypography = styled(Typography)(() => ({
  fontWeight: "bold",
  fontSize: "1.2rem",
  color: "#1976d2",
}));

export default function VehicleProfile() {
  const { VehicleNumber } = useParams();
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState({});
  const [originalData, setOriginalData] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [errorMessages, setErrorMessages] = useState({});
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [totalMaintenanceCost, setTotalMaintenanceCost] = useState(0);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
  };

  const handleEditToggle = () => {
    if (editMode) {
      setVehicleData(originalData); // Reset to original data
      setErrorMessages({});
    }
    setEditMode(!editMode);
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this vehicle?");
    if (!confirmDelete) return;

    setLoading(true);
    setError("");
    try {
      await api.delete(`/vehicles/${VehicleNumber}`);
      toast.success("Vehicle deleted successfully.");
      navigate("/vehicle");
    } catch (error) {
      setError(errorMessage(error, "Error deleting vehicle."));
      toast.error("Error deleting vehicle.");
      console.error("Error deleting vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setErrorMessages({});
    const errors = {};

    errors.NIC = validateNIC(vehicleData.OwnersNIC);
    errors.Name = validateName(vehicleData.OwnersName);
    errors.ContactNumber = validateContactNumber(vehicleData.ContactNumber);
    errors.Address = validateAddress(vehicleData.Address);
    errors.Email = validateEmail(vehicleData.Email);
    errors.VehicleNumber = validateVehicleNumber(vehicleData.VehicleNumber);
    errors.VehicleTypeAndFuelType = validateVehicleTypeAndFuelType(
      vehicleData.VehicleType,
      vehicleData.FuelType
    );
    errors.VehicleBrand = validateVehicleBrand(vehicleData.VehicleBrand);
    errors.LoadCapacity = validateLoadCapacity(vehicleData.LoadCapacity);
    errors.DriverSelection = validateDriverSelection(vehicleData.DriverID);

    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([key, value]) => value !== null)
    );

    if (Object.keys(filteredErrors).length > 0) {
      setErrorMessages(filteredErrors);
      toast.error("Please fix the validation errors before saving.");
      return;
    }

    setErrorMessages({});
    setLoading(true);
    setError("");
    try {
      const response = await api.put(`/vehicles/${VehicleNumber}`, vehicleData);
      setVehicleData(response.data);
      setOriginalData(response.data);
      toast.success("Vehicle updated successfully.");
      setEditMode(false);
    } catch (error) {
      setError(errorMessage(error, "Error saving vehicle details."));
      toast.error("Error saving vehicle details.");
      console.error("Error saving vehicle details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/vehicles/${VehicleNumber}`);
        setVehicleData(response.data);
        setOriginalData(response.data);
        setMaintenanceData(response.data.Maintenance || []);
      } catch (error) {
        setError(errorMessage(error, "Error fetching vehicle details."));
        toast.error("Error fetching vehicle details.");
        console.error("Error fetching vehicle details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDrivers = async () => {
      try {
        const response = await api.get("/drivers");
        setDrivers(response.data);
      } catch (error) {
        setError(errorMessage(error, "Error fetching drivers."));
        toast.error("Error fetching drivers.");
        console.error("Error fetching drivers:", error);
      }
    };

    fetchVehicleData();
    fetchDrivers();
  }, [VehicleNumber]);

  useEffect(() => {
    const totalCost = maintenanceData.reduce(
      (sum, maintenance) => sum + parseFloat(maintenance.Cost || 0),
      0
    );
    setTotalMaintenanceCost(totalCost);
  }, [maintenanceData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    <Box>
      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 4 }}>
          Vehicle Details
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Registration Number"
              name="VehicleNumber"
              value={vehicleData.VehicleNumber || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.VehicleNumber}
              helperText={errorMessages.VehicleNumber}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            {editMode ? (
              <FormControl fullWidth>
                <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
                <Select
                  labelId="vehicle-type-label"
                  name="VehicleType"
                  value={vehicleData.VehicleType || ""}
                  onChange={handleChange}
                  label="Vehicle Type"
                >
                  <MenuItem value="" disabled>
                    -- Select Vehicle Type --
                  </MenuItem>
                  <MenuItem value="Lorry">Lorry</MenuItem>
                  <MenuItem value="Van">Van</MenuItem>
                  <MenuItem value="Three Wheeler">Three Wheeler</MenuItem>
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Vehicle Type"
                value={vehicleData.VehicleType || ""}
                fullWidth
                disabled
                InputLabelProps={{ shrink: true }}
              />
            )}
            {errorMessages.VehicleTypeAndFuelType && (
              <Typography variant="body2" color="error">
                {errorMessages.VehicleTypeAndFuelType}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={!editMode}>
              <InputLabel id="fuel-type-label">Fuel Type</InputLabel>
              <Select
                labelId="fuel-type-label"
                name="FuelType"
                value={vehicleData.FuelType || ""}
                onChange={handleChange}
                label="Fuel Type"
              >
                <MenuItem value="" disabled>
                  -- Select Fuel Type --
                </MenuItem>
                <MenuItem value="Diesel">Diesel</MenuItem>
                <MenuItem value="Petrol">Petrol</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Brand"
              name="VehicleBrand"
              value={vehicleData.VehicleBrand || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.VehicleBrand}
              helperText={errorMessages.VehicleBrand}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Load Capacity"
              name="LoadCapacity"
              value={vehicleData.LoadCapacity || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.LoadCapacity}
              helperText={errorMessages.LoadCapacity}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Owner NIC"
              name="OwnersNIC"
              value={vehicleData.OwnersNIC || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.NIC}
              helperText={errorMessages.NIC}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Owner Name"
              name="OwnersName"
              value={vehicleData.OwnersName || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.Name}
              helperText={errorMessages.Name}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Number"
              name="ContactNumber"
              value={vehicleData.ContactNumber || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.ContactNumber}
              helperText={errorMessages.ContactNumber}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Address"
              name="Address"
              value={vehicleData.Address || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.Address}
              helperText={errorMessages.Address}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Address"
              name="Email"
              value={vehicleData.Email || ""}
              onChange={handleChange}
              fullWidth
              disabled={!editMode}
              InputLabelProps={{ shrink: true }}
              error={!!errorMessages.Email}
              helperText={errorMessages.Email}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            {editMode ? (
              <FormControl fullWidth error={!!errorMessages.DriverSelection}>
                <InputLabel id="driver-label">Driver</InputLabel>
                <Select
                  labelId="driver-label"
                  name="DriverID"
                  value={vehicleData.DriverID || ""}
                  onChange={handleChange}
                  label="Driver"
                >
                  <MenuItem value="" disabled>
                    -- Select Driver --
                  </MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver.fullName} value={driver.fullName}>
                      {driver.fullName}
                    </MenuItem>
                  ))}
                </Select>
                {errorMessages.DriverSelection && (
                  <Typography variant="caption" color="error">
                    {errorMessages.DriverSelection}
                  </Typography>
                )}
              </FormControl>
            ) : (
              <TextField
                label="Driver"
                name="DriverID"
                value={vehicleData.DriverID || ""}
                fullWidth
                disabled
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Grid>
        </Grid>

        <Box mt={4}>
          {!editMode ? (
            <Button
              variant="contained"
              onClick={handleEditToggle}
              sx={{
                background: "linear-gradient(to right, #8e2de2, #4a00e0)",
                color: "white",
                borderRadius: "12px",
                "&:hover": {
                  background: "linear-gradient(to right, #4a00e0, #8e2de2)",
                },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={handleSave}
                sx={{ mr: 2, borderRadius: "12px" }}
                disabled={loading}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={handleEditToggle}
                sx={{ mr: 2, borderRadius: "12px" }}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            sx={{ ml: 2, borderRadius: "12px" }}
            disabled={loading}
          >
            Delete Vehicle
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Vehicle Maintenance
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box>
            <TotalCostPaper>
              <TotalCostTypography>
                Total Maintenance Cost: LKR {totalMaintenanceCost.toLocaleString()}
              </TotalCostTypography>
            </TotalCostPaper>
          </Box>
          <Box>
            <ReportDownloader
              vehicleData={vehicleData}
              maintenanceData={maintenanceData}
              totalMaintenanceCost={totalMaintenanceCost}
            />
          </Box>
        </Box>

        <Box sx={{ mb: "20px" }}>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <Table sx={{ minWidth: 700 }} aria-label="vehicle maintenance table">
              <StyledTableHead>
                <TableRow>
                  <StyledTableCell>Maintenance ID</StyledTableCell>
                  <StyledTableCell>Maintenance Date</StyledTableCell>
                  <StyledTableCell>Maintenance Type</StyledTableCell>
                  <StyledTableCell>Cost</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                </TableRow>
              </StyledTableHead>
              <TableBody>
                {maintenanceData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No maintenance records available.
                    </TableCell>
                  </TableRow>
                ) : (
                  maintenanceData.map((maintenance) => (
                    <StyledTableRow
                      key={maintenance._id || maintenance.MaintenanceID}
                      onClick={() =>
                        navigate(
                          `/vehicle/VehicleProfile/${VehicleNumber}/vehicleMaintenance/${maintenance.MaintenanceID}`
                        )
                      }
                    >
                      <TableCell>{maintenance.MaintenanceID}</TableCell>
                      <TableCell>{formatDate(maintenance.MaintenanceDate)}</TableCell>
                      <TableCell>{maintenance.Type}</TableCell>
                      <TableCell>{maintenance.Cost}</TableCell>
                      <TableCell>{maintenance.Description}</TableCell>
                    </StyledTableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box>
          <Button
            variant="contained"
            onClick={() => navigate(`/vehicle/VehicleProfile/${vehicleData.VehicleNumber}/vehicleMaintenance`)}
            sx={{
              background: "linear-gradient(to right, #8e2de2, #4a00e0)",
              color: "#FFFFFF",
              fontWeight: "bold",
              borderRadius: "12px",
              paddingX: 3,
              paddingY: 1,
              textTransform: "none",
              "&:hover": {
                background: "linear-gradient(to right, #7b1fa2, #311b92)",
              },
            }}
          >
            Add Vehicle Maintenance
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}