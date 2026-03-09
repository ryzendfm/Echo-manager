import api from "./axiosInstance";

export const profitSharingApi = {
    getOverview: () => api.get("/profit-sharing"),
    updateSettings: (data) => api.put("/profit-sharing/settings", data),
    getAdmins: () => api.get("/profit-sharing/admins"),
    addAdmin: (data) => api.post("/profit-sharing/admins", data),
    updateAdmin: (id, data) => api.put(`/profit-sharing/admins/${id}`, data),
    updateAdminsBulk: (admins) => api.put("/profit-sharing/admins/bulk", { admins }),
    removeAdmin: (id) => api.delete(`/profit-sharing/admins/${id}`),
};
