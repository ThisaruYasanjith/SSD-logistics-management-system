import axios from "axios";

/**
 * Single shared API client for the whole app.
 *
 * The base URL comes from VITE_API_BASE_URL so the same build can be promoted
 * between environments without editing source. The session token is sent as an
 * Authorization header for backwards compatibility; the server also accepts an
 * httpOnly cookie, which is the preferred transport.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Session invalid or missing: clear local state and send the user to login.
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (status === 403) {
      // Authenticated but not permitted. Do not drop the session.
      if (!window.location.pathname.startsWith("/unauthorized")) {
        window.location.href = "/unauthorized";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

export default api;
