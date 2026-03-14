import { createContext, useContext, useState } from "react";
import { loginService, registerService, logoutService } from "../services/authService";

const AuthContext = createContext();

const getStoredUser = () => {
    try {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);

    const login = async (phone, password) => {
        const userData = await loginService(phone, password);
        setUser(userData);
        return userData;
    };

    const register = async ({ name, phone, password }) => {
        const userData = await registerService({ name, phone, password });
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        await logoutService();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
