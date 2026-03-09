import api from "./axiosInstance";

export const transactionApi = {
    getAll: (params) => api.get("/transactions", { params }),
    create: (data) => api.post("/transactions", data),
    update: (id, data) => api.put(`/transactions/${id}`, data),
    delete: (id) => api.delete(`/transactions/${id}`),
    getOverview: (params) => api.get("/transactions/overview", { params }),
    getReports: (params) => api.get("/transactions/reports", { params }),
};
