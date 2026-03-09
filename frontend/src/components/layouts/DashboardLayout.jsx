import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
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
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    FileText,
    Settings,
    LogOut,
    Menu,
    Sun,
    Moon,
    Building,
    CreditCard,
    CalendarCheck,
    UserCheck,
    UsersRound,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import AttendanceTimer from "@/components/layouts/AttendanceTimer";
import { BACKEND_URL } from "@/api/axiosInstance";

const getAvatarUrl = (avatar) => {
    if (!avatar) return '';
    if (avatar.startsWith('http')) return avatar;
    return `${BACKEND_URL}/${avatar}`;
};

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Define navigation items based on role
    const getNavItems = () => {
        const role = user?.role || "guest";

        // Common items could go here if any

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
    };

    const navItems = getNavItems();

    const handleLogout = () => {
        logout();
    };

    const firstName = user?.first_name || user?.firstName || "";
    const lastName = user?.last_name || user?.lastName || "";
    const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || user?.email || "User";

    const NavContent = () => (
        <div className="flex h-full flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
                <NavLink to="/" className="flex items-center gap-2 font-semibold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <span className="text-lg">Echo Manager</span>
                </NavLink>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {navItems.map((item, index) => (
                        <NavLink
                            key={index}
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground"
                                )
                            }
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="mt-auto border-t p-4">
                <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={getAvatarUrl(user?.avatar)} alt={displayName} />
                        <AvatarFallback>{firstName?.charAt(0) || displayName?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-0.5 text-xs">
                        <span className="font-semibold">{displayName}</span>
                        <span className="text-muted-foreground capitalize">{user?.role}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="grid min-h-screen w-full overflow-x-hidden md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <NavContent />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col">
                            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                            <SheetDescription className="sr-only">Main navigation links</SheetDescription>
                            <NavContent />
                        </SheetContent>
                    </Sheet>
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
        </div>
    );
}
