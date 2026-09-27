import React from "react";
import { Navigate } from "react-router-dom";

/**
 * UX-only route guard.
 *
 * SECURITY: this reads the role from localStorage, which the user can edit, so
 * it is NOT an access-control boundary. It only avoids rendering screens the
 * user is unlikely to be able to use. The real enforcement is the server-side
 * `authenticateToken` + `authorizeRole` middleware on every API route.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !role) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

export default ProtectedRoute;
