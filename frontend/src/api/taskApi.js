import api from "./axiosInstance";

export const taskApi = {
    getAll: (params) => api.get("/tasks", { params }),
    getByProject: (projectId, params) =>
        api.get(`/projects/${projectId}/tasks`, { params }),
    getMyTasks: (params) => api.get("/tasks/me", { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post("/tasks", data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
    delete: (id) => api.delete(`/tasks/${id}`),
    addComment: (id, data) => api.post(`/tasks/${id}/comments`, data),
    logHours: (id, data) => api.post(`/tasks/${id}/log-hours`, data),
    assignBulk: (data) => api.post("/tasks/assign-bulk", data),
    getByEmployee: (employeeId) => api.get(`/tasks/by-employee/${employeeId}`),
    getCommonProjects: (employeeIds) =>
        api.get("/tasks/common-projects", { params: { employee_ids: employeeIds.join(",") } }),
};

