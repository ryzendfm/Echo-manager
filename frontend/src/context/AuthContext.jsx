import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import tokenService from "@/services/token-service";
import { authApi } from "@/api/authApi";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const initAuth = async () => {
            const token = tokenService.getAccessToken();
            if (token) {
                try {
                    const res = await authApi.getMe();
                    setUser(res.data.user);
                } catch {
                    tokenService.clearTokens();
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (credentials) => {
        const res = await authApi.login(credentials);
        const { user, token } = res.data;
        tokenService.setTokens(token, ""); // No refresh token in current backend
        setUser(user);

        // Redirect based on role
        const roleRoutes = {
            admin: "/admin/dashboard",
            employee: "/employee/dashboard",
            intern: "/employee/dashboard",
            client: "/client/dashboard",
        };
        navigate(roleRoutes[user.role] || "/login");
    };

    const logout = () => {
        tokenService.clearTokens();
        setUser(null);
        navigate("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
