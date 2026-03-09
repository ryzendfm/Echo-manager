import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Search, Filter } from "lucide-react";
import { taskApi } from "@/api/taskApi";
import { toast } from "sonner";

export default function TaskList({ projectId = null, role = "admin" }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewTask, setViewTask] = useState(null);
    const [editTask, setEditTask] = useState(null);
    const [formTask, setFormTask] = useState(null);
    const [deleteTask, setDeleteTask] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', project_id: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' });
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => { fetchTasks(); }, [projectId]);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            let res;
            if (projectId) {
                res = await taskApi.getByProject(projectId);
            } else {
                res = await taskApi.getAll();
            }
            setTasks(res.data.tasks || []);
        } catch (err) { console.error("Failed to fetch tasks:", err); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        try {
            await taskApi.create(newTask);
            toast.success("Task created");
            setShowNewDialog(false);
            setNewTask({ title: '', project_id: '', assigned_to: '', status: 'todo', priority: 'medium', due_date: '' });
            fetchTasks();
        } catch (err) { toast.error("Failed to create task"); }
    };

    const handleEdit = async () => {
        try {
            await taskApi.update(formTask.id, formTask);
            toast.success("Task updated");
            setEditTask(null);
            fetchTasks();
        } catch (err) { toast.error("Failed to update task"); }
    };

    const handleDelete = async () => {
        try {
            await taskApi.delete(deleteTask.id);
            toast.success("Task deleted");
            setDeleteTask(null);
            fetchTasks();
        } catch (err) { toast.error("Failed to delete task"); }
    };

    const getStatusColor = (status) => {
        const m = { todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", in_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", blocked: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
        return m[status] || "";
    };

    const filteredTasks = tasks.filter(t => {
        const matchSearch = t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.task_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" ||
            (statusFilter === "completed" && t.status === "completed") ||
            (statusFilter === "incomplete" && t.status !== "completed");
        return matchSearch && matchStatus;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search tasks..." className="w-full pl-8"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                </Select>
                <Button className="w-full sm:w-auto" onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4" />Add Task</Button>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No tasks found.</div>
                ) : (
                    filteredTasks.map((task) => (
                        <div key={task.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <Checkbox className="mt-0.5 shrink-0" checked={task.status === 'completed'} onCheckedChange={async (checked) => {
                                        try { await taskApi.update(task.id, { status: checked ? 'completed' : 'todo' }); toast.success(checked ? 'Task completed' : 'Task reopened'); fetchTasks(); } catch { toast.error('Failed to update'); }
                                    }} />
                                    <div>
                                        <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</div>
                                        <div className="text-xs text-muted-foreground">{task.task_uid}</div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setViewTask(task)}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setEditTask(task); setFormTask({ ...task }); }}>Edit Task</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTask(task)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={getStatusColor(task.status)}>{task.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                                <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'secondary'}>{task.priority?.toUpperCase()}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'} {task.assignee_name ? `· ${task.assignee_name}` : ''}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Assignee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Loading tasks...</TableCell></TableRow>
                        ) : filteredTasks.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No tasks found.</TableCell></TableRow>
                        ) : (
                            filteredTasks.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell>
                                        <Checkbox checked={task.status === 'completed'} onCheckedChange={async (checked) => {
                                            try {
                                                await taskApi.update(task.id, { status: checked ? 'completed' : 'todo' });
                                                toast.success(checked ? "Task completed" : "Task reopened");
                                                fetchTasks();
                                            } catch { toast.error("Failed to update"); }
                                        }} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                                            <span className="text-xs text-muted-foreground">{task.task_uid}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{task.assignee_name || '—'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(task.status)}>
                                            {task.status?.replace(/_/g, ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={task.priority === "high" || task.priority === "urgent" ? "destructive" : "secondary"}>
                                            {task.priority?.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewTask(task)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditTask(task); setFormTask({ ...task }); }}>Edit Task</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTask(task)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Task */}
            <Dialog open={!!viewTask} onOpenChange={() => setViewTask(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewTask?.title}</DialogTitle>
                        <DialogDescription>{viewTask?.task_uid}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={getStatusColor(viewTask?.status)}>{viewTask?.status?.replace(/_/g, ' ').toUpperCase()}</Badge></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Priority</span><Badge variant={viewTask?.priority === "high" || viewTask?.priority === "urgent" ? "destructive" : "secondary"}>{viewTask?.priority?.toUpperCase()}</Badge></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Project</span><span>{viewTask?.project_name || '—'}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Assignee</span><span>{viewTask?.assignee_name || '—'}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Due Date</span><span>{viewTask?.due_date ? new Date(viewTask.due_date).toLocaleDateString() : '—'}</span></div>
                            {viewTask?.description && (
                                <div className="grid gap-1">
                                    <span className="text-muted-foreground">Description</span>
                                    <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{viewTask.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Task */}
            <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2"><Label>Title <span className="text-destructive">*</span></Label><Input value={formTask?.title || ''} onChange={(e) => setFormTask({ ...formTask, title: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Status <span className="text-destructive">*</span></Label>
                                    <Select value={formTask?.status || ''} onValueChange={(v) => setFormTask({ ...formTask, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['todo', 'in_progress', 'in_review', 'completed', 'blocked'].map(s => (
                                                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Priority <span className="text-destructive">*</span></Label>
                                    <Select value={formTask?.priority || ''} onValueChange={(v) => setFormTask({ ...formTask, priority: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['low', 'medium', 'high', 'urgent'].map(p => (
                                                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={formTask?.due_date || ''} onChange={(e) => setFormTask({ ...formTask, due_date: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Task */}
            <Dialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
                <DialogContent className="sm:max-w-[400px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>Are you sure you want to delete <strong>{deleteTask?.title}</strong>?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTask(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Task */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2"><Label>Title <span className="text-destructive">*</span></Label><Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Project ID</Label><Input type="number" value={newTask.project_id} onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })} /></div>
                                <div className="grid gap-2"><Label>Assigned To (Emp ID)</Label><Input type="number" value={newTask.assigned_to} onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Priority <span className="text-destructive">*</span></Label>
                                    <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['low', 'medium', 'high', 'urgent'].map(p => (
                                                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Due Date</Label><Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} /></div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate}>Create Task</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
