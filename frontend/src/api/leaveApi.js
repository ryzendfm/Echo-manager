import api from "./axiosInstance";

export const leaveApi = {
    apply: (data) => api.post("/leaves", data),
    getMyLeaves: (params) => api.get("/leaves/me", { params }),
    getMyBalance: () => api.get("/leaves/me/balance"),
    getAll: (params) => api.get("/leaves", { params }),
    getPending: () => api.get("/leaves/pending"),
    approve: (id, data) => api.patch(`/leaves/${id}/approve`, data),
    reject: (id, data) => api.patch(`/leaves/${id}/reject`, data),
    cancel: (id) => api.patch(`/leaves/${id}/cancel`),
};
