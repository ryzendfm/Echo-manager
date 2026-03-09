import api from "./axiosInstance";

export const invoiceApi = {
    getAll: (params) => api.get("/invoices", { params }),
    getMyInvoices: (params) => api.get("/invoices/me", { params }),
    getById: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post("/invoices", data),
    update: (id, data) => api.put(`/invoices/${id}`, data),
    delete: (id) => api.delete(`/invoices/${id}`),
    updateStatus: (id, status) =>
        api.patch(`/invoices/${id}/status`, { status }),
    send: (id) => api.post(`/invoices/${id}/send`),
    downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: "blob" }),
};
