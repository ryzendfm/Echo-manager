import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { notificationApi } from "@/api/notificationApi";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Bell,
    CheckCircle2,
    CalendarOff,
    CalendarCheck,
    Megaphone,
    MessageSquare,
    CheckCheck,
} from "lucide-react";

const typeIcons = {
    task_completed: CheckCircle2,
    leave_request: CalendarOff,
    leave_approved: CalendarCheck,
    leave_rejected: CalendarOff,
    admin_announcement: Megaphone,
    general: MessageSquare,
};

const typeColors = {
    task_completed: "text-green-500",
    leave_request: "text-orange-500",
    leave_approved: "text-green-500",
    leave_rejected: "text-destructive",
    admin_announcement: "text-blue-500",
    general: "text-muted-foreground",
};

function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export default function NotificationBell() {
    const { user } = useAuth();
    const { unreadCount, markAsRead, markAllAsRead } = useSocket();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [recentNotifications, setRecentNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch recent notifications when popover opens
    useEffect(() => {
        if (open) {
            const fetchRecent = async () => {
                setLoading(true);
                try {
                    const res = await notificationApi.getAll({ page: 1, limit: 10 });
                    setRecentNotifications(res.data.notifications);
                } catch {
                    // ignore
                }
                setLoading(false);
            };
            fetchRecent();
        }
    }, [open]);

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
            setRecentNotifications((prev) =>
                prev.map((n) =>
                    n.id === notification.id ? { ...n, is_read: true } : n
                )
            );
        }

        setOpen(false);

        // Navigate based on reference type
        const role = user?.role;
        const base = role === "admin" ? "/admin" : role === "client" ? "/client" : "/employee";

        if (notification.reference_type && notification.reference_id) {
            switch (notification.reference_type) {
                case "task":
                    navigate(role === "admin" ? "/admin/tasks" : "/employee/tasks");
                    break;
                case "leave":
                    navigate(role === "admin" ? "/admin/employees?tab=leaves" : "/employee/leaves");
                    break;
                case "project":
                    navigate(`${base}/projects`);
                    break;
                default:
                    navigate(`${base}/notifications`);
                    break;
            }
        } else {
            // General notification without specific reference -> go to notifications page
            navigate(`${base}/notifications`);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setRecentNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true }))
        );
    };

    const handleViewAll = () => {
        setOpen(false);
        const role = user?.role;
        if (role === "admin") navigate("/admin/notifications");
        else if (role === "client") navigate("/client/notifications");
        else navigate("/employee/notifications");
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck className="mr-1 h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <Separator />
                <ScrollArea className="max-h-[60vh] sm:max-h-80">
                    {loading ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    ) : recentNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="grid">
                            {recentNotifications.map((notification) => {
                                const Icon = typeIcons[notification.type] || MessageSquare;
                                const color = typeColors[notification.type] || "text-muted-foreground";

                                return (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 text-left transition-colors hover:bg-muted/50 ${!notification.is_read
                                            ? "border-l-2 border-l-primary bg-muted/30"
                                            : "border-l-2 border-l-transparent"
                                            }`}
                                    >
                                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                                        <div className="grid gap-0.5 overflow-hidden min-w-0 flex-1">
                                            <p className={`text-sm leading-tight truncate ${!notification.is_read ? "font-semibold" : ""}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/70">
                                                {timeAgo(notification.created_at)}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <Separator />
                <div className="p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={handleViewAll}
                    >
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
