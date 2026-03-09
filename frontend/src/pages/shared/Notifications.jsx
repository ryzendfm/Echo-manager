import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { notificationApi } from "@/api/notificationApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    CheckCircle2,
    CalendarOff,
    CalendarCheck,
    Megaphone,
    MessageSquare,
    CheckCheck,
    Trash2,
    Bell,
} from "lucide-react";
import SendNotificationDialog from "@/components/notifications/SendNotificationDialog";

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

const typeLabels = {
    task_completed: "Task Completed",
    leave_request: "Leave Request",
    leave_approved: "Leave Approved",
    leave_rejected: "Leave Rejected",
    admin_announcement: "Announcement",
    general: "General",
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

export default function Notifications() {
    const { user } = useAuth();
    const { markAsRead, markAllAsRead } = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

    const fetchNotifications = async (pageNum = 1, filterType = filter) => {
        setLoading(true);
        try {
            const params = { page: pageNum, limit: 15 };
            if (filterType === "unread") params.unread_only = "true";

            const res = await notificationApi.getAll(params);
            let items = res.data.notifications;

            // Client-side type filter (if not "all" or "unread")
            if (filterType !== "all" && filterType !== "unread") {
                items = items.filter((n) => n.type === filterType);
            }

            setNotifications(items);
            setPagination(res.data.pagination);
        } catch {
            // ignore
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotifications(1, filter);
    }, [filter]);

    const handleMarkAsRead = async (id) => {
        await markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, is_read: true }))
        );
    };

    const handleDelete = async (id) => {
        try {
            await notificationApi.delete(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch {
            // ignore
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchNotifications(newPage, filter);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground">
                        Stay updated with your latest activity
                    </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={handleMarkAllRead}
                    >
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark all read
                    </Button>
                    {user?.role === "admin" && <SendNotificationDialog onSent={() => fetchNotifications(1, filter)} />}
                </div>
            </div>

            {/* Filter Tabs — scrollable on mobile */}
            <Tabs value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
                <div className="-mx-4 px-4 overflow-x-auto sm:mx-0 sm:px-0">
                    <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                        <TabsTrigger value="task_completed">Tasks</TabsTrigger>
                        <TabsTrigger value="leave_request">Leaves</TabsTrigger>
                        <TabsTrigger value="admin_announcement">Announce</TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                            No notifications to show
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => {
                        const Icon = typeIcons[notification.type] || MessageSquare;
                        const color = typeColors[notification.type] || "text-muted-foreground";

                        return (
                            <Card
                                key={notification.id}
                                className={`transition-colors ${
                                    !notification.is_read
                                        ? "border-l-4 border-l-primary bg-muted/30"
                                        : ""
                                }`}
                            >
                                <CardContent className="px-3 py-2.5 sm:px-4 sm:py-3">
                                    {/* Mobile layout */}
                                    <div className="sm:hidden space-y-1.5">
                                        <div className="flex items-start gap-2.5">
                                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-tight ${!notification.is_read ? "font-semibold" : ""}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pl-6.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {typeLabels[notification.type] || notification.type}
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground/70">
                                                    {timeAgo(notification.created_at)}
                                                </span>
                                                {notification.sender && (
                                                    <span className="text-[10px] text-muted-foreground/70">
                                                        from {notification.sender.first_name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                {!notification.is_read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        title="Mark as read"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    title="Delete"
                                                    onClick={() => handleDelete(notification.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop layout */}
                                    <div className="hidden sm:flex items-start gap-4">
                                        <Icon className={`mt-1 h-5 w-5 shrink-0 ${color}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className={`text-sm ${!notification.is_read ? "font-semibold" : ""}`}>
                                                    {notification.title}
                                                </p>
                                                <Badge variant="outline" className="text-[10px] shrink-0">
                                                    {typeLabels[notification.type] || notification.type}
                                                </Badge>
                                            </div>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {notification.message}
                                            </p>
                                            <div className="mt-1 flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground/70">
                                                    {timeAgo(notification.created_at)}
                                                </span>
                                                {notification.sender && (
                                                    <span className="text-xs text-muted-foreground/70">
                                                        from {notification.sender.first_name} {notification.sender.last_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {!notification.is_read && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Mark as read"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                title="Delete"
                                                onClick={() => handleDelete(notification.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
