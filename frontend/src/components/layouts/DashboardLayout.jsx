import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    FileText,
    LogOut,
    Sun,
    Moon,
    Building,
    CreditCard,
    CalendarCheck,
    UserCheck,
    UsersRound,
    Bell,
} from "lucide-react";
import {
    SidebarProvider,
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import AttendanceTimer from "@/components/layouts/AttendanceTimer";
import { BACKEND_URL } from "@/api/axiosInstance";

const getAvatarUrl = (avatar) => {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return `${BACKEND_URL}/${avatar}`;
};

function getNavItems(role) {
    if (role === "admin") {
        return [
            { title: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
            { title: "Projects", icon: Briefcase, href: "/admin/projects" },
            { title: "Teams", icon: UsersRound, href: "/admin/teams" },
            { title: "Employees", icon: Users, href: "/admin/employees" },
            { title: "Clients", icon: Building, href: "/admin/clients" },
            { title: "Invoices", icon: FileText, href: "/admin/invoices" },
            { title: "Attendance", icon: CalendarCheck, href: "/admin/attendance" },
            { title: "Finance", icon: CreditCard, href: "/admin/finance" },
            { title: "User Mgmt", icon: UserCheck, href: "/admin/users" },
            { title: "Notifications", icon: Bell, href: "/admin/notifications" },
        ];
    }

    if (role === "employee" || role === "intern") {
        return [
            { title: "Dashboard", icon: LayoutDashboard, href: "/employee/dashboard" },
            { title: "My Projects", icon: Briefcase, href: "/employee/projects" },
            { title: "My Tasks", icon: FileText, href: "/employee/tasks" },
            { title: "Attendance", icon: CalendarCheck, href: "/employee/attendance" },
            { title: "Leaves", icon: UserCheck, href: "/employee/leaves" },
            { title: "Notifications", icon: Bell, href: "/employee/notifications" },
        ];
    }

    if (role === "client") {
        return [
            { title: "Dashboard", icon: LayoutDashboard, href: "/client/dashboard" },
            { title: "Projects", icon: Briefcase, href: "/client/projects" },
            { title: "Invoices", icon: FileText, href: "/client/invoices" },
            { title: "Notifications", icon: Bell, href: "/client/notifications" },
        ];
    }

    return [];
}

function AppSidebar({ user, displayName, firstName }) {
    const navItems = getNavItems(user?.role);
    const { isMobile, setOpenMobile } = useSidebar();

    const handleMobileNavClick = () => {
        if (isMobile) setOpenMobile(false);
    };

    return (
        <Sidebar collapsible="icon">
            {/* Header: only visible on mobile sidebar or when expanded on desktop */}
            <SidebarHeader className="border-b border-sidebar-border">
                {isMobile ? (
                    <div className="flex items-center gap-3 px-2 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-base font-bold">Echo Manager</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.role} Panel</p>
                        </div>
                    </div>
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" tooltip="Echo Manager">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <LayoutDashboard className="h-5 w-5" />
                                </div>
                                <span className="text-lg font-semibold truncate">Echo Manager</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    {isMobile && (
                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Navigation
                        </p>
                    )}
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton asChild tooltip={item.title}>
                                    <NavLink
                                        to={item.href}
                                        onClick={handleMobileNavClick}
                                        className={({ isActive }) =>
                                            isActive
                                                ? "bg-sidebar-accent dark:text-white dark:hover:text-sidebar-accent-foreground font-medium"
                                                : "dark:text-white dark:hover:text-sidebar-accent-foreground"
                                        }
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.title}</span>
                                    </NavLink>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                {isMobile ? (
                    <div className="flex flex-col gap-2 p-2">
                        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
                            <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-border">
                                <AvatarImage src={getAvatarUrl(user?.avatar)} alt={displayName} />
                                <AvatarFallback>{firstName?.charAt(0) || displayName?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{displayName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" tooltip={displayName}>
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarImage src={getAvatarUrl(user?.avatar)} alt={displayName} />
                                    <AvatarFallback>{firstName?.charAt(0) || displayName?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5 text-xs leading-tight group-data-[collapsible=icon]:hidden">
                                    <span className="font-semibold truncate">{displayName}</span>
                                    <span className="text-muted-foreground capitalize">{user?.role}</span>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}

function DashboardContent() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const firstName = user?.first_name || user?.firstName || "";
    const lastName = user?.last_name || user?.lastName || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || user?.email || "User";

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger />
                <div className="w-full flex-1 flex items-center">
                    {(user?.role === "employee" || user?.role === "intern") && (
                        <AttendanceTimer />
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
                    {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
                <NotificationBell />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={getAvatarUrl(user?.avatar)} />
                                <AvatarFallback>{firstName?.charAt(0) || displayName?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                            <span className="text-muted-foreground">User:</span>&nbsp;
                            <span className="font-medium">{firstName || "—"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>
                            <span className="text-muted-foreground">Role:</span>&nbsp;
                            <span className="font-medium capitalize">{user?.role || "—"}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                <Outlet />
            </main>
        </div>
    );
}

export default function DashboardLayout() {
    const { user } = useAuth();

    const firstName = user?.first_name || user?.firstName || "";
    const lastName = user?.last_name || user?.lastName || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || user?.email || "User";

    return (
        <SidebarProvider defaultOpen={false}>
            <AppSidebar user={user} displayName={displayName} firstName={firstName} />
            <DashboardContent />
        </SidebarProvider>
    );
}
