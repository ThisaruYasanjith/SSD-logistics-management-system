import React, { useState, useEffect } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

const StyledTableHead = styled(TableHead)(() => ({
    backgroundColor: '#f0f0f0',
}));

const StyledTableCellHead = styled(TableCell)(() => ({
    color: '#333333',
    fontWeight: 'bold',
    fontSize: 15,
}));

const StyledTableRow = styled(TableRow)(() => ({
    '&:hover': {
        backgroundColor: '#f5f5f5',
        cursor: 'pointer',
    },
}));

const DeliveryManagementEmployee = () => {
    const [deliveryData, setDeliveryData] = useState([]);
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("You must be logged in to view this page");
                navigate("/login", { replace: true });
                setIsLoading(false);
                return;
            }

            try {
                const decoded = jwtDecode(token);
                if (!decoded.fullName) {
                    throw new Error("Full name not found in token");
                }
                if (!decoded.id) {
                    throw new Error("User ID not found in token");
                }
                setFullName(decoded.fullName);
                setUserId(decoded.id);
            } catch (err) {
                console.error("Error decoding token:", err);
                setError("Invalid token");
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                navigate("/login", { replace: true });
            } finally {
                setIsLoading(false);
            }
        };

        const fetchDeliveryData = async () => {
            try {
                const token = localStorage.getItem("token");

                // Delivery request - V01 JWT Authentication Bypass Fix - Sithum
                const response = await axios.get('http://localhost:8000/api/Delivery', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setDeliveryData(response.data);
            } catch (error) {
                console.error('Error fetching delivery data:', error);
            }
        };

        fetchUserData();
        fetchDeliveryData();
    }, [navigate]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return '#f57c00';
            case 'In Transit':
                return '#0288d1';
            case 'Done':
                return '#2e7d32';
            default:
                return '#616161';
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <Typography variant="h6">Loading...</Typography>
        </Box>;
    }

    if (error) {
        return <Box sx={{ padding: 4, backgroundColor: '#ffffff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Typography color="error" variant="h6" gutterBottom>{error}</Typography>
            {error === "Invalid token" && <Button onClick={() => navigate('/login')}>Go to Login</Button>}
        </Box>;
    }

    const filteredDeliveryData = deliveryData.filter(row => row.driverName === fullName);

    return (
        <Box sx={{ padding: 4, backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <Typography variant="h5" gutterBottom sx={{ color: '#2E2E2E', fontWeight: 'bold', mb: 2 }}>
                Your Deliveries
            </Typography>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Table>
                    <StyledTableHead>
                        <TableRow>
                            <StyledTableCellHead>Delivery ID</StyledTableCellHead>
                            <StyledTableCellHead>Package</StyledTableCellHead>
                            <StyledTableCellHead>Pickup</StyledTableCellHead>
                            <StyledTableCellHead>Destination</StyledTableCellHead>
                            <StyledTableCellHead>Date</StyledTableCellHead>
                            <StyledTableCellHead>Status</StyledTableCellHead>
                        </TableRow>
                    </StyledTableHead>

                    <TableBody>
                        {filteredDeliveryData.length > 0 ? (
                            filteredDeliveryData.map((row) => (
                                <StyledTableRow key={row.deliveryScheduleId} onClick={() => navigate(`DeliveryProfile/${row.deliveryScheduleId}`)}>
                                    <TableCell>{row.deliveryScheduleId}</TableCell>
                                    <TableCell>{row.packageType}</TableCell>
                                    <TableCell>{row.pickupLocation}</TableCell>
                                    <TableCell>{row.dropoffLocation}</TableCell>
                                    <TableCell>{row.deliveryDate}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ color: getStatusColor(row.status), fontWeight: 500 }}>
                                            {row.status}
                                        </Typography>
                                    </TableCell>
                                </StyledTableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="subtitle1" color="textSecondary">
                                        No deliveries assigned to you.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default DeliveryManagementEmployee;