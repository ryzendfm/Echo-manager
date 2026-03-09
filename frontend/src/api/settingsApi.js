import api from "./axiosInstance";

export const settingsApi = {
    get: () => api.get("/settings"),
    update: (data) => api.put("/settings", data),
    uploadLogo: (formData) =>
        api.post("/settings/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        }),
};
