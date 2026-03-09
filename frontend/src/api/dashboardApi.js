import api from "./axiosInstance";

export const dashboardApi = {
    getAdminStats: () => api.get("/dashboard/admin"),
    getEmployeeStats: () => api.get("/dashboard/employee"),
    getClientStats: () => api.get("/dashboard/client"),
    getRevenueChart: (params) => api.get("/dashboard/revenue-chart", { params }),
    getProjectStatusChart: () => api.get("/dashboard/project-status"),
    getRecentActivity: () => api.get("/dashboard/recent-activity"),
    getUpcomingDeadlines: () => api.get("/dashboard/upcoming-deadlines"),
    getEmployeeCharts: () => api.get("/dashboard/employee/charts"),
    getClientCharts: () => api.get("/dashboard/client/charts"),
};
