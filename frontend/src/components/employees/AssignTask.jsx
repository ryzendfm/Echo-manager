import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ClipboardList, Users, ListTodo, Calendar, Flag, FolderOpen, Clock, ArrowLeft } from "lucide-react";
import { employeeApi } from "@/api/employeeApi";
import { taskApi } from "@/api/taskApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

export default function AssignTask() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState([]);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [form, setForm] = useState({
        project_id: "",
        title: "",
        description: "",
        priority: "medium",
    });

    // Task history & detail states
    const [showTaskHistory, setShowTaskHistory] = useState(false);
    const [taskHistory, setTaskHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await employeeApi.getAll();
            setEmployees(res.data.employees || []);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (empId) => {
        setSelectedIds((prev) =>
            prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map((e) => e.id));
        }
    };

    const openAssignDialog = async () => {
        setShowAssignDialog(true);
        setLoadingProjects(true);
        setForm({ project_id: "", title: "", description: "", priority: "medium" });

        try {
            if (selectedIds.length === 1) {
                const res = await employeeApi.getProjects(selectedIds[0]);
                setProjects(res.data.projects || []);
            } else {
                const res = await taskApi.getCommonProjects(selectedIds);
                setProjects(res.data.projects || []);
            }
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const openTaskHistory = async () => {
        setShowTaskHistory(true);
        setLoadingHistory(true);
        setSelectedTask(null);

        try {
            const res = await taskApi.getAll();
            setTaskHistory(res.data.tasks || []);
        } catch (err) {
            console.error("Failed to fetch task history:", err);
            setTaskHistory([]);
            toast.error("Failed to fetch assigned tasks");
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAssign = async () => {
        if (!form.project_id || !form.title) {
            toast.error("Please select a project and enter a task title");
            return;
        }

        try {
            await taskApi.assignBulk({
                employee_ids: selectedIds,
                project_id: Number(form.project_id),
                title: form.title,
                description: form.description,
                priority: form.priority,
            });
            toast.success(`Task assigned to ${selectedIds.length} employee(s)`);
            setShowAssignDialog(false);
            setSelectedIds([]);
        } catch (err) {
            console.error("Failed to assign task:", err);
            toast.error("Failed to assign task");
        }
    };

    const getStatusColor = (status) => {
        const m = {
            todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
            in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            in_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            blocked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        return m[status] || "";
    };

    const priorityOptions = [
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
    ];

    const filtered = employees.filter((e) => {
        const name = `${e.user?.first_name || ""} ${e.user?.last_name || ""}`.toLowerCase();
        const uid = e.employee_uid?.toLowerCase() || "";
        return name.includes(searchTerm.toLowerCase()) || uid.includes(searchTerm.toLowerCase());
    });

    // Get employee name for history dialog header
    const getSelectedEmployeeName = () => {
        if (selectedIds.length !== 1) return "";
        const emp = employees.find((e) => e.id === selectedIds[0]);
        if (!emp) return "";
        return `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.trim();
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 sm:top-1/2 sm:-translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 h-9 sm:h-10 text-xs sm:text-sm"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={openTaskHistory}
                        className="flex-1 sm:flex-none"
                    >
                        <ListTodo className="mr-2 h-4 w-4" />
                        Assigned Tasks
                    </Button>
                    <Button
                        onClick={openAssignDialog}
                        disabled={selectedIds.length === 0}
                        className="flex-1 sm:flex-none"
                    >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Assign Task {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </Button>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedIds.length}</span>
                    <span className="text-muted-foreground">employee(s) selected</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 text-xs"
                        onClick={() => setSelectedIds([])}
                    >
                        Clear
                    </Button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">Loading employees...</div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>No employees found.</p>
                </div>
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="space-y-2 sm:hidden">
                        {filtered.map((emp) => {
                            const isSelected = selectedIds.includes(emp.id);
                            const name = `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.trim();
                            return (
                                <div
                                    key={emp.id}
                                    onClick={() => toggleSelect(emp.id)}
                                    className={`rounded-lg border p-3 flex items-center gap-3 cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5 dark:bg-primary/10" : "bg-card"
                                        }`}
                                >
                                    <Checkbox
                                        checked={isSelected}
                                        className="shrink-0"
                                        onCheckedChange={() => toggleSelect(emp.id)}
                                    />
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={emp.user?.avatar ? `${BACKEND_URL}/${emp.user.avatar}` : undefined} />
                                        <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{name || "—"}</div>
                                        <div className="text-xs text-muted-foreground">{emp.employee_uid} · {emp.designation}</div>
                                    </div>
                                    <Badge variant="outline" className="shrink-0 capitalize text-xs">
                                        {emp.department}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden sm:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedIds.length === filtered.length && filtered.length > 0}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map((emp) => {
                                    const isSelected = selectedIds.includes(emp.id);
                                    const name = `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.trim();
                                    return (
                                        <TableRow
                                            key={emp.id}
                                            className={`cursor-pointer ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                                            onClick={() => toggleSelect(emp.id)}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleSelect(emp.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={emp.user?.avatar ? `${BACKEND_URL}/${emp.user.avatar}` : undefined} />
                                                        <AvatarFallback>{name?.charAt(0) || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{name || "—"}</div>
                                                        <div className="text-xs text-muted-foreground">{emp.employee_uid}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{emp.designation}</TableCell>
                                            <TableCell className="capitalize">{emp.department}</TableCell>
                                            <TableCell className="capitalize">{emp.employee_type?.replace("-", " ")}</TableCell>
                                            <TableCell>
                                                <Badge variant={emp.is_active ? "default" : "secondary"}>
                                                    {emp.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* Assign Task Dialog */}
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Assign Task</DialogTitle>
                        <DialogDescription>
                            Assign a task to {selectedIds.length} selected employee{selectedIds.length > 1 ? "s" : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label>Project <span className="text-destructive">*</span></Label>
                                {loadingProjects ? (
                                    <div className="text-sm text-muted-foreground py-2">Loading projects...</div>
                                ) : projects.length === 0 ? (
                                    <div className="text-sm text-muted-foreground py-2 border rounded-md px-3">
                                        No common projects found. Assign projects to these employees first.
                                    </div>
                                ) : (
                                    <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {projects.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.project_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label>Task Title <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="Enter task title"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Priority</Label>
                                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {priorityOptions.map((p) => (
                                            <SelectItem key={p.value} value={p.value}>
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Describe the task..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
                        <Button onClick={handleAssign} disabled={!form.project_id || !form.title}>
                            Assign Task
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task History Dialog */}
            <Dialog open={showTaskHistory} onOpenChange={(open) => { setShowTaskHistory(open); if (!open) setSelectedTask(null); }}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] h-[85vh] sm:h-auto flex flex-col overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            <ListTodo className="h-5 w-5" />
                            Assigned Tasks
                        </DialogTitle>
                        <DialogDescription>
                            All assigned task history — {taskHistory.length} task(s) total
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                Loading tasks...
                            </div>
                        ) : taskHistory.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <ClipboardList className="h-10 w-10 mb-3 opacity-50" />
                                <p>No tasks assigned yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 pb-2 pr-1">
                                {taskHistory.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        className="rounded-lg border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{task.title}</div>
                                                <div className="text-xs text-muted-foreground">{task.task_uid}</div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                                <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                                                    {task.status?.replace(/_/g, " ").toUpperCase()}
                                                </Badge>
                                                <Badge
                                                    variant={task.priority === "high" || task.priority === "urgent" ? "destructive" : "secondary"}
                                                    className="text-xs"
                                                >
                                                    {task.priority?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            {task.assignee_name && (
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {task.assignee_name}
                                                </span>
                                            )}
                                            {task.project_name && (
                                                <span className="flex items-center gap-1">
                                                    <FolderOpen className="h-3 w-3" />
                                                    {task.project_name}
                                                </span>
                                            )}
                                            {task.due_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(task.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Task Detail Popup */}
            <Dialog open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null); }}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col overflow-hidden">
                    <DialogHeader className="shrink-0">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => setSelectedTask(null)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-0">
                                <DialogTitle className="truncate">{selectedTask?.title}</DialogTitle>
                                <DialogDescription>{selectedTask?.task_uid}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant="outline" className={getStatusColor(selectedTask?.status)}>
                                    {selectedTask?.status?.replace(/_/g, " ").toUpperCase()}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Priority</span>
                                <Badge variant={selectedTask?.priority === "high" || selectedTask?.priority === "urgent" ? "destructive" : "secondary"}>
                                    {selectedTask?.priority?.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Project</span>
                                <span>{selectedTask?.project_name || "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Assignee</span>
                                <span>{selectedTask?.assignee_name || "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Due Date</span>
                                <span>{selectedTask?.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Created</span>
                                <span>{selectedTask?.created_at ? new Date(selectedTask.created_at).toLocaleString() : "—"}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-muted-foreground">Updated</span>
                                <span>{selectedTask?.updated_at ? new Date(selectedTask.updated_at).toLocaleString() : "—"}</span>
                            </div>
                            {selectedTask?.description && (
                                <div className="grid gap-1 pt-1">
                                    <span className="text-muted-foreground">Description</span>
                                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{selectedTask.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
