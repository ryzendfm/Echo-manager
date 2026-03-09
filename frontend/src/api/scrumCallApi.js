import api from "./axiosInstance";

export const scrumCallApi = {
    getAll: (params) => api.get("/scrum-calls", { params }),
    getMyScrumCalls: (params) => api.get("/scrum-calls/me", { params }),
    getById: (id) => api.get(`/scrum-calls/${id}`),
    create: (data) => api.post("/scrum-calls", data),
    update: (id, data) => api.put(`/scrum-calls/${id}`, data),
    updateStatus: (id, data) => api.patch(`/scrum-calls/${id}/status`, data),
    markAttendance: (id, data) => api.patch(`/scrum-calls/${id}/attendance`, data),
    updateNotes: (id, data) => api.patch(`/scrum-calls/${id}/notes`, data),
    delete: (id) => api.delete(`/scrum-calls/${id}`),
};
