import api from "./api";

export const loginService = async (phone, password) => {
    const res = await api.post("/auth/login", {phone, password});

    if (res.data.token && res.data.refreshToken) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(res.data));
        return res.data;
    }
};

export const registerService = async ({ name, phone, password }) => {
    const res = await api.post("/auth/register", { name, phone, password });

    if (res.data.token && res.data.refreshToken) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(res.data));
        return res.data;
    }
};

export const logoutService = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
        await api.post("/auth/logout", { refreshToken });
    } catch {
        // ignore logout API errors
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
};
