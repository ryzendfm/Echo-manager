import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import tokenService from "@/services/token-service";
import { notificationApi } from "@/api/notificationApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const socketRef = useRef(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    // Fetch initial unread count on mount / user change
    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setNotifications([]);
            return;
        }

        const fetchUnread = async () => {
            try {
                const res = await notificationApi.getUnreadCount();
                setUnreadCount(res.data.count);
            } catch {
                // ignore
            }
        };
        fetchUnread();
    }, [user]);

    // Socket connection management
    useEffect(() => {
        if (!user) {
            // Disconnect if user logs out
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        const token = tokenService.getAccessToken();
        if (!token) return;

        const socket = io(BACKEND_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
            console.log("Socket connected:", socket.id);
        });

        socket.on("notification", (notification) => {
            setUnreadCount((prev) => prev + 1);
            setNotifications((prev) => [notification, ...prev]);
            toast(notification.title, {
                description: notification.message,
            });
        });

        socket.on("notification_read", ({ id }) => {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
        });

        socket.on("notifications_all_read", () => {
            setUnreadCount(0);
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user]);

    const markAsRead = useCallback(async (id) => {
        try {
            await notificationApi.markAsRead(id);
            // The server will emit notification_read to sync all tabs
        } catch {
            // ignore
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationApi.markAllAsRead();
            // The server will emit notifications_all_read to sync all tabs
        } catch {
            // ignore
        }
    }, []);

    return (
        <SocketContext.Provider
            value={{
                socket: socketRef.current,
                unreadCount,
                setUnreadCount,
                notifications,
                setNotifications,
                markAsRead,
                markAllAsRead,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) throw new Error("useSocket must be used within SocketProvider");
    return context;
};
