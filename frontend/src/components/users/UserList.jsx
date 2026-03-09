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
import { MoreHorizontal, Plus, Search, Eye, EyeOff, Upload, X } from "lucide-react";
import { userApi } from "@/api/userApi";
import api, { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

function PasswordInput({ value, onChange, placeholder, show, onToggle }) {
    return (
        <div className="relative">
            <Input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={onToggle}
            >
                {show ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
            </Button>
        </div>
    );
}

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewUser, setViewUser] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [formUser, setFormUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // File upload state & handlers
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await uploadFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await uploadFile(file);
    };

    const uploadFile = async (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const res = await api.post('/upload/temp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data;

            if (data.success) {
                setFormUser(prev => ({ ...prev, avatar: data.tempPath }));
                toast.success("Profile picture uploaded");
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

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await userApi.getAll();
            setUsers(res.data.users || []);
        } catch (err) { console.error("Failed to fetch users:", err); }
        finally { setLoading(false); }
    };

    const handleEdit = async () => {
        try {
            const { first_name, last_name, email, role, phone, avatar } = formUser;
            await userApi.update(formUser.id, { first_name, last_name, email, role, phone, avatar });
            toast.success("User updated");
            setEditUser(null);
            fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || "Failed to update user"); }
    };

    const handleDelete = async () => {
        try {
            await userApi.delete(deleteUser.id);
            toast.success("User deleted");
            setDeleteUser(null);
            fetchUsers();
        } catch (err) { toast.error("Failed to delete user"); }
    };

    const handleToggleStatus = async (user) => {
        try {
            await userApi.updateStatus(user.id, { is_active: !user.is_active });
            toast.success(user.is_active ? "User deactivated" : "User activated");
            fetchUsers();
        } catch (err) { toast.error("Failed to update status"); }
    };

    const getRoleColor = (role) => {
        const m = { admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", employee: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", client: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", intern: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" };
        return m[role] || "";
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && u.is_active) ||
            (statusFilter === "inactive" && !u.is_active);
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search users..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Filter role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No users found.</div>
                ) : (
                    filteredUsers.map((u) => (
                        <div key={u.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 shrink-0">
                                        <AvatarImage src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BACKEND_URL}/${u.avatar}`) : ''} />
                                        <AvatarFallback>{u.first_name?.[0]}{u.last_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold">{u.first_name} {u.last_name}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{u.email}</div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setViewUser(u)}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setEditUser(u); setFormUser({ ...u }); setShowResetPassword(false); setShowConfirmPassword(false); }}>Edit User</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleStatus(u)} className={u.is_active ? 'text-destructive' : 'text-green-600'}>{u.is_active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUser(u)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline" className={getRoleColor(u.role)}>{u.role?.toUpperCase()}</Badge>
                                <Badge variant={u.is_active ? 'default' : 'secondary'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
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
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading users...</TableCell></TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No users found.</TableCell></TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}/${user.avatar}`) : ''} />
                                            <AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.first_name} {user.last_name}</span>
                                            <span className="text-xs text-muted-foreground">{user.user_uid}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getRoleColor(user.role)}>
                                            {user.role?.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.is_active ? "default" : "secondary"}>
                                            {user.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewUser(user)}>View Details</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditUser(user); setFormUser({ ...user }); setShowResetPassword(false); setShowConfirmPassword(false); }}>Edit User</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                    {user.is_active ? "Deactivate" : "Activate"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUser(user)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View User */}
            <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={viewUser?.avatar ? (viewUser.avatar.startsWith('http') ? viewUser.avatar : `${BACKEND_URL}/${viewUser.avatar}`) : ''} />
                                <AvatarFallback>{viewUser?.first_name?.[0]}{viewUser?.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle>{viewUser?.first_name} {viewUser?.last_name}</DialogTitle>
                                <DialogDescription>{viewUser?.user_uid}</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Email</span><span>{viewUser?.email}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Role</span><Badge variant="outline" className={getRoleColor(viewUser?.role)}>{viewUser?.role?.toUpperCase()}</Badge></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Status</span><Badge variant={viewUser?.is_active ? "default" : "secondary"}>{viewUser?.is_active ? "Active" : "Inactive"}</Badge></div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit User */}
            <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user details and optionally reset their password.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>First Name <span className="text-destructive">*</span></Label><Input value={formUser?.first_name || ''} onChange={(e) => setFormUser({ ...formUser, first_name: e.target.value })} /></div>
                                <div className="grid gap-2"><Label>Last Name <span className="text-destructive">*</span></Label><Input value={formUser?.last_name || ''} onChange={(e) => setFormUser({ ...formUser, last_name: e.target.value })} /></div>
                            </div>
                            <div className="grid gap-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" value={formUser?.email || ''} onChange={(e) => setFormUser({ ...formUser, email: e.target.value })} /></div>
                            <div className="grid gap-2"><Label>Role <span className="text-destructive">*</span></Label>
                                <Select value={formUser?.role || ''} onValueChange={(v) => setFormUser({ ...formUser, role: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['admin', 'employee', 'client', 'intern'].map(r => (
                                            <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Profile Picture</Label>
                                {formUser?.avatar ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={formUser.avatar.startsWith('http') ? formUser.avatar : `${BACKEND_URL}/${formUser.avatar}`} />
                                            <AvatarFallback>PP</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs truncate flex-1">{formUser.avatar.split(/[/\\]/).pop()}</span>
                                        <label className="text-xs text-primary cursor-pointer hover:underline shrink-0 font-medium">
                                            Replace
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        </label>
                                    </div>
                                ) : (
                                    <label
                                        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer transition-colors ${dragActive ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <Upload className={`h-5 w-5 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className={`text-xs ${dragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                            {uploading ? 'Uploading...' : 'Click or Drag Profile Picture'}
                                        </span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                                    </label>
                                )}
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <Label className="text-base font-semibold">Reset Password</Label>
                                <div className="grid grid-cols-1 gap-4 mt-2">
                                    <div className="grid gap-2">
                                        <Label>New Password</Label>
                                        <PasswordInput
                                            value={formUser?.newPassword || ''}
                                            onChange={(e) => setFormUser({ ...formUser, newPassword: e.target.value })}
                                            placeholder="New password"
                                            show={showResetPassword}
                                            onToggle={() => setShowResetPassword(!showResetPassword)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Confirm Password</Label>
                                        <PasswordInput
                                            value={formUser?.confirmPassword || ''}
                                            onChange={(e) => setFormUser({ ...formUser, confirmPassword: e.target.value })}
                                            placeholder="Confirm password"
                                            show={showConfirmPassword}
                                            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="mt-2 w-full"
                                    onClick={async () => {
                                        if (!formUser?.newPassword || formUser.newPassword.length < 6) {
                                            toast.error("Password must be at least 6 characters");
                                            return;
                                        }
                                        if (formUser.newPassword !== formUser.confirmPassword) {
                                            toast.error("Passwords do not match");
                                            return;
                                        }
                                        try {
                                            await userApi.resetPassword(formUser.id, formUser.newPassword);
                                            toast.success("Password reset successfully");
                                            setFormUser({ ...formUser, newPassword: '', confirmPassword: '' });
                                        } catch (err) {
                                            toast.error("Failed to reset password");
                                        }
                                    }}
                                >
                                    Reset Password
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Details</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete User */}
            <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
                <DialogContent className="sm:max-w-[400px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>Are you sure you want to delete <strong>{deleteUser?.first_name} {deleteUser?.last_name}</strong>?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* New user creation has been moved to entity-specific flows (e.g. Clients, Employees). */}
        </div>
    );
}
