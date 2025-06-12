import api from "./api";

export const loginService = async (phone, password) => {
    const res = await api.post("/auth/login", {phone, password});

    if (res.data.token && res.data.refreshToken) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        return res.data;
    }
};

export const logoutService = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const res = await api.post("/auth/logout", { refreshToken });

    if (res.data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        return res.data;
    }
};
