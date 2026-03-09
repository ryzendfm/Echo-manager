import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, CheckSquare, CalendarCheck, Clock } from "lucide-react";
import { dashboardApi } from "@/api/dashboardApi";
import DashboardListModal from "./DashboardListModal";

export default function EmployeeOverviewCards() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, title: "", icon: null, items: [], type: "project", onItemClick: null, emptyMessage: "" });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await dashboardApi.getEmployeeStats();
                setStats(res.data.stats);
            } catch (err) {
                console.error("Failed to fetch employee stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const openModal = (title, icon, items, type, onItemClick, emptyMessage) => {
        setModal({ open: true, title, icon, items, type, onItemClick, emptyMessage });
    };
    const closeModal = () => setModal((m) => ({ ...m, open: false }));

    const handleProjectClick = (project) => {
        closeModal();
        navigate("/employee/projects", { state: { project } });
    };
    const handleTaskClick = (task) => {
        closeModal();
        navigate("/employee/tasks");
    };
    const handleAttendanceClick = () => {
        closeModal();
        navigate("/employee/attendance");
    };

    const cards = [
        {
            title: "Active Projects",
            value: stats?.activeProjects ?? 0,
            icon: Briefcase,
            description: "Projects currently active",
            onClick: () => openModal("Active Projects", Briefcase, stats?.activeProjectsList || [], "project", handleProjectClick, "No active projects."),
        },
        {
            title: "Pending Tasks",
            value: stats?.pendingTasks ?? 0,
            icon: CheckSquare,
            description: `${stats?.highPriorityTasks ?? 0} high priority`,
            onClick: () => openModal("Pending Tasks", CheckSquare, stats?.pendingTasksList || [], "task", handleTaskClick, "No pending tasks."),
        },
        {
            title: "Next Deadline",
            value:
                typeof stats?.nextDeadlineInDays === "number"
                    ? `${stats.nextDeadlineInDays} Day${stats.nextDeadlineInDays === 1 ? "" : "s"}`
                    : "—",
            icon: Clock,
            description: stats?.nextDeadlineProjectName || "No upcoming deadlines",
            onClick: () => openModal("Upcoming Deadlines", Clock, stats?.upcomingDeadlinesList || [], "project", handleProjectClick, "No upcoming deadlines."),
        },
        {
            title: "Attendance",
            value: `${stats?.attendancePercent ?? 0}%`,
            icon: CalendarCheck,
            description: stats?.presentToday ? "Present today" : "Not marked today",
            onClick: () => openModal("Attendance This Month", CalendarCheck, stats?.attendanceList || [], "attendance", null, "No attendance records this month."),
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <div className="h-3 sm:h-4 w-16 sm:w-24 bg-muted rounded" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="h-5 sm:h-7 w-12 sm:w-20 bg-muted rounded mb-1" />
                            <div className="h-2 sm:h-3 w-20 sm:w-32 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
                {cards.map((stat, index) => (
                    <Card
                        key={index}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={stat.onClick}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
                            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
                            <div className="text-lg sm:text-2xl font-bold truncate">{stat.value}</div>
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
