import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Search, Filter, Check, Users, Upload, X, FileText } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import { projectApi } from "@/api/projectApi";
import { projectPhaseApi } from "@/api/projectPhaseApi";
import api, { BACKEND_URL } from "@/api/axiosInstance";
import { clientApi } from "@/api/clientApi";
import { employeeApi } from "@/api/employeeApi";
import { invoiceApi } from "@/api/invoiceApi";
import { toast } from "sonner";
import ProjectDetailDialog from "./ProjectDetailDialog";

export default function ProjectList({ role }) {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [viewProject, setViewProject] = useState(null);
    const [detailProjectId, setDetailProjectId] = useState(null);
    const [editProject, setEditProject] = useState(null);
    const [deleteProject, setDeleteProject] = useState(null);
    const [formProject, setFormProject] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newProject, setNewProject] = useState({
        project_name: '', client_id: '', status: 'planning', priority: 'medium',
        budget_estimated: '', total_budget: '', deadline: '', description: '', tech_stack: [], file_attachments: '',
        phases: [{ phase_name: 'Phase 1', phase_amount: '', phase_description: '' }, { phase_name: 'Phase 2', phase_amount: '', phase_description: '' }, { phase_name: 'Phase 3', phase_amount: '', phase_description: '' }]
    });

    // Assign employees state
    const [allEmployees, setAllEmployees] = useState([]);
    const [assignProject, setAssignProject] = useState(null);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [empSearch, setEmpSearch] = useState("");

    // File upload state
    const [newFile, setNewFile] = useState(null); // File object (for display)
    const [newFileTempPath, setNewFileTempPath] = useState(null); // String path (for API)
    const [editFile, setEditFile] = useState(null);
    const [editFileTempPath, setEditFileTempPath] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Project Invoices State
    const [projectInvoices, setProjectInvoices] = useState([]);
    const [invLoading, setInvLoading] = useState(false);

    useEffect(() => { fetchProjects(); fetchClients(); fetchAllEmployees(); }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await projectApi.getAll();
            setProjects(res.data.projects || []);
        } catch (err) { console.error("Failed to fetch projects:", err); }
        finally { setLoading(false); }
    };

    const fetchClients = async () => {
        try {
            const res = await clientApi.getAll();
            setClients(res.data.clients || []);
        } catch (err) { console.error("Failed to fetch clients:", err); }
    };

    const fetchAllEmployees = async () => {
        try {
            const res = await employeeApi.getAll();
            setAllEmployees(res.data.employees || []);
        } catch (err) { console.error("Failed to fetch employees:", err); }
    };

    const openAssignEmpDialog = async (project) => {
        setAssignProject(project);
        setEmpSearch("");
        try {
            const res = await projectApi.getProjectEmployees(project.id);
            setSelectedEmployeeIds((res.data.employees || []).map(e => e.id));
        } catch {
            setSelectedEmployeeIds([]);
        }
    };

    const toggleEmployee = (empId) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(empId)
                ? prev.filter(id => id !== empId)
                : [...prev, empId]
        );
    };

    const handleAssignEmployees = async () => {
        try {
            setAssignLoading(true);
            await projectApi.assignProjectEmployees(assignProject.id, selectedEmployeeIds);
            toast.success(`Employees assigned to ${assignProject.project_name}`);
            setAssignProject(null);
        } catch (err) {
            toast.error("Failed to assign employees");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await uploadFile(e.dataTransfer.files[0], type);
        }
    };

    const uploadFile = async (file, type) => {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            // Use the shared axios instance — carries auth token and correct host URL
            const res = await api.post('/upload/temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data;

            if (data.success) {
                if (type === 'new') {
                    setNewFile(file);
                    setNewFileTempPath(data.tempPath);
                } else {
                    setEditFile(file);
                    setEditFileTempPath(data.tempPath);
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

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        await uploadFile(file, type);
    };

    const handleCreate = async () => {
        if (!newProject.project_name?.trim()) { toast.error('Project name is required'); return; }
        if (!newProject.client_id) { toast.error('Please select a client'); return; }
        try {
            const payload = {
                project_name: newProject.project_name.trim(),
                client_id: newProject.client_id,
                status: newProject.status || 'planning',
                priority: newProject.priority || 'medium',
                budget_estimated: newProject.budget_estimated ? Number(newProject.budget_estimated) : 0,
                total_budget: newProject.total_budget ? Number(newProject.total_budget) : 0,
                deadline: newProject.deadline || null,
                description: newProject.description || '',
                tech_stack: JSON.stringify(newProject.tech_stack || []),
                file_attachments: newFileTempPath || '',
            };

            const res = await projectApi.create(payload);
            const createdProject = res.data.project;

            // Save phases if any
            const validPhases = (newProject.phases || []).filter(p => p.phase_name?.trim());
            if (validPhases.length > 0 && createdProject?.id) {
                await projectPhaseApi.savePhases(createdProject.id, validPhases);
            }

            toast.success("Project created");
            setShowNewDialog(false);
            setNewFile(null);
            setNewFileTempPath(null);
            setNewProject({ project_name: '', client_id: '', status: 'planning', priority: 'medium', budget_estimated: '', total_budget: '', deadline: '', description: '', tech_stack: [], file_attachments: '', phases: [{ phase_name: 'Phase 1', phase_amount: '', phase_description: '' }, { phase_name: 'Phase 2', phase_amount: '', phase_description: '' }, { phase_name: 'Phase 3', phase_amount: '', phase_description: '' }] });
            fetchProjects();
        } catch (err) { toast.error("Failed to create project: " + (err.response?.data?.message || err.message)); }
    };

    const handleEdit = async () => {
        try {
            const formData = {
                project_name: formProject.project_name,
                status: formProject.status,
                priority: formProject.priority,
                budget_estimated: formProject.budget_estimated,
                total_budget: formProject.total_budget || 0,
                deadline: formProject.deadline || '',
                description: formProject.description || '',
                tech_stack: JSON.stringify(Array.isArray(formProject.tech_stack) ? formProject.tech_stack : []),
                file_attachments: editFileTempPath || formProject.file_attachments
            };

            await projectApi.update(formProject.id, formData);

            // Save phases if present
            const validPhases = (formProject.phases || []).filter(p => p.phase_name?.trim());
            if (validPhases.length > 0) {
                await projectPhaseApi.savePhases(formProject.id, validPhases);
            }

            toast.success("Project updated");
            setEditProject(null);
            setEditFile(null);
            setEditFileTempPath(null);
            fetchProjects();
        } catch (err) { toast.error("Failed to update project: " + (err.response?.data?.message || err.message)); }
    };

    const handleDelete = async () => {
        try {
            await projectApi.delete(deleteProject.id);
            toast.success("Project deleted");
            setDeleteProject(null);
            fetchProjects();
        } catch (err) { toast.error("Failed to delete project"); }
    };

    const getStatusColor = (status) => {
        const m = { in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", planning: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
        return m[status] || "";
    };

    const getPriorityColor = (p) => {
        const m = { urgent: "text-red-600 font-bold", high: "text-orange-600 font-semibold", medium: "text-yellow-600", low: "text-green-600" };
        return m[p] || "";
    };

    const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

    const filteredProjects = projects.filter(p => {
        const matchesSearch = p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.project_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || p.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search projects..." className="w-full pl-8"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[135px]">
                            <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {role === "admin" && <Button className="w-full sm:w-auto" onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4" />New Project</Button>}
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No projects found.</div>
                ) : (
                    filteredProjects.map((p) => (
                        <div key={p.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => setDetailProjectId(p.id)}>{p.project_name}</span>
                                    <div className="text-xs text-muted-foreground">{p.project_uid}</div>
                                    {p.Client && (
                                        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                                            Client: <span className="font-medium text-foreground">{p.Client.company_name}</span>
                                        </div>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setDetailProjectId(p.id)}>View Details</DropdownMenuItem>
                                        {role === "admin" && <>
                                            <DropdownMenuItem onClick={async () => { try { const res = await projectApi.getById(p.id); const proj = res.data.project; let phases = []; try { const pRes = await projectPhaseApi.getPhases(p.id); phases = pRes.data.phases || []; } catch {} setEditProject(p); setFormProject({ ...proj, description: proj.description || '', tech_stack: proj.tech_stack || '', file_attachments: proj.file_attachments || '', total_budget: proj.total_budget || '', phases: phases.length > 0 ? phases.map(ph => ({ id: ph.id, phase_name: ph.phase_name, phase_amount: ph.phase_amount, phase_description: ph.phase_description || '' })) : [{ phase_name: 'Phase 1', phase_amount: '', phase_description: '' }] }); } catch { setEditProject(p); setFormProject({ ...p, total_budget: p.total_budget || '', phases: [{ phase_name: 'Phase 1', phase_amount: '', phase_description: '' }] }); } }}>Edit Project</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => openAssignEmpDialog(p)}>Assign Employees</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProject(p)}>Delete</DropdownMenuItem>
                                        </>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={getStatusColor(p.status)}>{p.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                                <Badge variant="outline" className={getPriorityColor(p.priority)}>{p.priority?.toUpperCase()}</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Budget: {fmt(p.total_budget || p.budget_estimated || 0)}</span>
                                <span>Due: {p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Deadline</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading projects...</TableCell></TableRow>
                        ) : filteredProjects.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No projects found.</TableCell></TableRow>
                        ) : (
                            filteredProjects.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => setDetailProjectId(p.id)}>{p.project_name}</span>
                                            <span className="text-xs text-muted-foreground">{p.project_uid}</span>
                                            {p.Client && (
                                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                                    Client: <span className="font-medium text-foreground">{p.Client.company_name}</span>
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(p.status)}>
                                            {p.status?.replace(/_/g, ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={`capitalize ${getPriorityColor(p.priority)}`}>{p.priority}</TableCell>
                                    <TableCell>{fmt(p.total_budget || p.budget_estimated || 0)}</TableCell>
                                    <TableCell>{p.deadline ? new Date(p.deadline).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setDetailProjectId(p.id)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={async () => {
                                                    try {
                                                        const res = await projectApi.getById(p.id);
                                                        const proj = res.data.project;
                                                        let phases = [];
                                                        try { const pRes = await projectPhaseApi.getPhases(p.id); phases = pRes.data.phases || []; } catch {}
                                                        setEditProject(p);
                                                        setFormProject({
                                                            ...proj,
                                                            description: proj.description || '',
                                                            tech_stack: proj.tech_stack || '',
                                                            file_attachments: proj.file_attachments || '',
                                                            total_budget: proj.total_budget || '',
                                                            phases: phases.length > 0 ? phases.map(ph => ({ id: ph.id, phase_name: ph.phase_name, phase_amount: ph.phase_amount, phase_description: ph.phase_description || '' })) : [{ phase_name: 'Phase 1', phase_amount: '', phase_description: '' }],
                                                        });
                                                    } catch (err) {
                                                        setEditProject(p);
                                                        setFormProject({ ...p, description: p.description || '', tech_stack: p.tech_stack || '', file_attachments: p.file_attachments || '', total_budget: p.total_budget || '', phases: [{ phase_name: 'Phase 1', phase_amount: '', phase_description: '' }] });
                                                    }
                                                }}>Edit Project</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openAssignEmpDialog(p)}><Users className="mr-2 h-4 w-4" />Assign Employees</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteProject(p)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Dialog */}
            <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
                <DialogContent className="sm:max-w-[550px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewProject?.project_name}</DialogTitle>
                        <DialogDescription>{viewProject?.project_uid} — Project details overview.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={getStatusColor(viewProject?.status)}>{viewProject?.status?.replace(/_/g, ' ').toUpperCase()}</Badge></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Priority</span><span className={`capitalize ${getPriorityColor(viewProject?.priority)}`}>{viewProject?.priority}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Budget</span><span>{fmt(viewProject?.budget_estimated || 0)}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Deadline</span><span>{viewProject?.deadline ? new Date(viewProject.deadline).toLocaleDateString() : '—'}</span></div>
                            <div className="border-t pt-3 grid gap-1">
                                <span className="text-muted-foreground font-medium">Description</span>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{viewProject?.description || 'No description provided.'}</p>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-muted-foreground font-medium">Tech Stack</span>
                                <div className="flex flex-wrap gap-1">
                                    {viewProject?.tech_stack && (Array.isArray(viewProject.tech_stack) ? viewProject.tech_stack.length > 0 : viewProject.tech_stack)
                                        ? (Array.isArray(viewProject.tech_stack)
                                            ? viewProject.tech_stack.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)
                                            : <Badge variant="secondary" className="text-xs">{viewProject.tech_stack}</Badge>)
                                        : <span className="text-xs text-muted-foreground italic">None specified</span>}
                                </div>
                            </div>
                            <div className="grid gap-1">
                                <span className="text-muted-foreground font-medium">Attachments</span>
                                {viewProject?.file_attachments
                                    ? <a href={viewProject.file_attachments.startsWith('http') ? viewProject.file_attachments : `${BACKEND_URL}/${viewProject.file_attachments}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline text-xs truncate">
                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                        {viewProject.file_attachments.split('/').pop()}
                                    </a>
                                    : <span className="text-xs text-muted-foreground italic">No attachments</span>}
                            </div>

                            <div className="border-t pt-3 grid gap-2">
                                <span className="text-muted-foreground font-medium">Invoices</span>
                                {invLoading ? (
                                    <span className="text-xs text-muted-foreground">Loading invoices...</span>
                                ) : projectInvoices.length > 0 ? (
                                    <div className="border rounded-md overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="h-8 text-xs">ID</TableHead>
                                                    <TableHead className="h-8 text-xs text-right">Amount</TableHead>
                                                    <TableHead className="h-8 text-xs text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {projectInvoices.map(inv => (
                                                    <TableRow key={inv.id} className="h-8">
                                                        <TableCell className="py-1 text-xs">{inv.invoice_uid}</TableCell>
                                                        <TableCell className="py-1 text-xs text-right">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inv.total_amount || inv.amount)}</TableCell>
                                                        <TableCell className="py-1 text-xs text-right">
                                                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getStatusColor(inv.status)}`}>
                                                                {inv.status?.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No invoices found for this project.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>Update project details.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2"><Label>Project Name <span className="text-destructive">*</span></Label><Input value={formProject?.project_name || ''} onChange={(e) => setFormProject({ ...formProject, project_name: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Client <span className="text-destructive">*</span></Label>
                                <Select value={formProject?.client_id ? String(formProject.client_id) : ''} onValueChange={(v) => setFormProject({ ...formProject, client_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.company_name}{c.user ? ` (${c.user.first_name || ''} ${c.user.last_name || ''})`.replace(' ()', '') : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Status <span className="text-destructive">*</span></Label>
                                    <Select value={formProject?.status || ''} onValueChange={(v) => setFormProject({ ...formProject, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="planning">Planning</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="on_hold">On Hold</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Priority <span className="text-destructive">*</span></Label>
                                    <Select value={formProject?.priority || ''} onValueChange={(v) => setFormProject({ ...formProject, priority: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Total Planned Budget (₹)</Label><Input type="number" value={formProject?.total_budget || ''} onChange={(e) => setFormProject({ ...formProject, total_budget: e.target.value })} placeholder="Total agreed budget" /></div>
                                <div className="grid gap-2"><Label>Deadline</Label><Input type="date" value={formProject?.deadline || ''} onChange={(e) => setFormProject({ ...formProject, deadline: e.target.value })} /></div>
                            </div>

                            {/* Project Phases (names only — amounts set in project detail) */}
                            <div className="grid gap-2">
                                <Label>Project Phases</Label>
                                <div className="space-y-2">
                                    {(formProject?.phases || []).map((phase, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input placeholder={`Phase ${idx + 1} name`} value={phase.phase_name || ''} onChange={(e) => { const phases = [...(formProject.phases || [])]; phases[idx] = { ...phases[idx], phase_name: e.target.value }; setFormProject({ ...formProject, phases }); }} />
                                            {(formProject?.phases || []).length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => { const phases = (formProject.phases || []).filter((_, i) => i !== idx); setFormProject({ ...formProject, phases }); }}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setFormProject({ ...formProject, phases: [...(formProject.phases || []), { phase_name: `Phase ${(formProject.phases || []).length + 1}`, phase_amount: '', phase_description: '' }] })}>
                                        <Plus className="mr-1 h-3 w-3" /> Add Phase
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2"><Label>Description</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={formProject?.description || ''} onChange={(e) => setFormProject({ ...formProject, description: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Tech Stack</Label><TagInput value={Array.isArray(formProject?.tech_stack) ? formProject.tech_stack : (formProject?.tech_stack ? formProject.tech_stack.split(',').map(s => s.trim()).filter(Boolean) : [])} onChange={(tags) => setFormProject({ ...formProject, tech_stack: tags })} placeholder="Type and press Enter..." /></div>
                            <div className="grid gap-2">
                                <Label>Attachment</Label>
                                {editFile ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate flex-1">{editFile.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditFile(null)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : formProject?.file_attachments ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-xs text-muted-foreground truncate flex-1">Current: {formProject.file_attachments.split('/').pop()}</span>
                                        <label className="text-xs text-primary cursor-pointer hover:underline shrink-0">
                                            Replace
                                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => handleFileChange(e, 'edit')} />
                                        </label>
                                    </div>
                                ) : (
                                    <label
                                        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={(e) => handleDrop(e, 'edit')}
                                    >
                                        <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {uploading ? 'Uploading...' : dragActive ? 'Drop file here' : 'Click or Drag to upload (PDF, JPEG, PNG, DOCX)'}
                                        </span>
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => handleFileChange(e, 'edit')} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
                <DialogContent className="sm:max-w-[400px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>Are you sure you want to delete <strong>{deleteProject?.project_name}</strong>? This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteProject(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Project Dialog */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                        <DialogDescription>Create a new project.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2"><Label>Project Name <span className="text-destructive">*</span></Label><Input value={newProject.project_name} onChange={(e) => setNewProject({ ...newProject, project_name: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Client <span className="text-destructive">*</span></Label>
                                <Select value={newProject.client_id ? String(newProject.client_id) : ''} onValueChange={(v) => setNewProject({ ...newProject, client_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.company_name}{c.user ? ` (${c.user.first_name || ''} ${c.user.last_name || ''})`.replace(' ()', '') : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Status <span className="text-destructive">*</span></Label>
                                    <Select value={newProject.status || 'planning'} onValueChange={(v) => setNewProject({ ...newProject, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="planning">Planning</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="on_hold">On Hold</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Priority <span className="text-destructive">*</span></Label>
                                    <Select value={newProject.priority} onValueChange={(v) => setNewProject({ ...newProject, priority: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Total Planned Budget (₹) <span className="text-destructive">*</span></Label><Input type="number" value={newProject.total_budget} onChange={(e) => setNewProject({ ...newProject, total_budget: e.target.value })} placeholder="Total agreed budget" /></div>
                                <div className="grid gap-2"><Label>Deadline</Label><Input type="date" value={newProject.deadline} onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })} /></div>
                            </div>

                            {/* Project Phases (names only — amounts set in project detail) */}
                            <div className="grid gap-2">
                                <Label>Project Phases</Label>
                                <div className="space-y-2">
                                    {(newProject.phases || []).map((phase, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Input placeholder={`Phase ${idx + 1} name`} value={phase.phase_name} onChange={(e) => { const phases = [...newProject.phases]; phases[idx] = { ...phases[idx], phase_name: e.target.value }; setNewProject({ ...newProject, phases }); }} />
                                            {(newProject.phases || []).length > 1 && (
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => { const phases = newProject.phases.filter((_, i) => i !== idx); setNewProject({ ...newProject, phases }); }}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setNewProject({ ...newProject, phases: [...(newProject.phases || []), { phase_name: `Phase ${(newProject.phases || []).length + 1}`, phase_amount: '', phase_description: '' }] })}>
                                        <Plus className="mr-1 h-3 w-3" /> Add Phase
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-2"><Label>Description</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Tech Stack</Label><TagInput value={Array.isArray(newProject.tech_stack) ? newProject.tech_stack : []} onChange={(tags) => setNewProject({ ...newProject, tech_stack: tags })} placeholder="Type and press Enter..." /></div>
                            <div className="grid gap-2">
                                <Label>Attachment</Label>
                                {newFile ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate flex-1">{newFile.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setNewFile(null)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label
                                        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={(e) => handleDrop(e, 'new')}
                                    >
                                        <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {uploading ? 'Uploading...' : dragActive ? 'Drop file here' : 'Click or Drag to upload (PDF, JPEG, PNG, DOCX)'}
                                        </span>
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => handleFileChange(e, 'new')} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate}>Create Project</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Employees Dialog */}
            <Dialog open={!!assignProject} onOpenChange={() => setAssignProject(null)}>
                <DialogContent className="sm:max-w-[550px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Assign Employees</DialogTitle>
                        <DialogDescription>
                            Select employees to assign to <strong>{assignProject?.project_name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="space-y-3">
                            <Input
                                placeholder="Search employees..."
                                value={empSearch}
                                onChange={(e) => setEmpSearch(e.target.value)}
                            />
                            <div className="max-h-[300px] overflow-y-auto border rounded-md divide-y">
                                {allEmployees
                                    .filter(e =>
                                        e.user?.first_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                        e.user?.last_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                        e.employee_uid?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                        e.designation?.toLowerCase().includes(empSearch.toLowerCase())
                                    )
                                    .map((emp) => {
                                        const isSelected = selectedEmployeeIds.includes(emp.id);
                                        return (
                                            <div
                                                key={emp.id}
                                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                                onClick={() => toggleEmployee(emp.id)}
                                            >
                                                <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'
                                                    }`}>
                                                    {isSelected && <Check className="h-3 w-3" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">{emp.user?.first_name} {emp.user?.last_name}</div>
                                                    <div className="text-xs text-muted-foreground">{emp.employee_uid} • {emp.designation}</div>
                                                </div>
                                                <Badge variant="outline" className="text-xs shrink-0">
                                                    {emp.department?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                {allEmployees.filter(e =>
                                    e.user?.first_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                    e.user?.last_name?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                    e.employee_uid?.toLowerCase().includes(empSearch.toLowerCase())
                                ).length === 0 && (
                                        <div className="p-4 text-center text-muted-foreground text-sm">No employees found.</div>
                                    )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {selectedEmployeeIds.length} employee{selectedEmployeeIds.length !== 1 ? 's' : ''} selected
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignProject(null)}>Cancel</Button>
                        <Button onClick={handleAssignEmployees} disabled={assignLoading}>
                            {assignLoading ? 'Saving...' : 'Save Assignments'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Project Detail Dialog */}
            <ProjectDetailDialog projectId={detailProjectId} open={!!detailProjectId} onClose={() => setDetailProjectId(null)} />
        </div>
    );
}
