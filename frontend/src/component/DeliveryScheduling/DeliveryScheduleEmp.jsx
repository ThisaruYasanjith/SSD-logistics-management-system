import React, { useState, useEffect } from "react";
import {
    TextField,
    Grid,
    Typography,
    FormControl,
    Select,
    MenuItem,
    InputLabel,
    CircularProgress,
} from "@mui/material";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import axios from "axios";
import { useParams } from "react-router-dom";

const DeliveryScheduleUpdate = () => {
    const { ScheduleID } = useParams();
    const [formData, setFormData] = useState({
        pickupLocation: "",
        dropoffLocation: "",
        pickupDate: "",
        deliveryDate: "",
        packageType: "",
        quantity: "",
        vehicle: "",
        driverName: "",
        driverUsername: "",
        specialInstructions: "",
        pickupLatitude: 0,
        pickupLongitude: 0,
        dropoffLatitude: 0,
        dropoffLongitude: 0,
        status: "",
    });

    const [loading, setLoading] = useState(false); // For loading state
    const [error, setError] = useState(""); // For error handling

    // Fetch existing data on component mount
    useEffect(() => {
        setLoading(true);
        axios
            // Delivery details request - V01 JWT Authentication Bypass Fix - Sithum
            .get(`http://localhost:8000/api/Delivery/${ScheduleID}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })
            .then((response) => {
                setFormData(response.data);
                setLoading(false);
            })
            .catch((error) => {
                setError("Error fetching data");
                setLoading(false);
                alert("Error fetching data");
            });
    }, [ScheduleID]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Only allow changes to the status field
        if (name === "status") {
            setFormData((prevData) => ({ ...prevData, [name]: value }));
            axios
                // Delivery status update - V01 JWT Authentication Bypass Fix - Sithum
                .put(
                    `http://localhost:8000/api/Delivery/${ScheduleID}`,
                    { status: value },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                )
                .then(() => {
                    alert("Status updated successfully");
                })
                .catch((error) => {
                    setError("Error updating status");
                    alert("Error updating status");
                });
        }
    };

    const formattedDeliveryDate = formData.deliveryDate
        ? new Date(formData.deliveryDate).toISOString().slice(0, 16)
        : "";

    return (
        <form style={{ padding: 20 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: "#333", mb: 4 }}>
                Delivery Schedule
            </Typography>

            {loading && (
                <Grid container justifyContent="center">
                    <CircularProgress />
                </Grid>
            )}

            {error && alert(error)}

            <Grid container spacing={2}>
                {/* Pickup Location */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Pickup Location"
                        name="pickupLocation"
                        fullWidth
                        value={formData.pickupLocation}
                        disabled
                        multiline
                        rows={2}
                    />
                </Grid>

                {/* Drop-off Location */}
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Drop-off Location"
                        name="dropoffLocation"
                        fullWidth
                        value={formData.dropoffLocation}
                        disabled
                        multiline
                        rows={2}
                    />
                </Grid>

                {/* Google Map for Pickup and Dropoff Locations */}
                <Grid item xs={12} sm={6} style={{ height: "400px" }}>
                    <LoadScript googleMapsApiKey="AIzaSyD_lhBUF7rZ651jBwwIn6ZTmnxD5_1zd1A">
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }}
                            center={{ lat: formData.pickupLatitude, lng: formData.pickupLongitude }}
                            zoom={14}
                        >
                            <Marker position={{ lat: formData.pickupLatitude, lng: formData.pickupLongitude }} />
                        </GoogleMap>
                    </LoadScript>
                </Grid>

                <Grid item xs={12} sm={6} style={{ height: "400px" }}>
                    <LoadScript googleMapsApiKey="AIzaSyD_lhBUF7rZ651jBwwIn6ZTmnxD5_1zd1A">
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }}
                            center={{ lat: formData.dropoffLatitude, lng: formData.dropoffLongitude }}
                            zoom={14}
                        >
                            <Marker position={{ lat: formData.dropoffLatitude, lng: formData.dropoffLongitude }} />
                        </GoogleMap>
                    </LoadScript>
                </Grid>

                {/* Delivery Date and Time */}
                <Grid item xs={12}>
                    <TextField
                        label="Expected Delivery Date & Time"
                        type="datetime-local"
                        name="deliveryDate"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formattedDeliveryDate}
                        disabled
                        inputProps={{
                            min: new Date().toISOString().slice(0, 16), // Set min value to the current date and time
                        }}
                    />
                </Grid>

                {/* Package Type */}
                <Grid item xs={12}>
                    <TextField
                        label="Package Type"
                        name="packageType"
                        fullWidth
                        value={formData.packageType}
                        disabled
                    />
                </Grid>

                {/* Quantity */}
                <Grid item xs={12}>
                    <TextField
                        label="Quantity"
                        type="number"
                        name="quantity"
                        fullWidth
                        value={formData.quantity}
                        disabled
                    />
                </Grid>

                {/* Driver */}
                <Grid item xs={12}>
                    <TextField
                        label="Driver"
                        name="driverName"
                        fullWidth
                        value={formData.driverName}
                        disabled
                    />
                </Grid>

                {/* Status */}
                <Grid item xs={12}>
                    <FormControl fullWidth sx={{ borderRadius: "4px" }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            name="status"
                            label="Status"
                            value={formData.status || ""}
                            onChange={handleChange}
                            displayEmpty
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="In Transit">In Transit</MenuItem>
                            <MenuItem value="Delivered">Delivered</MenuItem>
                            <MenuItem value="Cancel">Canceled</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </form>
    );
};

export default DeliveryScheduleUpdate;