import api from "./axiosInstance";

export const projectPhaseApi = {
    getPhases: (projectId) => api.get(`/project-phases/project/${projectId}`),
    savePhases: (projectId, phases) => api.post(`/project-phases/project/${projectId}`, { phases }),
    recordPayment: (phaseId, data) => api.post(`/project-phases/${phaseId}/payments`, data),
    updatePhase: (phaseId, data) => api.put(`/project-phases/${phaseId}`, data),
    deletePhase: (phaseId) => api.delete(`/project-phases/${phaseId}`),
    updatePayment: (phaseId, paymentId, data) => api.put(`/project-phases/${phaseId}/payments/${paymentId}`, data),
    resetPhasePayments: (phaseId) => api.delete(`/project-phases/${phaseId}/payments`),
    getProjectFinancials: (projectId) => api.get(`/project-phases/project/${projectId}/financials`),
    getAllFinancials: () => api.get(`/project-phases/all-financials`),
};
