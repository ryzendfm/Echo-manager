import api from "./axiosInstance";

export const notificationApi = {
    getAll: (params) => api.get("/notifications", { params }),
    getUnreadCount: () => api.get("/notifications/unread-count"),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch("/notifications/read-all"),
    send: (data) => api.post("/notifications/send", data),
    delete: (id) => api.delete(`/notifications/${id}`),
};
