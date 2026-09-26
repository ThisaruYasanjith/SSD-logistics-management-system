import * as React from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";

import api, { errorMessage } from "../../utils/apiClient";
export default function WarehouseManagement() {
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchWarehouses = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/warehouse");
        setWarehouse(response.data);
      } catch (error) {
        setError(errorMessage(error, "Error fetching warehouses."));
        toast.error("Error fetching warehouses.");
        console.error("Error fetching warehouse:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          sx={{ bgcolor: "#ab47bc" }}
          onClick={() => navigate("Maintainance")}
        >
          Maintenance
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 2 }}>
        <Card
          variant="outlined"
          sx={{
            maxWidth: 360,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#ffffff",
            border: "2px solid #CCCCCC",
            cursor: "pointer",
            "&:hover": { boxShadow: 6 },
          }}
          onClick={() => navigate("Addwarehouse")}
        >
          <Tooltip title="Add Warehouse">
            <Fab
              color="primary"
              aria-label="add"
              sx={{ backgroundColor: "white", color: "black" }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Card>

        {warehouse.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ gridColumn: "span 2", textAlign: "center" }}>
            No warehouses available.
          </Typography>
        ) : (
          warehouse.map((w) => (
            <Card
              key={w.WarehouseID}
              variant="outlined"
              onClick={() => navigate(`WarehouseDetails/${w.WarehouseID}`)}
              sx={{
                maxWidth: 360,
                cursor: "pointer",
                "&:hover": { boxShadow: 6, backgroundColor: "#f5f5f5" },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography gutterBottom variant="h5" component="div">
                  {w.WarehouseID}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Description: {w.Description}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  City: {w.City}
                </Typography>
              </Box>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );
}