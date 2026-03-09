import api from "./axiosInstance";

export const employeeApi = {
    getAll: (params) => api.get("/employees", { params }),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post("/employees", data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    deactivate: (id) => api.patch(`/employees/${id}/deactivate`),
    getProjects: (id) => api.get(`/employees/${id}/projects`),
    assignProjects: (id, project_ids) => api.post(`/employees/${id}/projects`, { project_ids }),
    getMyProjects: () => api.get("/employees/me/projects"),
};

