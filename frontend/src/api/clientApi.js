import api from "./axiosInstance";

export const clientApi = {
    getAll: (params) => api.get("/clients", { params }),
    getById: (id) => api.get(`/clients/${id}`),
    create: (data) => api.post("/clients", data),
    update: (id, data) => api.put(`/clients/${id}`, data),
    deactivate: (id) => api.patch(`/clients/${id}/deactivate`),
    getProjects: (id) => api.get(`/clients/${id}/projects`),
    getInvoices: (id) => api.get(`/clients/${id}/invoices`),
};
