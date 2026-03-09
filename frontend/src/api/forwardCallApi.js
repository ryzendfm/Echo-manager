import api from "./axiosInstance";

export const forwardCallApi = {
    getAll: (params) => api.get("/forward-calls", { params }),
    getMyForwardCalls: (params) => api.get("/forward-calls/me", { params }),
    getById: (id) => api.get(`/forward-calls/${id}`),
    create: (data) => api.post("/forward-calls", data),
    update: (id, data) => api.put(`/forward-calls/${id}`, data),
    updateStatus: (id, data) => api.patch(`/forward-calls/${id}/status`, data),
    markAttendance: (id, data) => api.patch(`/forward-calls/${id}/attendance`, data),
    delete: (id) => api.delete(`/forward-calls/${id}`),
};
