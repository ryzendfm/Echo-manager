import api from "./axiosInstance";

export const authApi = {
    login: (data) => api.post("/auth/login", data),
    getMe: () => api.get("/auth/me"),
    forgotPassword: (data) => api.post("/auth/forgot-password", data),
    verifyOTP: (data) => api.post("/auth/verify-otp", data),
    resetPassword: (data) => api.post("/auth/reset-password", data),
    changePassword: (data) => api.put("/auth/change-password", data),
    setPassword: (data) => api.post("/auth/set-password", data),
};
