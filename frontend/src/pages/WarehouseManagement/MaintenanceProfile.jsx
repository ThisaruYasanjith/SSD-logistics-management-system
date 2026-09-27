import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Stack,
  Paper,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const priorityOptions = ["Low", "Medium", "High"];

import api, { errorMessage } from "../../utils/apiClient";
export default function MaintenanceFormTwo() {
  const [editMode, setEditMode] = useState(false);
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    requestId: "",
    warehouseId: "",
    issueDescription: "",
    priority: "",
    scheduledDate: "",
    completionDate: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch existing maintenance data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/maintenance/${requestId}`);
        const data = res.data;

        const formatDate = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        setFormData({
          requestId: data.requestId || "",
          warehouseId: data.warehouseId || "",
          issueDescription: data.issueDescription || "",
          priority: data.priority || "",
          scheduledDate: formatDate(data.scheduledDate),
          completionDate: formatDate(data.completionDate),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load maintenance data.");
        toast.error("Failed to load maintenance data.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.warehouseId) errors.warehouseId = "Warehouse ID is required.";
    if (!formData.issueDescription) errors.issueDescription = "Issue description is required.";
    if (!formData.priority) errors.priority = "Priority is required.";
    if (!formData.scheduledDate) errors.scheduledDate = "Scheduled date is required.";
    if (!formData.completionDate) errors.completionDate = "Completion date is required.";
    return errors;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await api.put(`/maintenance/${requestId}`, formData);
      toast.success("Maintenance request updated successfully!");
      navigate("/warehouse/Maintainance");
    } catch (error) {
      setError(errorMessage(error, "Failed to update request."));
      toast.error("Failed to update request.");
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await api.delete(`/maintenance/${requestId}`);
      toast.success("Maintenance request deleted.");
      setDeleteDialogOpen(false);
      navigate("/warehouse/Maintainance");
    } catch (error) {
      setError(errorMessage(error, "Failed to delete request."));
      toast.error("Failed to delete request.");
      console.error("Delete failed:", error);
      setDeleteDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({
      requestId: formData.requestId,
      warehouseId: formData.warehouseId,
      issueDescription: formData.issueDescription,
      priority: formData.priority,
      scheduledDate: formData.scheduledDate,
      completionDate: formData.completionDate,
    });
    setValidationErrors({});
    setEditMode(false);
    toast.info("Changes discarded.");
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
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="error">{error}</Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/warehouse/Maintainance")}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: "auto", mt: 5 }}>
      <Typography variant="h5" gutterBottom>
        Edit Maintenance Request
      </Typography>
      <form onSubmit={handleUpdate}>
        <Stack spacing={2}>
          <TextField
            label="Request ID"
            name="requestId"
            value={formData.requestId}
            InputProps={{ readOnly: true }}
            fullWidth
          />
          <TextField
            label="Warehouse ID"
            name="warehouseId"
            value={formData.warehouseId}
            onChange={handleChange}
            fullWidth
            required
            disabled={!editMode}
            error={!!validationErrors.warehouseId}
            helperText={validationErrors.warehouseId}
          />
          <TextField
            label="Issue Description"
            name="issueDescription"
            value={formData.issueDescription}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            required
            disabled={!editMode}
            error={!!validationErrors.issueDescription}
            helperText={validationErrors.issueDescription}
          />
          <TextField
            select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            fullWidth
            required
            disabled={!editMode}
            error={!!validationErrors.priority}
            helperText={validationErrors.priority}
          >
            {priorityOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Scheduled Date"
            name="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={!editMode}
            required
            error={!!validationErrors.scheduledDate}
            helperText={validationErrors.scheduledDate}
          />
          <TextField
            label="Completion Date"
            name="completionDate"
            type="date"
            value={formData.completionDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            disabled={!editMode}
            required
            error={!!validationErrors.completionDate}
            helperText={validationErrors.completionDate}
          />

          <Stack direction="row" spacing={2}>
            {!editMode ? (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleEdit}
                  disabled={loading}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#ab47bc" }}
                  type="submit"
                  disabled={loading}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </form>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this maintenance request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}