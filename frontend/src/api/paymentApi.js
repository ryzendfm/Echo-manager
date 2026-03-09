import api from "./axiosInstance";

export const paymentApi = {
    getAll: (params) => api.get("/payments", { params }),
    getByInvoice: (invoiceId) => api.get(`/invoices/${invoiceId}/payments`),
    record: (data) => api.post("/payments", data),
    update: (id, data) => api.put(`/payments/${id}`, data),
};
