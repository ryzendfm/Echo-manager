import axios from "axios";
import tokenService from "@/services/token-service";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:5000`;

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || `${BACKEND_URL}/api/v1`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach token
api.interceptors.request.use(
    (config) => {
        const token = tokenService.getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip interceptor for login requests so it doesn't trigger a page reload
            if (originalRequest.url?.includes('/login')) {
                return Promise.reject(error);
            }
            originalRequest._retry = true;

            try {
                const refreshToken = tokenService.getRefreshToken();
                const res = await axios.post(
                    `${api.defaults.baseURL}/auth/refresh-token`,
                    { refreshToken }
                );

                const { accessToken } = res.data;
                tokenService.setAccessToken(accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch {
                tokenService.clearTokens();
                window.location.href = "/login";
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
