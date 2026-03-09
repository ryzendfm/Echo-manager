import { useState, useEffect } from "react";
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
import { MoreHorizontal, Plus, Search, FolderKanban, Check, Upload, X } from "lucide-react";
import { employeeApi } from "@/api/employeeApi";
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

    useEffect(() => { fetchEmployees(); fetchAllProjects(); }, []);

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

            {/* View Employee */}
            < Dialog open={!!viewEmp} onOpenChange={() => setViewEmp(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewEmp?.user?.first_name} {viewEmp?.user?.last_name}</DialogTitle>
                        <DialogDescription>{viewEmp?.employee_uid || 'Employee Details'}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Designation</span><span>{viewEmp?.designation}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Department</span><span className="capitalize">{viewEmp?.department}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Type</span><span className="capitalize">{viewEmp?.employee_type}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Joined</span><span>{viewEmp?.date_of_joining ? new Date(viewEmp.date_of_joining).toLocaleDateString() : '—'}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Email</span><span>{viewEmp?.user?.email}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Status</span><Badge variant={viewEmp?.is_active ? "default" : "secondary"}>{viewEmp?.is_active ? "Active" : "Inactive"}</Badge></div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog >

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
