import React, { useState, useEffect } from "react";
import {
  TextField,
  FormControl,
  MenuItem,
  Box,
  InputLabel,
  Select,
  Autocomplete,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
function VehicleRegistrationForm() {
  const navigate = useNavigate();
  const [ownersNIC, setOwnersNIC] = useState("");
  const [ownersName, setOwnersName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [loadCapacity, setLoadCapacity] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/drivers");
        setDrivers(response.data);
      } catch (error) {
        setError(errorMessage(error, "Error fetching drivers."));
        toast.error("Error fetching drivers.");
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setValidationErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    switch (name) {
      case "ownersNIC":
        setOwnersNIC(value);
        break;
      case "ownersName":
        setOwnersName(value);
        break;
      case "contactNumber":
        setContactNumber(value);
        break;
      case "address":
        setAddress(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "vehicleNumber":
        setVehicleNumber(value);
        break;
      case "vehicleType":
        setVehicleType(value);
        break;
      case "fuelType":
        setFuelType(value);
        break;
      case "vehicleBrand":
        setVehicleBrand(value);
        break;
      case "loadCapacity":
        setLoadCapacity(value);
        break;
      default:
        break;
    }
  };

  const handleDriverChange = (event, newValue) => {
    setSelectedDriver(newValue);
    setValidationErrors((prevErrors) => ({ ...prevErrors, selectedDriver: "" }));
  };

  const handleSubmit = async () => {
    setValidationErrors({});
    setError("");

    const errors = {};
    errors.ownersNIC = validateNIC(ownersNIC);
    errors.ownersName = validateName(ownersName);
    errors.contactNumber = validateContactNumber(contactNumber);
    errors.address = validateAddress(address);
    errors.email = validateEmail(email);
    errors.vehicleNumber = validateVehicleNumber(vehicleNumber);
    errors.vehicleType = validateVehicleTypeAndFuelType(vehicleType, fuelType);
    errors.vehicleBrand = validateVehicleBrand(vehicleBrand);
    errors.loadCapacity = validateLoadCapacity(loadCapacity);
    errors.selectedDriver = validateDriverSelection(selectedDriver ? selectedDriver.fullName : "");

    setValidationErrors(errors);

    if (Object.values(errors).some((error) => error)) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    const vehicleData = {
      OwnersNIC: ownersNIC,
      OwnersName: ownersName,
      ContactNumber: contactNumber,
      Address: address,
      Email: email,
      VehicleNumber: vehicleNumber,
      VehicleType: vehicleType,
      FuelType: fuelType,
      VehicleBrand: vehicleBrand,
      LoadCapacity: parseInt(loadCapacity) || 0,
      DriverID: selectedDriver ? selectedDriver.fullName : "",
    };

    setLoading(true);
    try {
      const response = await api.post("/vehicles", vehicleData);
      console.log("Vehicle created:", response.data);
      toast.success("Vehicle created successfully!");
      navigate("/vehicle");
    } catch (error) {
      setError(errorMessage(error, "Failed to create vehicle."));
      toast.error("Failed to create vehicle.");
      console.error("Error creating vehicle:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOwnersNIC("");
    setOwnersName("");
    setContactNumber("");
    setAddress("");
    setEmail("");
    setVehicleNumber("");
    setVehicleType("");
    setFuelType("");
    setVehicleBrand("");
    setLoadCapacity("");
    setSelectedDriver(null);
    setValidationErrors({});
    setError("");
  };

  const vehicleBrandOptions = [
    "Toyota",
    "Nissan",
    "Mitsubishi",
    "Isuzu",
    "Benz",
    "Hyundai",
    "Honda",
    "Bajaj",
    "TATA",
    "Leyland",
    "Piaggio",
  ];

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
    <Box sx={{ p: 4 }}>
      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vehicle Owner Details
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          <TextField
            label="Vehicle Owner's NIC"
            variant="outlined"
            fullWidth
            value={ownersNIC}
            onChange={handleInputChange}
            name="ownersNIC"
            error={!!validationErrors.ownersNIC}
            helperText={validationErrors.ownersNIC}
          />
          <TextField
            label="Vehicle Owner's Name"
            variant="outlined"
            fullWidth
            value={ownersName}
            onChange={handleInputChange}
            name="ownersName"
            error={!!validationErrors.ownersName}
            helperText={validationErrors.ownersName}
          />
          <TextField
            label="Contact Number"
            variant="outlined"
            type="tel"
            fullWidth
            value={contactNumber}
            onChange={handleInputChange}
            name="contactNumber"
            error={!!validationErrors.contactNumber}
            helperText={validationErrors.contactNumber}
          />
          <TextField
            label="Address"
            variant="outlined"
            fullWidth
            value={address}
            onChange={handleInputChange}
            name="address"
            error={!!validationErrors.address}
            helperText={validationErrors.address}
          />
          <TextField
            label="Email Address"
            variant="outlined"
            fullWidth
            value={email}
            onChange={handleInputChange}
            name="email"
            error={!!validationErrors.email}
            helperText={validationErrors.email}
          />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Vehicle Details
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
          <TextField
            label="Vehicle Registration Number"
            variant="outlined"
            fullWidth
            value={vehicleNumber}
            onChange={handleInputChange}
            name="vehicleNumber"
            error={!!validationErrors.vehicleNumber}
            helperText={validationErrors.vehicleNumber}
          />
          <FormControl fullWidth error={!!validationErrors.vehicleType}>
            <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
            <Select
              labelId="vehicle-type-label"
              value={vehicleType}
              label="Vehicle Type"
              onChange={handleInputChange}
              name="vehicleType"
            >
              <MenuItem value="">-- Select any vehicle type --</MenuItem>
              <MenuItem value="Lorry">Lorry</MenuItem>
              <MenuItem value="Van">Van</MenuItem>
              <MenuItem value="Three Wheeler">Three Wheeler</MenuItem>
            </Select>
            {validationErrors.vehicleType && (
              <Typography variant="caption" color="error">
                {validationErrors.vehicleType}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth error={!!validationErrors.vehicleType}>
            <InputLabel id="fuel-type-label">Fuel Type</InputLabel>
            <Select
              labelId="fuel-type-label"
              value={fuelType}
              label="Fuel Type"
              onChange={handleInputChange}
              name="fuelType"
            >
              <MenuItem value="">-- Select fuel type --</MenuItem>
              <MenuItem value="Diesel">Diesel</MenuItem>
              <MenuItem value="Petrol">Petrol</MenuItem>
              <MenuItem value="EV">EV</MenuItem>
            </Select>
            {validationErrors.vehicleType && (
              <Typography variant="caption" color="error">
                {validationErrors.vehicleType}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth error={!!validationErrors.vehicleBrand}>
            <Autocomplete
              freeSolo
              options={vehicleBrandOptions}
              value={vehicleBrand}
              onChange={(event, newValue) => {
                setVehicleBrand(newValue || "");
                setValidationErrors((prevErrors) => ({ ...prevErrors, vehicleBrand: "" }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vehicle Brand"
                  variant="outlined"
                  name="vehicleBrand"
                  onChange={handleInputChange}
                  error={!!validationErrors.vehicleBrand}
                  helperText={validationErrors.vehicleBrand}
                />
              )}
            />
          </FormControl>

          <TextField
            label="Load Capacity"
            variant="outlined"
            type="number"
            fullWidth
            value={loadCapacity}
            onChange={handleInputChange}
            name="loadCapacity"
            error={!!validationErrors.loadCapacity}
            helperText={validationErrors.loadCapacity}
          />
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Assign Driver to the Vehicle
        </Typography>
        <Box mt={2}>
          <FormControl fullWidth error={!!validationErrors.selectedDriver}>
            <Autocomplete
              options={drivers}
              getOptionLabel={(option) => option.fullName || ""}
              value={selectedDriver}
              onChange={handleDriverChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Driver"
                  variant="outlined"
                  error={!!validationErrors.selectedDriver}
                  helperText={validationErrors.selectedDriver}
                />
              )}
            />
          </FormControl>
        </Box>
      </Paper>

      <Box mt={4} sx={{ display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          Register Vehicle
        </Button>
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}

export default VehicleRegistrationForm;