// validation.js
//
// NOTE: these checks are UX affordances only. The authoritative validation is
// `backend/src/middleware/validation.ts`, which enforces the same rules on the
// server. Keep the two in sync.

const NIC_PATTERN = /^[0-9]{12,14}[vV]?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const CONTACT_PATTERN = /^[0-9]{10}$/;

export const validateNIC = (nic) => {
  if (!NIC_PATTERN.test(nic || "")) {
    return "NIC must be 12-14 digits with an optional trailing 'v'.";
  }
  return null;
};

export const validateName = (name) => {
  if (!name || name.length < 3 || name.length > 100) {
    return "Owner's name must be between 3 and 100 characters.";
  }
  return null;
};

export const validateContactNumber = (contactNumber) => {
  if (!CONTACT_PATTERN.test(contactNumber || "")) {
    return "Contact number must be exactly 10 digits.";
  }
  return null;
};

export const validateAddress = (address) => {
  if (!address || address.length < 5 || address.length > 255) {
    return "Address must be between 5 and 255 characters.";
  }
  return null;
};

export const validateEmail = (email) => {
  if (!EMAIL_PATTERN.test(email || "")) {
    return "Please enter a valid email address.";
  }
  return null;
};

export const validateVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber || vehicleNumber.length < 4) {
    return "Vehicle number must be at least 4 characters.";
  }
  if (vehicleNumber.length > 20) {
    return "Vehicle number must be 20 characters or fewer.";
  }
  return null;
};

export const validateVehicleTypeAndFuelType = (vehicleType, fuelType) => {
  if (!vehicleType || !fuelType) {
    return "Please select both vehicle type and fuel type.";
  }
  return null;
};

export const validateVehicleBrand = (vehicleBrand) => {
  if (!vehicleBrand || vehicleBrand.length < 1 || vehicleBrand.length > 50) {
    return "Vehicle brand must be 1-50 characters.";
  }
  return null;
};

export const validateLoadCapacity = (loadCapacity) => {
  const value = Number(loadCapacity);
  if (loadCapacity === "" || loadCapacity === null || loadCapacity === undefined) {
    return "Load capacity is required.";
  }
  if (!Number.isFinite(value) || value < 0) {
    return "Load capacity must be a non-negative number.";
  }
  return null;
};

export const validateDriverSelection = (selectedDriver) => {
  if (!selectedDriver || selectedDriver === "") {
    return "Please assign a driver to the vehicle.";
  }
  return null;
};
