import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AuthLayout from "@/components/layouts/AuthLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import AdminDashboard from "@/pages/admin/Dashboard";
import EmployeeDashboard from "@/pages/employee/Dashboard";
import ClientDashboard from "@/pages/client/Dashboard";
import AdminProjects from "@/pages/admin/Projects";
import AdminEmployees from "@/pages/admin/Employees";
import AdminClients from "@/pages/admin/Clients";
import AdminTasks from "@/pages/admin/Tasks";
import AdminInvoices from "@/pages/admin/Invoices";
import AdminFinance from "@/pages/admin/Finance";
import AdminUsers from "@/pages/admin/Users";
import AdminTeams from "@/pages/admin/Teams";
import AdminAttendance from "@/pages/admin/Attendance";

// Employee pages
import EmployeeMyProjects from "@/pages/employee/MyProjects";
import EmployeeMyTasks from "@/pages/employee/MyTasks";
import EmployeeAttendance from "@/pages/employee/Attendance";
import EmployeeLeaves from "@/pages/employee/Leaves";

// Client pages
import ClientMyProjects from "@/pages/client/MyProjects";
import ClientMyInvoices from "@/pages/client/MyInvoices";

// Shared pages
import Notifications from "@/pages/shared/Notifications";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/projects" element={<AdminProjects />} />
                    <Route path="/admin/teams" element={<AdminTeams />} />
                    <Route path="/admin/employees" element={<AdminEmployees />} />
                    <Route path="/admin/clients" element={<AdminClients />} />
                    <Route path="/admin/tasks" element={<AdminTasks />} />
                    <Route path="/admin/invoices" element={<AdminInvoices />} />
                    <Route path="/admin/finance" element={<AdminFinance />} />
                    <Route path="/admin/attendance" element={<AdminAttendance />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/notifications" element={<Notifications />} />
                </Route>
            </Route>

            {/* Employee & Intern Routes */}
            <Route element={<ProtectedRoute allowedRoles={["employee", "intern"]} />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
                    <Route path="/employee/projects" element={<EmployeeMyProjects />} />
                    <Route path="/employee/tasks" element={<EmployeeMyTasks />} />
                    <Route path="/employee/attendance" element={<EmployeeAttendance />} />
                    <Route path="/employee/leaves" element={<EmployeeLeaves />} />
                    <Route path="/employee/notifications" element={<Notifications />} />
                </Route>
            </Route>

            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={["client"]} />}>
                <Route element={<DashboardLayout />}>
                    <Route path="/client/dashboard" element={<ClientDashboard />} />
                    <Route path="/client/projects" element={<ClientMyProjects />} />
                    <Route path="/client/invoices" element={<ClientMyInvoices />} />
                    <Route path="/client/notifications" element={<Notifications />} />
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

