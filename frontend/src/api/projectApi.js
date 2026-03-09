import api from "./axiosInstance";

export const projectApi = {
    getAll: (params) => api.get("/projects", { params }),
    getMyProjects: () => api.get("/projects/me"),
    getAllTeams: () => api.get("/projects/teams"),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => {
        if (data instanceof FormData) {
            return api.post("/projects", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }
        return api.post("/projects", data);
    },
    update: (id, data) => {
        if (data instanceof FormData) {
            return api.put(`/projects/${id}`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        }
        return api.put(`/projects/${id}`, data);
    },
    delete: (id) => api.delete(`/projects/${id}`),
    getProjectEmployees: (id) => api.get(`/projects/${id}/employees`),
    assignProjectEmployees: (id, employee_ids) => api.post(`/projects/${id}/employees`, { employee_ids }),
    updateStatus: (id, status) =>
        api.patch(`/projects/${id}/status`, { status }),

    // Team
    addTeamMember: (id, data) => api.post(`/projects/${id}/team`, data),
    removeTeamMember: (id, employeeId) =>
        api.delete(`/projects/${id}/team/${employeeId}`),

    // Milestones
    addMilestone: (id, data) => api.post(`/projects/${id}/milestones`, data),
    updateMilestone: (id, milestoneId, data) =>
        api.put(`/projects/${id}/milestones/${milestoneId}`, data),
    deleteMilestone: (id, milestoneId) =>
        api.delete(`/projects/${id}/milestones/${milestoneId}`),

    // Documents
    uploadDocument: (id, formData) =>
        api.post(`/projects/${id}/documents`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
    deleteDocument: (id, docId) =>
        api.delete(`/projects/${id}/documents/${docId}`),
};
