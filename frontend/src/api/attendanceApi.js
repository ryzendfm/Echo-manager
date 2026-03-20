import api from "./axiosInstance";

export const attendanceApi = {
    checkIn: (data) => api.post("/attendance/check-in", data),
    checkOut: (data) => api.post("/attendance/check-out", data),
    getMyAttendance: (params) => api.get("/attendance/me", { params }),
    getToday: () => api.get("/attendance/me/today"),
    getAll: (params) => api.get("/attendance", { params }),
    correct: (id, data) => api.patch(`/attendance/${id}/correct`, data),
    getMonthlyReport: (params) =>
        api.get("/attendance/report/monthly", { params }),
    getByDate: (date) => api.get("/attendance/by-date", { params: { date } }),
    getMonthlyOverview: (params) =>
        api.get("/attendance/monthly-overview", { params }),
    getByEmployee: (employeeId, params) =>
        api.get(`/attendance/by-employee/${employeeId}`, { params }),
};
