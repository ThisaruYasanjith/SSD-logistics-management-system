import React, { useState, useEffect } from "react";
import { Button, Box, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Chart.js registration
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import api, { errorMessage } from "../../utils/apiClient";
// Styled components
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

export default function VehicleFleetManagement() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [maintenanceDetails, setMaintenanceDetails] = useState([]);
  const [error, setError] = useState("");

  // Fetch vehicles and maintenance details
  useEffect(() => {
    api
      .get("/vehicles")
      .then((response) => {
        setVehicles(response.data);
      })
      .catch((error) => {
        console.error("Error fetching vehicles:", error);
        setError(errorMessage(error, "Failed to fetch vehicles"));
        toast.error("Failed to fetch vehicles");
      });

    api
      .get("/maintenance")
      .then((response) => {
        setMaintenanceDetails(response.data);
      })
      .catch((error) => {
        console.error("Error fetching maintenance details:", error);
        setError(errorMessage(error, "Failed to fetch maintenance details"));
        toast.error("Failed to fetch maintenance details");
      });
  }, []);

  // Process maintenance data for graph
  const maintenanceCostByType = React.useMemo(() => {
    const costs = {};
    maintenanceDetails.forEach((maintenance) => {
      const { Type, Cost } = maintenance;
      costs[Type] = (costs[Type] || 0) + Cost;
    });
    return costs;
  }, [maintenanceDetails]);

  const chartData = React.useMemo(
    () => ({
      labels: Object.keys(maintenanceCostByType),
      datasets: [
        {
          label: "Total Cost",
          data: Object.values(maintenanceCostByType),
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          barThickness: 30,
          maxBarThickness: 40,
        },
      ],
    }),
    [maintenanceCostByType]
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Total Maintenance Cost by Type",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Cost",
        },
      },
      x: {
        title: {
          display: true,
          text: "Maintenance Type",
        },
      },
    },
  };

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Typography color="error" sx={{ mt: 2, mb: 2, textAlign: "center" }}>
          {error}
        </Typography>
      )}

      {/* Registered Vehicles Section */}
      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: "#2E2E2E", fontWeight: "bold", mb: 2 }}
        >
          Registered Vehicles
        </Typography>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
        >
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <StyledTableHead>
              <TableRow>
                <StyledTableCell>Vehicle Registration Number</StyledTableCell>
                <StyledTableCell align="right">Vehicle Type</StyledTableCell>
                <StyledTableCell align="right">Vehicle Brand</StyledTableCell>
                <StyledTableCell align="right">Owner's Name</StyledTableCell>
                <StyledTableCell align="right">Driver's Name</StyledTableCell>
              </TableRow>
            </StyledTableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
                <StyledTableRow
                  key={vehicle.VehicleNumber}
                  onClick={() => navigate(`/vehicle/VehicleProfile/${vehicle.VehicleNumber}`)}
                >
                  <TableCell component="th" scope="row">
                    {vehicle.VehicleNumber}
                  </TableCell>
                  <TableCell align="right">{vehicle.VehicleType}</TableCell>
                  <TableCell align="right">{vehicle.VehicleBrand}</TableCell>
                  <TableCell align="right">{vehicle.OwnersName}</TableCell>
                  <TableCell align="right">{vehicle.DriverID}</TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3, textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate("vehicleRegistration")}
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
            + New Vehicle Registration
          </Button>
        </Box>
      </Paper>

      {/* Maintenance Cost Analysis Section */}
      <Paper elevation={3} sx={{ p: 4, margin: "auto", mt: 5, borderRadius: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: "#2E2E2E", fontWeight: "bold", mb: 2 }}
        >
          Maintenance Cost Analysis
        </Typography>
        <Bar data={chartData} options={chartOptions} />
      </Paper>
    </Box>
  );
}