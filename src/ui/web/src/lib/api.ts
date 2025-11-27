import ky from "ky";

const api = ky.create({
    prefixUrl: "http://localhost:3000/api",
    credentials: 'include',
    hooks: {
        beforeRequest: [
            (request) => {
                // You can add auth headers here if needed,
                // but we are using httpOnly cookies so the browser handles it automatically.
            },
        ],
    },
});

export const authApi = {
    login: (json: any) => api.post("auth/login", { json }).json(),
    logout: () => api.post("auth/logout").json(),
    register: (json: any) => api.post("users", { json }).json(),
    me: () => api.get("users/me").json(),
};

export const childrenApi = {
    getAll: () => api.get("children").json(),
    getById: (id: number) => api.get(`children/${id}`).json(),
    create: (json: any) => api.post("children", { json }).json(),
    update: (id: number, json: any) => api.patch(`children/${id}`, { json }).json(),
    delete: (id: number) => api.delete(`children/${id}`).json(),
};

export const logsApi = {
    createGrowth: (json: any) => api.post("logs/growth", { json }).json(),
    getGrowth: (childId: number) => api.get(`logs/growth/${childId}`).json(),

    createSymptom: (json: any) => api.post("logs/symptom", { json }).json(),
    getSymptom: (childId: number) => api.get(`logs/symptom/${childId}`).json(),

    createEmotion: (json: any) => api.post("logs/emotion", { json }).json(),
    getEmotion: (childId: number) => api.get(`logs/emotion/${childId}`).json(),
};

export const aiApi = {
    detectFood: (image: string) => api.post("ai/detect-food", { json: { image } }).json(),
    getAdvice: (data: { note: string; emotion: string; severity: string; time: string }) =>
        api.post("ai/gemini-advice", { json: data }).json(),
};