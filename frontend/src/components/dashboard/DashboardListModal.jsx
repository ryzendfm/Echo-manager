import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";

const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatCurrency = (v) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(v || 0);

const formatStatus = (status) =>
    status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "";

const statusColors = {
    // Projects
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    planning: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    // Invoices
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    // Tasks
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    in_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    blocked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    // Task priority
    low: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    // Attendance
    present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "half-day": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    late: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "on-leave": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    holiday: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

// Render functions for each data type
const renderProject = (item, onItemClick) => (
    <div
        key={item.id}
        onClick={() => onItemClick?.(item)}
        className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${onItemClick ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : ""} transition-colors`}
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.project_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
                Deadline: {formatDate(item.deadline)}
            </p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColors[item.status] || ""}`}>
            {formatStatus(item.status)}
        </Badge>
    </div>
);

const renderEmployee = (item, onItemClick) => (
    <div
        key={item.id}
        onClick={() => onItemClick?.(item)}
        className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${onItemClick ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : ""} transition-colors`}
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
                {item.User ? `${item.User.first_name} ${item.User.last_name}` : item.employee_uid}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
                {item.designation || "No designation"} {item.department ? `· ${formatStatus(item.department)}` : ""}
            </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {item.employee_uid}
        </Badge>
    </div>
);

const renderClient = (item, onItemClick) => (
    <div
        key={item.id}
        onClick={() => onItemClick?.(item)}
        className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${onItemClick ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : ""} transition-colors`}
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.company_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
                {item.contact_name || item.contact_email || "No contact info"}
            </p>
        </div>
        <Badge variant="outline" className="shrink-0 text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            {item.client_uid}
        </Badge>
    </div>
);

const renderInvoice = (item, onItemClick) => (
    <div
        key={item.id}
        onClick={() => onItemClick?.(item)}
        className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${onItemClick ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : ""} transition-colors`}
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
                {item.invoice_uid}
                {item.Client?.company_name ? ` · ${item.Client.company_name}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
                Due: {formatDate(item.due_date)} · {formatCurrency(item.total_amount)}
            </p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColors[item.status] || ""}`}>
            {formatStatus(item.status)}
        </Badge>
    </div>
);

const renderTransaction = (item) => (
    <div
        key={item.id}
        className="flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors"
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.description || "No description"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(item.date)} · {formatStatus(item.category)} · {formatStatus(item.payment_method)}
            </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(item.amount)}
        </span>
    </div>
);

const renderTask = (item, onItemClick) => (
    <div
        key={item.id}
        onClick={() => onItemClick?.(item)}
        className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${onItemClick ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70" : ""} transition-colors`}
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
                {item.Project?.project_name || "No project"} · Due: {formatDate(item.due_date)}
            </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[10px] ${statusColors[item.priority] || ""}`}>
                {formatStatus(item.priority)}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${statusColors[item.status] || ""}`}>
                {formatStatus(item.status)}
            </Badge>
        </div>
    </div>
);

const renderAttendance = (item) => (
    <div
        key={item.id}
        className="flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors"
    >
        <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{formatDate(item.date)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
                {item.check_in ? new Date(item.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                {" → "}
                {item.check_out ? new Date(item.check_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                {item.total_hours ? ` · ${item.total_hours} hrs` : ""}
            </p>
        </div>
        <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColors[item.status] || ""}`}>
            {formatStatus(item.status)}
        </Badge>
    </div>
);

const renderers = {
    project: renderProject,
    employee: renderEmployee,
    client: renderClient,
    invoice: renderInvoice,
    transaction: renderTransaction,
    task: renderTask,
    attendance: renderAttendance,
};

export default function DashboardListModal({
    isOpen,
    onClose,
    title,
    icon: Icon,
    items = [],
    type = "project",
    onItemClick,
    emptyMessage = "No items found.",
}) {
    const renderItem = renderers[type] || renderers.project;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-sm:!p-0 max-sm:flex max-sm:flex-col">
                {/* Mobile header */}
                <div className="sm:hidden sticky top-0 z-10 bg-background px-5 pt-5 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                        {Icon && <Icon className="h-5 w-5" />}
                        {title}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
                </div>

                {/* Desktop header */}
                <DialogHeader className="hidden sm:flex">
                    <DialogTitle className="flex items-center gap-2">
                        {Icon && <Icon className="h-5 w-5" />}
                        {title}
                    </DialogTitle>
                </DialogHeader>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-8 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 sm:h-10 sm:w-10 mb-3 sm:mb-2" />
                        <p className="text-sm">{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-sm:flex-1 max-sm:overflow-y-auto max-sm:px-4 max-sm:py-3 max-sm:pb-[env(safe-area-inset-bottom,16px)] sm:max-h-[60vh] sm:overflow-y-auto sm:pr-1">
                        {items.map((item) => renderItem(item, onItemClick))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
