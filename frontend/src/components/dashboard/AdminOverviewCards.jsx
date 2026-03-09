import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Building, FileText, CreditCard, AlertCircle } from "lucide-react";
import { dashboardApi } from "@/api/dashboardApi";
import DashboardListModal from "./DashboardListModal";

export default function AdminOverviewCards() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, title: "", icon: null, items: [], type: "project", onItemClick: null, emptyMessage: "" });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await dashboardApi.getAdminStats();
                setStats(res.data.stats);
            } catch (err) {
                console.error("Failed to fetch stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

    const openModal = (title, icon, items, type, onItemClick, emptyMessage) => {
        setModal({ open: true, title, icon, items, type, onItemClick, emptyMessage });
    };
    const closeModal = () => setModal((m) => ({ ...m, open: false }));

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-7 w-16 bg-muted rounded mb-1" />
                            <div className="h-3 w-32 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const handleProjectClick = (project) => {
        closeModal();
        navigate("/admin/projects", { state: { project } });
    };
    const handleEmployeeClick = (emp) => {
        closeModal();
        navigate("/admin/employees");
    };
    const handleClientClick = (client) => {
        closeModal();
        navigate("/admin/clients");
    };
    const handleInvoiceClick = (invoice) => {
        closeModal();
        navigate("/admin/invoices");
    };

    const cards = [
        {
            title: "Active Projects",
            value: stats?.activeProjects ?? 0,
            icon: Briefcase,
            description: "Currently in progress or planning",
            onClick: () => openModal("Active Projects", Briefcase, stats?.activeProjectsList || [], "project", handleProjectClick, "No active projects."),
        },
        {
            title: "Total Employees",
            value: stats?.totalEmployees ?? 0,
            icon: Users,
            description: "Active team members",
            onClick: () => openModal("Active Employees", Users, stats?.employeesList || [], "employee", handleEmployeeClick, "No employees found."),
        },
        {
            title: "Total Clients",
            value: stats?.totalClients ?? 0,
            icon: Building,
            description: "Active client accounts",
            onClick: () => openModal("Active Clients", Building, stats?.clientsList || [], "client", handleClientClick, "No clients found."),
        },
        {
            title: "Revenue This Month",
            value: fmt(stats?.revenueThisMonth ?? 0),
            icon: CreditCard,
            description: "Income recorded this month",
            onClick: () => openModal("Revenue This Month", CreditCard, stats?.revenueTransactionsList || [], "transaction", null, "No income this month."),
        },
        {
            title: "Pending Invoices",
            value: stats?.pendingInvoices ?? 0,
            icon: FileText,
            description: `${stats?.overdueInvoices ?? 0} overdue`,
            onClick: () => openModal("Pending Invoices", FileText, stats?.pendingInvoicesList || [], "invoice", handleInvoiceClick, "No pending invoices."),
        },
        {
            title: "Overdue Projects",
            value: stats?.overdueProjects ?? 0,
            icon: AlertCircle,
            description: "Past deadline, not completed",
            variant: (stats?.overdueProjects ?? 0) > 0 ? "destructive" : null,
            onClick: () => openModal("Overdue Projects", AlertCircle, stats?.overdueProjectsList || [], "project", handleProjectClick, "No overdue projects."),
        },
    ];

    return (
        <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
                {cards.map((stat, index) => (
                    <Card
                        key={index}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${stat.variant === "destructive" ? "border-destructive/50 bg-destructive/10" : ""}`}
                        onClick={stat.onClick}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0 ${stat.variant === "destructive" ? "text-destructive" : ""}`} />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className={`text-lg sm:text-2xl font-bold truncate ${stat.variant === "destructive" ? "text-destructive" : ""}`}>{stat.value}</div>
                            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <DashboardListModal
                isOpen={modal.open}
                onClose={closeModal}
                title={modal.title}
                icon={modal.icon}
                items={modal.items}
                type={modal.type}
                onItemClick={modal.onItemClick}
                emptyMessage={modal.emptyMessage}
            />
        </>
    );
}
