import { useState, useEffect, useMemo } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoreHorizontal, Plus, Search, FolderKanban, Check, Upload, X, Mail, Phone, Calendar, Briefcase, Building2, UserCheck, FileText, ClipboardList, CalendarDays, Bell, CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";
import { employeeApi } from "@/api/employeeApi";
import { taskApi } from "@/api/taskApi";
import { attendanceApi } from "@/api/attendanceApi";
import { notificationApi } from "@/api/notificationApi";
import api, { BACKEND_URL } from "@/api/axiosInstance";
import { projectApi } from "@/api/projectApi";
import { toast } from "sonner";

export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewEmp, setViewEmp] = useState(null);
    const [editEmp, setEditEmp] = useState(null);
    const [formEmp, setFormEmp] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newEmp, setNewEmp] = useState({
        user: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            password: "",
            confirm_password: "",
        },
        employee: {
            designation: "",
            department: "engineering",
            employee_type: "full-time",
            date_of_joining: new Date().toISOString().split("T")[0],
        },
    });

    // Assign projects state
    const [allProjects, setAllProjects] = useState([]);
    const [assignEmp, setAssignEmp] = useState(null);
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [projectSearch, setProjectSearch] = useState("");

    // File upload state & handlers
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    // View employee profile state
    const [viewProjects, setViewProjects] = useState([]);
    const [viewProjectsLoading, setViewProjectsLoading] = useState(false);
    const [viewTab, setViewTab] = useState("profile");

    // Assigned tasks tab state
    const [viewTasks, setViewTasks] = useState([]);
    const [viewTasksLoading, setViewTasksLoading] = useState(false);

    // Attendance tab state
    const [viewAttendance, setViewAttendance] = useState([]);
    const [viewAttendanceLoading, setViewAttendanceLoading] = useState(false);
    const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
    const [attYear, setAttYear] = useState(new Date().getFullYear());

    // Notifications tab state
    const [viewNotifications, setViewNotifications] = useState([]);
    const [viewNotificationsLoading, setViewNotificationsLoading] = useState(false);

    useEffect(() => { fetchEmployees(); fetchAllProjects(); }, []);

    // Fetch projects when dialog opens
    useEffect(() => {
        if (!viewEmp) { setViewProjects([]); setViewTab("profile"); return; }
        let cancelled = false;
        (async () => {
            try {
                setViewProjectsLoading(true);
                const res = await employeeApi.getProjects(viewEmp.id);
                if (!cancelled) setViewProjects(res.data.projects || []);
            } catch { if (!cancelled) setViewProjects([]); }
            finally { if (!cancelled) setViewProjectsLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewEmp]);

    // Fetch tasks when tab switches or dialog opens
    useEffect(() => {
        if (!viewEmp || viewTab !== "tasks") return;
        let cancelled = false;
        (async () => {
            try {
                setViewTasksLoading(true);
                const res = await taskApi.getByEmployee(viewEmp.id);
                if (!cancelled) setViewTasks(res.data.tasks || []);
            } catch { if (!cancelled) setViewTasks([]); }
            finally { if (!cancelled) setViewTasksLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewEmp, viewTab]);

    // Fetch attendance when tab switches or month/year changes
    useEffect(() => {
        if (!viewEmp || viewTab !== "attendance") return;
        let cancelled = false;
        (async () => {
            try {
                setViewAttendanceLoading(true);
                const res = await attendanceApi.getByEmployee(viewEmp.id, { month: attMonth, year: attYear });
                if (!cancelled) setViewAttendance(res.data.attendance || []);
            } catch { if (!cancelled) setViewAttendance([]); }
            finally { if (!cancelled) setViewAttendanceLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewEmp, viewTab, attMonth, attYear]);

    // Fetch notifications when tab switches
    useEffect(() => {
        if (!viewEmp || viewTab !== "notifications") return;
        let cancelled = false;
        (async () => {
            try {
                setViewNotificationsLoading(true);
                const res = await notificationApi.getByUserId(viewEmp.user_id, { limit: 50 });
                if (!cancelled) setViewNotifications(res.data.notifications || []);
            } catch { if (!cancelled) setViewNotifications([]); }
            finally { if (!cancelled) setViewNotificationsLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewEmp, viewTab]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e, type, field) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await uploadFile(e.dataTransfer.files[0], type, field);
        }
    };

    const handleFileChange = async (e, type, field) => {
        const file = e.target.files[0];
        if (!file) return;
        await uploadFile(file, type, field);
    };

    const uploadFile = async (file, type, field) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            // Use shared axios instance — carries auth token and dynamic network hostname
            const res = await api.post('/upload/temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data;

            if (data.success) {
                if (type === 'new') {
                    if (field === 'avatar') {
                        setNewEmp(prev => ({ ...prev, user: { ...prev.user, avatar: data.tempPath } }));
                    } else if (field === 'documents') {
                        setNewEmp(prev => ({ ...prev, employee: { ...prev.employee, documents: data.tempPath } }));
                    }
                } else if (type === 'edit') {
                    if (field === 'avatar') {
                        setFormEmp(prev => ({ ...prev, user: { ...prev.user, avatar: data.tempPath } }));
                    } else if (field === 'documents') {
                        setFormEmp(prev => ({ ...prev, documents: data.tempPath }));
                    }
                }
                toast.success("File uploaded");
            } else {
                toast.error("Upload failed: " + data.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Upload failed: " + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await employeeApi.getAll();
            setEmployees(res.data.employees || []);
        } catch (err) { console.error("Failed to fetch employees:", err); }
        finally { setLoading(false); }
    };

    const fetchAllProjects = async () => {
        try {
            const res = await projectApi.getAll();
            setAllProjects(res.data.projects || []);
        } catch (err) { console.error("Failed to fetch projects:", err); }
    };

    const openAssignDialog = async (emp) => {
        setAssignEmp(emp);
        setProjectSearch("");
        try {
            const res = await employeeApi.getProjects(emp.id);
            setSelectedProjectIds((res.data.projects || []).map(p => p.id));
        } catch {
            setSelectedProjectIds([]);
        }
    };

    const toggleProject = (projectId) => {
        setSelectedProjectIds(prev =>
            prev.includes(projectId)
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleAssignProjects = async () => {
        try {
            setAssignLoading(true);
            await employeeApi.assignProjects(assignEmp.id, selectedProjectIds);
            toast.success(`Projects assigned to ${assignEmp.user?.first_name}`);
            setAssignEmp(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to assign projects");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newEmp.user.first_name || !newEmp.user.last_name) {
            toast.error("Please fill in First Name and Last Name");
            return;
        }
        if (!newEmp.user.email) {
            toast.error("Please fill in Email");
            return;
        }
        if (!newEmp.employee.designation) {
            toast.error("Please fill in Designation");
            return;
        }
        if (!newEmp.user.password || newEmp.user.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (newEmp.user.password !== newEmp.user.confirm_password) {
            toast.error("Passwords do not match");
            return;
        }
        try {
            await employeeApi.create(newEmp);
            toast.success("Employee added");
            setShowNewDialog(false);
            setNewEmp({
                user: {
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    password: "",
                    confirm_password: "",
                },
                employee: {
                    designation: "",
                    department: "engineering",
                    employee_type: "full-time",
                    date_of_joining: new Date().toISOString().split("T")[0],
                },
            });
            fetchEmployees();
        } catch (err) { toast.error(err?.response?.data?.message || "Failed to add employee"); }
    };

    const handleEdit = async () => {
        try {
            await employeeApi.update(formEmp.id, formEmp);
            toast.success("Employee updated");
            setEditEmp(null);
            fetchEmployees();
        } catch (err) { console.error(err); toast.error("Failed to update employee"); }
    };

    const handleToggleActive = async (emp) => {
        try {
            await employeeApi.update(emp.id, { is_active: !emp.is_active });
            toast.success(emp.is_active ? "Employee deactivated" : "Employee activated");
            fetchEmployees();
        } catch (err) { console.error(err); toast.error("Failed to update status"); }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || emp.employee_type === typeFilter;
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && emp.is_active) ||
            (statusFilter === "inactive" && !emp.is_active);
        return matchesSearch && matchesType && matchesStatus;
    });

    const getProjectStatusColor = (status) => {
        const m = { in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", planning: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
        return m[status] || "";
    };

    const getTaskStatusColor = (status) => {
        const m = { todo: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", in_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", blocked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
        return m[status] || "";
    };

    const getTaskPriorityColor = (priority) => {
        const m = { low: "text-gray-500", medium: "text-blue-500", high: "text-orange-500", urgent: "text-red-500" };
        return m[priority] || "text-gray-500";
    };

    const getAttStatusColor = (s) => {
        const m = { present: "bg-green-500", absent: "bg-red-500", 'half-day': "bg-yellow-500", late: "bg-orange-500", 'on-leave': "bg-purple-500", holiday: "bg-blue-500" };
        return m[s] || "bg-gray-300";
    };

    const getNotifTypeIcon = (type) => {
        const m = { task_completed: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", leave_request: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400", leave_approved: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400", leave_rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400", admin_announcement: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400", general: "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400" };
        return m[type] || m.general;
    };

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const ATT_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const ATT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const attCalendarDays = useMemo(() => {
        const daysInMonth = new Date(attYear, attMonth, 0).getDate();
        const firstDay = new Date(attYear, attMonth - 1, 1).getDay();
        const cells = [];
        const todayStr = new Date().toISOString().split('T')[0];
        const lookup = {};
        viewAttendance.forEach((r) => { lookup[r.date] = r; });
        for (let i = 0; i < firstDay; i++) cells.push({ empty: true });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${attYear}-${String(attMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({ day: d, date: dateStr, record: lookup[dateStr], isToday: dateStr === todayStr, isSunday: new Date(attYear, attMonth - 1, d).getDay() === 0 });
        }
        return cells;
    }, [viewAttendance, attMonth, attYear]);

    const attStats = useMemo(() => {
        let present = 0, absent = 0, late = 0, totalHours = 0;
        viewAttendance.forEach((r) => {
            if (r.status === 'present') present++;
            else if (r.status === 'absent') absent++;
            else if (r.status === 'late') { late++; present++; }
            totalHours += parseFloat(r.total_hours || 0);
        });
        return { present, absent, late, totalHours: totalHours.toFixed(1) };
    }, [viewAttendance]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 sm:top-1/2 sm:-translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search employees..." className="w-full pl-8 h-9 sm:h-10 text-xs sm:text-sm"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="flex-1 sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="full-time">Full-time</SelectItem>
                                <SelectItem value="part-time">Part-time</SelectItem>
                                <SelectItem value="intern">Intern</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="flex-1 sm:w-[130px] h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
            </div>

            {/* Mobile card list */}
            < div className="space-y-3 sm:hidden" >
                {
                    loading ? (
                        <div className="text-center py-8 text-muted-foreground" > Loading employees...</div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No employees found.</div>
                    ) : (
                        filteredEmployees.map((emp) => (
                            <div key={emp.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={emp.user?.avatar ? (emp.user.avatar.startsWith('http') ? emp.user.avatar : `${BACKEND_URL}/${emp.user.avatar}`) : ''} />
                                            <AvatarFallback>{emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold">{emp.user?.first_name} {emp.user?.last_name}</div>
                                            <div className="text-xs text-muted-foreground">{emp.employee_uid}</div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setViewEmp(emp)}>View Profile</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => { setEditEmp(emp); setFormEmp({ ...emp }); }}>Edit Details</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openAssignDialog(emp)}><FolderKanban className="mr-2 h-4 w-4" />Assign Projects</DropdownMenuItem>
                                            <DropdownMenuItem className={emp.is_active ? "text-destructive" : "text-green-600"} onClick={() => handleToggleActive(emp)}>{emp.is_active ? "Deactivate" : "Activate"}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <span className="text-muted-foreground">{emp.designation}</span>
                                    <span className="text-muted-foreground">·</span>
                                    <span className="text-muted-foreground capitalize">{emp.department}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge variant="secondary" className="capitalize">{emp.employee_type}</Badge>
                                    <Badge variant={emp.is_active ? "default" : "secondary"}>{emp.is_active ? "Active" : "Inactive"}</Badge>
                                </div>
                            </div>
                        ))
                    )
                }
            </div >

            {/* Desktop table */}
            < div className="hidden sm:block rounded-md border" >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading employees...</TableCell></TableRow>
                        ) : filteredEmployees.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No employees found.</TableCell></TableRow>
                        ) : (
                            filteredEmployees.map((emp) => (
                                <TableRow key={emp.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={emp.user?.avatar ? (emp.user.avatar.startsWith('http') ? emp.user.avatar : `${BACKEND_URL}/${emp.user.avatar}`) : ''} />
                                            <AvatarFallback>{emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{emp.user?.first_name} {emp.user?.last_name}</span>
                                            <span className="text-xs text-muted-foreground">{emp.employee_uid}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{emp.designation}</TableCell>
                                    <TableCell className="capitalize">{emp.department}</TableCell>
                                    <TableCell className="capitalize">{emp.employee_type}</TableCell>
                                    <TableCell>
                                        <Badge variant={emp.is_active ? "default" : "secondary"}>
                                            {emp.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewEmp(emp)}>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditEmp(emp); setFormEmp({ ...emp }); }}>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openAssignDialog(emp)}>
                                                    <FolderKanban className="mr-2 h-4 w-4" />Assign Projects
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className={emp.is_active ? "text-destructive" : "text-green-600"} onClick={() => handleToggleActive(emp)}>
                                                    {emp.is_active ? "Deactivate" : "Activate"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div >

            {/* View Employee Profile */}
            <Dialog open={!!viewEmp} onOpenChange={() => setViewEmp(null)}>
                <DialogContent className="p-0 sm:max-w-[600px] sm:h-[85vh] flex flex-col">
                    {/* Sticky Header */}
                    <div className="border-b shrink-0 px-4 sm:px-6 pt-6 pb-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0">
                                <AvatarImage src={viewEmp?.user?.avatar ? (viewEmp.user.avatar.startsWith('http') ? viewEmp.user.avatar : `${BACKEND_URL}/${viewEmp.user.avatar}`) : ''} />
                                <AvatarFallback className="text-lg sm:text-xl">{viewEmp?.user?.first_name?.[0]}{viewEmp?.user?.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">{viewEmp?.user?.first_name} {viewEmp?.user?.last_name}</h2>
                                    <Badge variant={viewEmp?.is_active ? "default" : "secondary"} className="shrink-0">{viewEmp?.is_active ? "Active" : "Inactive"}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{viewEmp?.employee_uid} &middot; <span className="capitalize">{viewEmp?.user?.role}</span></p>
                                {/* Desktop inline stats */}
                                <div className="hidden sm:flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                    <Building2 className="h-3 w-3" /><span className="capitalize">{viewEmp?.department}</span>
                                    <span>&middot;</span>
                                    <Briefcase className="h-3 w-3" /><span className="capitalize">{viewEmp?.employee_type}</span>
                                    <span>&middot;</span>
                                    <Calendar className="h-3 w-3" /><span>Joined {viewEmp?.date_of_joining ? new Date(viewEmp.date_of_joining).toLocaleDateString() : '—'}</span>
                                </div>
                            </div>
                        </div>
                        {/* Mobile stat cards */}
                        <div className="grid grid-cols-2 gap-2 mt-3 sm:hidden">
                            <div className="rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Building2 className="h-3 w-3" />Department</div>
                                <p className="text-xs font-medium capitalize mt-0.5">{viewEmp?.department}</p>
                            </div>
                            <div className="rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Briefcase className="h-3 w-3" />Type</div>
                                <p className="text-xs font-medium capitalize mt-0.5">{viewEmp?.employee_type}</p>
                            </div>
                            <div className="rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><UserCheck className="h-3 w-3" />Designation</div>
                                <p className="text-xs font-medium mt-0.5 truncate">{viewEmp?.designation}</p>
                            </div>
                            <div className="rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Calendar className="h-3 w-3" />Joined</div>
                                <p className="text-xs font-medium mt-0.5">{viewEmp?.date_of_joining ? new Date(viewEmp.date_of_joining).toLocaleDateString() : '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={viewTab} onValueChange={setViewTab} className="flex-1 flex flex-col min-h-0">
                        <div className="px-4 sm:px-6 pt-2 shrink-0">
                            <TabsList className="w-full">
                                <TabsTrigger value="profile" className="flex-1 text-xs sm:text-sm">Profile</TabsTrigger>
                                <TabsTrigger value="tasks" className="flex-1 text-xs sm:text-sm">Tasks</TabsTrigger>
                                <TabsTrigger value="attendance" className="flex-1 text-xs sm:text-sm">Attendance</TabsTrigger>
                                <TabsTrigger value="notifications" className="flex-1 text-xs sm:text-sm">Notifications</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 space-y-5 mt-0">
                            {/* Contact Info */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contact</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="truncate">{viewEmp?.user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span>{viewEmp?.user?.phone || "Not provided"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Employment Details</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><UserCheck className="h-3 w-3" />Designation</div>
                                        <p className="text-sm font-medium mt-0.5 truncate">{viewEmp?.designation}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Building2 className="h-3 w-3" />Department</div>
                                        <p className="text-sm font-medium capitalize mt-0.5">{viewEmp?.department}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Briefcase className="h-3 w-3" />Type</div>
                                        <p className="text-sm font-medium capitalize mt-0.5">{viewEmp?.employee_type}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Calendar className="h-3 w-3" />Date of Joining</div>
                                        <p className="text-sm font-medium mt-0.5">{viewEmp?.date_of_joining ? new Date(viewEmp.date_of_joining).toLocaleDateString() : '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            {viewEmp?.documents && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Documents</h3>
                                    <a
                                        href={viewEmp.documents.startsWith('http') ? viewEmp.documents : `${BACKEND_URL}/${viewEmp.documents}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        {viewEmp.documents.split(/[/\\]/).pop()}
                                    </a>
                                </div>
                            )}

                            {/* Assigned Projects */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assigned Projects</h3>
                                {viewProjectsLoading ? (
                                    <p className="text-xs text-muted-foreground">Loading projects...</p>
                                ) : viewProjects.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No projects assigned.</p>
                                ) : (
                                    <div className="flex gap-2 overflow-x-auto sm:overflow-x-visible sm:flex-wrap pb-1 styled-scrollbar">
                                        {viewProjects.map(p => (
                                            <div key={p.id} className="shrink-0 rounded-lg border px-3 py-2 min-w-[160px] sm:min-w-0">
                                                <p className="text-sm font-medium truncate max-w-[180px]">{p.project_name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] text-muted-foreground">{p.project_uid}</span>
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getProjectStatusColor(p.status)}`}>
                                                        {p.status?.replace(/_/g, ' ').toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Assigned Tasks Tab */}
                        <TabsContent value="tasks" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 mt-0">
                            {viewTasksLoading ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading tasks...</div>
                            ) : viewTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <ClipboardList className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">No tasks assigned yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {viewTasks.map(task => (
                                        <div key={task.id} className="rounded-lg border p-3 space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    {task.status === 'completed' ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                    ) : task.status === 'blocked' ? (
                                                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                    ) : (
                                                        <Circle className={`h-4 w-4 shrink-0 mt-0.5 ${getTaskPriorityColor(task.priority)}`} />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span className="text-[10px] text-muted-foreground">{task.task_uid}</span>
                                                            {task.project_name && <span className="text-[10px] text-muted-foreground">&middot; {task.project_name}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getTaskStatusColor(task.status)}`}>
                                                    {task.status?.replace(/_/g, ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pl-6">
                                                <span className="capitalize">{task.priority} priority</span>
                                                {task.due_date && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Calendar className="h-2.5 w-2.5" />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Attendance Tab */}
                        <TabsContent value="attendance" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 mt-0">
                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                <div className="rounded-lg bg-muted/20 px-2 py-2 text-center">
                                    <div className="text-lg font-bold text-green-600">{attStats.present}</div>
                                    <p className="text-[10px] text-muted-foreground">Present</p>
                                </div>
                                <div className="rounded-lg bg-muted/20 px-2 py-2 text-center">
                                    <div className="text-lg font-bold text-red-600">{attStats.absent}</div>
                                    <p className="text-[10px] text-muted-foreground">Absent</p>
                                </div>
                                <div className="rounded-lg bg-muted/20 px-2 py-2 text-center">
                                    <div className="text-lg font-bold text-orange-600">{attStats.late}</div>
                                    <p className="text-[10px] text-muted-foreground">Late</p>
                                </div>
                                <div className="rounded-lg bg-muted/20 px-2 py-2 text-center">
                                    <div className="text-lg font-bold text-blue-600">{attStats.totalHours}</div>
                                    <p className="text-[10px] text-muted-foreground">Hours</p>
                                </div>
                            </div>

                            {/* Month/Year selectors */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Monthly View</h3>
                                <div className="flex gap-1.5">
                                    <Select value={String(attMonth)} onValueChange={(v) => setAttMonth(parseInt(v))}>
                                        <SelectTrigger className="h-7 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ATT_MONTHS.map((m, i) => (<SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={String(attYear)} onValueChange={(v) => setAttYear(parseInt(v))}>
                                        <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[2024, 2025, 2026].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {viewAttendanceLoading ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <>
                                    {/* Calendar grid */}
                                    <div className="grid grid-cols-7 gap-1 mb-1.5">
                                        {ATT_DAYS.map((d) => (
                                            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {attCalendarDays.map((cell, i) => (
                                            <div
                                                key={i}
                                                className={`
                                                    relative h-9 sm:h-10 rounded-lg flex items-center justify-center text-xs
                                                    ${cell.empty ? '' : 'border'}
                                                    ${cell.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                                                    ${cell.isSunday && !cell.empty ? 'bg-muted/50' : ''}
                                                `}
                                            >
                                                {!cell.empty && (
                                                    <>
                                                        <span className={cell.record ? 'font-medium' : 'text-muted-foreground'}>{cell.day}</span>
                                                        {cell.record && (
                                                            <div className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${getAttStatusColor(cell.record.status)}`} />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Legend */}
                                    <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
                                        {[
                                            { label: 'Present', color: 'bg-green-500' },
                                            { label: 'Absent', color: 'bg-red-500' },
                                            { label: 'Late', color: 'bg-orange-500' },
                                            { label: 'On Leave', color: 'bg-purple-500' },
                                            { label: 'Holiday', color: 'bg-blue-500' },
                                        ].map((l) => (
                                            <div key={l.label} className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                                                <span className="text-muted-foreground">{l.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 mt-0">
                            {viewNotificationsLoading ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading notifications...</div>
                            ) : viewNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <Bell className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">No notifications yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {viewNotifications.map(n => (
                                        <div key={n.id} className={`rounded-lg border p-3 ${!n.is_read ? 'bg-primary/5 border-primary/20' : ''}`}>
                                            <div className="flex items-start gap-2.5">
                                                <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${getNotifTypeIcon(n.type)}`}>
                                                    <Bell className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <p className={`text-sm ${!n.is_read ? 'font-medium' : ''}`}>{n.title}</p>
                                                        <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(n.created_at)}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                                    {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Edit Employee */}
            < Dialog open={!!editEmp} onOpenChange={() => setEditEmp(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>Update employee details.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2"><Label>Designation <span className="text-destructive">*</span></Label><Input value={formEmp?.designation || ''} onChange={(e) => setFormEmp({ ...formEmp, designation: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Department <span className="text-destructive">*</span></Label>
                                    <Select value={formEmp?.department || ''} onValueChange={(v) => setFormEmp({ ...formEmp, department: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['engineering', 'design', 'marketing', 'hr', 'sales', 'operations', 'finance', 'other'].map(d => (
                                                <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Type <span className="text-destructive">*</span></Label>
                                    <Select value={formEmp?.employee_type || ''} onValueChange={(v) => setFormEmp({ ...formEmp, employee_type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['full-time', 'part-time', 'intern', 'contract'].map(t => (
                                                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Profile Picture</Label>
                                {formEmp?.user?.avatar ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={formEmp.user.avatar.startsWith('http') ? formEmp.user.avatar : `${BACKEND_URL}/${formEmp.user.avatar}`} />
                                            <AvatarFallback>PP</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs truncate flex-1">{formEmp.user.avatar.split(/[/\\]/).pop()}</span>
                                        <label className="text-xs text-primary cursor-pointer hover:underline shrink-0">
                                            Replace
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'edit', 'avatar')} />
                                        </label>
                                    </div>
                                ) : (
                                    <label
                                        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={(e) => handleDrop(e, 'edit', 'avatar')}
                                    >
                                        <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {uploading ? 'Uploading...' : 'Profile Picture (Click or Drag)'}
                                        </span>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'edit', 'avatar')} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label>Documents</Label>
                                {formEmp?.documents ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-xs truncate flex-1">{formEmp.documents.split(/[/\\]/).pop()}</span>
                                        <label className="text-xs text-primary cursor-pointer hover:underline shrink-0">
                                            Replace
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleFileChange(e, 'edit', 'documents')} />
                                        </label>
                                    </div>
                                ) : (
                                    <label
                                        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={(e) => handleDrop(e, 'edit', 'documents')}
                                    >
                                        <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {uploading ? 'Uploading...' : 'Documents (Click or Drag)'}
                                        </span>
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleFileChange(e, 'edit', 'documents')} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Add Employee */}
            < Dialog open={showNewDialog} onOpenChange={setShowNewDialog} >
                <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Add Employee</DialogTitle>
                        <DialogDescription>Create an employee login and profile.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">User (Login)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>First Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={newEmp.user.first_name}
                                            onChange={(e) => setNewEmp({ ...newEmp, user: { ...newEmp.user, first_name: e.target.value } })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Last Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={newEmp.user.last_name}
                                            onChange={(e) => setNewEmp({ ...newEmp, user: { ...newEmp.user, last_name: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Email <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="email"
                                            value={newEmp.user.email}
                                            onChange={(e) => setNewEmp({ ...newEmp, user: { ...newEmp.user, email: e.target.value } })}
                                            placeholder="employee@company.com"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={newEmp.user.phone}
                                            onChange={(e) => setNewEmp({ ...newEmp, user: { ...newEmp.user, phone: e.target.value } })}
                                            placeholder="+91 ..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Password <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="password"
                                            value={newEmp.user.password}
                                            onChange={(e) => setNewEmp({ ...newEmp, user: { ...newEmp.user, password: e.target.value } })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Confirm Password <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="password"
                                            value={newEmp.user.confirm_password}
                                            onChange={(e) => setNewEmp({ ...newEmp, user: { ...newEmp.user, confirm_password: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <h3 className="text-sm font-semibold text-muted-foreground">Employee Profile</h3>
                                <div className="grid gap-2">
                                    <Label>Designation <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={newEmp.employee.designation}
                                        onChange={(e) => setNewEmp({ ...newEmp, employee: { ...newEmp.employee, designation: e.target.value } })}
                                        placeholder="e.g. Full Stack Developer"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2"><Label>Department <span className="text-destructive">*</span></Label>
                                        <Select value={newEmp.employee.department} onValueChange={(v) => setNewEmp({ ...newEmp, employee: { ...newEmp.employee, department: v } })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['engineering', 'design', 'marketing', 'hr', 'sales', 'operations', 'finance', 'other'].map(d => (
                                                    <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2"><Label>Type <span className="text-destructive">*</span></Label>
                                        <Select value={newEmp.employee.employee_type} onValueChange={(v) => setNewEmp({ ...newEmp, employee: { ...newEmp.employee, employee_type: v } })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['full-time', 'part-time', 'intern', 'contract'].map(t => (
                                                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date of Joining <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="date"
                                        value={newEmp.employee.date_of_joining}
                                        onChange={(e) => setNewEmp({ ...newEmp, employee: { ...newEmp.employee, date_of_joining: e.target.value } })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Profile Picture</Label>
                                    {newEmp.user.avatar ? (
                                        <div className="flex items-center gap-2 rounded-md border p-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={`${BACKEND_URL}/${newEmp.user.avatar}`} />
                                                <AvatarFallback>PP</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs truncate flex-1">{newEmp.user.avatar.split(/[/\\]/).pop()}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setNewEmp({ ...newEmp, user: { ...newEmp.user, avatar: '' } })}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label
                                            className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={(e) => handleDrop(e, 'new', 'avatar')}
                                        >
                                            <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {uploading ? 'Uploading...' : 'Profile Picture (Click or Drag)'}
                                            </span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'new', 'avatar')} disabled={uploading} />
                                        </label>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label>Documents (Resume/Offer Letter)</Label>
                                    {newEmp.employee.documents ? (
                                        <div className="flex items-center gap-2 rounded-md border p-2">
                                            <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <span className="text-xs truncate flex-1">{newEmp.employee.documents.split(/[/\\]/).pop()}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setNewEmp({ ...newEmp, employee: { ...newEmp.employee, documents: '' } })}>
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <label
                                            className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={(e) => handleDrop(e, 'new', 'documents')}
                                        >
                                            <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                            <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {uploading ? 'Uploading...' : 'Documents (Click or Drag)'}
                                            </span>
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => handleFileChange(e, 'new', 'documents')} disabled={uploading} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate}>Add Employee</Button></DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Assign Projects Dialog */}
            < Dialog open={!!assignEmp} onOpenChange={() => setAssignEmp(null)}>
                <DialogContent className="sm:max-w-[550px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Assign Projects</DialogTitle>
                        <DialogDescription>
                            Select projects to assign to {assignEmp?.user?.first_name} {assignEmp?.user?.last_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="space-y-3">
                            <Input
                                placeholder="Search projects..."
                                value={projectSearch}
                                onChange={(e) => setProjectSearch(e.target.value)}
                            />
                            <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                                {allProjects
                                    .filter(p =>
                                        p.project_name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                        p.project_uid?.toLowerCase().includes(projectSearch.toLowerCase())
                                    )
                                    .map((project) => {
                                        const isSelected = selectedProjectIds.includes(project.id);
                                        return (
                                            <div
                                                key={project.id}
                                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => toggleProject(project.id)}
                                            >
                                                <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                                                    }`}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{project.project_name}</div>
                                                    <div className="text-xs text-muted-foreground">{project.project_uid}</div>
                                                </div>
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                    {project.status?.replace(/_/g, ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                {allProjects.filter(p =>
                                    p.project_name?.toLowerCase().includes(projectSearch.toLowerCase()) ||
                                    p.project_uid?.toLowerCase().includes(projectSearch.toLowerCase())
                                ).length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground text-sm">No projects found.</div>
                                    )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {selectedProjectIds.length} project{selectedProjectIds.length !== 1 ? 's' : ''} selected
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignEmp(null)}>Cancel</Button>
                        <Button onClick={handleAssignProjects} disabled={assignLoading}>
                            {assignLoading ? 'Saving...' : 'Save Assignments'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    );
}
