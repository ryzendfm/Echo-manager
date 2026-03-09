import api from "./axiosInstance";

export const userApi = {
    getAll: (params) => api.get("/users", { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post("/users", data),
    update: (id, data) => api.put(`/users/${id}`, data),
    updateStatus: (id, isActive) =>
        api.patch(`/users/${id}/status`, { isActive }),
    resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }),
    delete: (id) => api.delete(`/users/${id}`),
    getActivityLogs: (params) => api.get("/activity-logs", { params }),
};
