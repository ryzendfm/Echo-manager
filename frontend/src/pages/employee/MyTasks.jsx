import { useState, useEffect } from "react";
import { taskApi } from "@/api/taskApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, ListTodo, Filter, CheckCircle2 } from "lucide-react";

export default function MyTasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewTask, setViewTask] = useState(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await taskApi.getMyTasks();
            setTasks(res.data.tasks || []);
        } catch (err) {
            console.error("Failed to fetch tasks:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await taskApi.updateStatus(taskId, newStatus);
            toast.success("Task status updated");
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update status");
        }
    };

    const getStatusColor = (s) => {
        const m = {
            todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            in_review: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        return m[s] || "";
    };

    const getPriorityColor = (p) => {
        const m = {
            low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        return m[p] || "";
    };

    const statusOptions = [
        { value: "todo", label: "To Do" },
        { value: "in_progress", label: "In Progress" },
        { value: "in_review", label: "In Review" },
        { value: "completed", label: "Completed" },
        { value: "blocked", label: "Blocked" },
    ];

    const filtered = tasks.filter((t) => {
        const matchSearch =
            t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.task_uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
        let matchStatus;
        if (statusFilter === "all") matchStatus = true;
        else if (statusFilter === "completed") matchStatus = t.status === "completed";
        else if (statusFilter === "incomplete") matchStatus = t.status !== "completed";
        else matchStatus = t.status === statusFilter;
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                <p className="text-muted-foreground">Tasks assigned to you across all projects.</p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                        {statusOptions.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">Loading tasks...</div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <ListTodo className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No tasks found.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="space-y-3 sm:hidden">
                        {filtered.map((t) => (
                            <div key={t.id} className="rounded-lg border bg-card p-3 space-y-1.5 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setViewTask(t)}>
                                <div className="flex-1">
                                    <div className={`font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                                    <div className="text-xs text-muted-foreground">{t.task_uid}</div>
                                    {t.project_name && <div className="text-xs text-muted-foreground mt-0.5">{t.project_name}</div>}
                                </div>
                                {t.description && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 whitespace-pre-wrap">{t.description}</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={getPriorityColor(t.priority)}>{t.priority?.toUpperCase()}</Badge>
                                    <Badge variant="outline" className={getStatusColor(t.status)}>
                                        {statusOptions.find(o => o.value === t.status)?.label || t.status?.replace(/_/g, ' ').toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-muted-foreground">Due: {t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '—'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <Card className="hidden sm:block">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((t) => (
                                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewTask(t)}>
                                            <TableCell>
                                                <div>
                                                    <div className={`font-medium ${t.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{t.title}</div>
                                                    <div className="text-xs text-muted-foreground">{t.task_uid}</div>
                                                    {t.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate" title={t.description}>{t.description}</p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{t.project_name || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getPriorityColor(t.priority)}>{t.priority?.toUpperCase()}</Badge>
                                            </TableCell>
                                            <TableCell>{t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(t.status)}>
                                                    {statusOptions.find(o => o.value === t.status)?.label || t.status?.replace(/_/g, ' ').toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* View Task Dialog */}
            <Dialog open={!!viewTask} onOpenChange={() => setViewTask(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewTask?.title}</DialogTitle>
                        <DialogDescription>{viewTask?.task_uid}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={getStatusColor(viewTask?.status)}>{statusOptions.find(o => o.value === viewTask?.status)?.label || viewTask?.status?.replace(/_/g, ' ').toUpperCase()}</Badge></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Priority</span><Badge variant="outline" className={getPriorityColor(viewTask?.priority)}>{viewTask?.priority?.toUpperCase()}</Badge></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Project</span><span>{viewTask?.project_name || '—'}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Due Date</span><span>{viewTask?.due_date ? new Date(viewTask.due_date).toLocaleDateString('en-IN') : '—'}</span></div>
                            {viewTask?.description && (
                                <div className="grid gap-1 mt-2">
                                    <span className="text-muted-foreground">Description</span>
                                    <p className="text-sm border bg-card rounded-md p-3 whitespace-pre-wrap">{viewTask.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    {viewTask?.status !== 'completed' && (
                        <DialogFooter className="mt-4">
                            <Button
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                    handleStatusChange(viewTask.id, 'completed');
                                    setViewTask(null);
                                }}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Completed
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
