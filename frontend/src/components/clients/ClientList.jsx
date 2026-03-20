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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoreHorizontal, Plus, Search, Building2, Mail, Phone, Globe, MapPin, FileText, FolderKanban, Bell, Receipt, UserCheck, StickyNote } from "lucide-react";
import { clientApi } from "@/api/clientApi";
import { invoiceApi } from "@/api/invoiceApi";
import { projectApi } from "@/api/projectApi";
import { notificationApi } from "@/api/notificationApi";
import { toast } from "sonner";
import { useCelebration } from "@/hooks/useCelebration";

export default function ClientList() {
    const { celebrate } = useCelebration();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewClient, setViewClient] = useState(null);
    const [editClient, setEditClient] = useState(null);
    const [formClient, setFormClient] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [portalEnabled, setPortalEnabled] = useState(false);
    const [editPortalEnabled, setEditPortalEnabled] = useState(false);
    const [clientInvoices, setClientInvoices] = useState([]);
    const [invLoading, setInvLoading] = useState(false);
    const [viewTab, setViewTab] = useState("profile");

    // Projects tab state
    const [clientProjects, setClientProjects] = useState([]);
    const [projLoading, setProjLoading] = useState(false);

    // Notifications tab state
    const [clientNotifications, setClientNotifications] = useState([]);
    const [notifLoading, setNotifLoading] = useState(false);

    const [newClient, setNewClient] = useState({
        company: {
            company_name: "",
            industry: "other",
            address: "",
            website_url: "",
            notes: "",
        },
        contact: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            alternate_number: "",
        },
        portal: {
            enabled: false,
            password: "",
            confirm_password: "",
        },
    });

    useEffect(() => { fetchClients(); }, []);

    // Fetch invoices when dialog opens
    useEffect(() => {
        if (!viewClient) { setClientInvoices([]); setClientProjects([]); setClientNotifications([]); setViewTab("profile"); return; }
        let cancelled = false;
        (async () => {
            try {
                setInvLoading(true);
                const res = await invoiceApi.getAll({ client_id: viewClient.id });
                if (!cancelled) setClientInvoices(res.data.invoices || []);
            } catch { if (!cancelled) setClientInvoices([]); }
            finally { if (!cancelled) setInvLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewClient]);

    // Fetch projects when tab switches
    useEffect(() => {
        if (!viewClient || viewTab !== "projects") return;
        let cancelled = false;
        (async () => {
            try {
                setProjLoading(true);
                const res = await projectApi.getAll({ client_id: viewClient.id });
                if (!cancelled) setClientProjects((res.data.projects || []).filter(p => p.client_id === viewClient.id));
            } catch { if (!cancelled) setClientProjects([]); }
            finally { if (!cancelled) setProjLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewClient, viewTab]);

    // Fetch notifications when tab switches (only if client has a portal user)
    useEffect(() => {
        if (!viewClient || viewTab !== "notifications") return;
        const userId = viewClient.user_id || viewClient.User?.id;
        if (!userId) { setClientNotifications([]); return; }
        let cancelled = false;
        (async () => {
            try {
                setNotifLoading(true);
                const res = await notificationApi.getByUserId(userId, { limit: 50 });
                if (!cancelled) setClientNotifications(res.data.notifications || []);
            } catch { if (!cancelled) setClientNotifications([]); }
            finally { if (!cancelled) setNotifLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [viewClient, viewTab]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await clientApi.getAll();
            setClients(res.data.clients || []);
        } catch (err) { console.error("Failed to fetch clients:", err); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        const payload = {
            ...newClient,
            portal: {
                ...newClient.portal,
                enabled: portalEnabled,
            },
        };

        if (!payload.company.company_name.trim()) {
            toast.error("Company name is required");
            return;
        }

        if (!payload.contact.email.trim()) {
            toast.error("Client email is required");
            return;
        }

        try {
            await clientApi.create(payload);
            toast.success("Client created");
            celebrate();
            setShowNewDialog(false);
            setPortalEnabled(false);
            setNewClient({
                company: {
                    company_name: "",
                    industry: "other",
                    address: "",
                    website_url: "",
                    notes: "",
                },
                contact: {
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone: "",
                    alternate_number: "",
                },
                portal: {
                    enabled: false,
                    password: "",
                    confirm_password: "",
                },
            });
            fetchClients();
        } catch (err) {
            console.error("Failed to create client:", err);
            toast.error(err?.response?.data?.message || "Failed to create client");
        }
    };

    const handleEdit = async () => {
        try {
            const payload = { ...formClient };
            // If portal is being newly enabled (client didn't have a User before)
            if (editPortalEnabled && !editClient?.User) {
                payload.portal = { enabled: true };
            }
            await clientApi.update(formClient.id, payload);
            toast.success("Client updated");
            setEditClient(null);
            fetchClients();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to update client");
        }
    };

    const handleToggleActive = async (client) => {
        try {
            await clientApi.update(client.id, { is_active: !client.is_active });
            toast.success(client.is_active ? "Client deactivated" : "Client activated");
            fetchClients();
        } catch (err) { toast.error("Failed to update status"); }
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch = c.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.client_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && c.is_active) ||
            (statusFilter === "inactive" && !c.is_active);
        return matchesSearch && matchesStatus;
    });

    const getProjectStatusColor = (status) => {
        const m = { in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", planning: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
        return m[status] || "";
    };

    const getInvoiceStatusColor = (status) => {
        const m = { paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", partially_paid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
        return m[status] || "";
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

    const fmtCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

    const industryColors = {
        technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        finance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        healthcare: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
        education: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        retail: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        manufacturing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        e_commerce: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        real_estate: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    };

    const avatarColors = [
        'from-blue-500 to-indigo-600',
        'from-emerald-500 to-teal-600',
        'from-purple-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-cyan-500 to-blue-600',
        'from-rose-500 to-red-600',
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search clients..." className="w-full pl-8"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4" />Add Client</Button>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
                ) : filteredClients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No clients found.</div>
                ) : (
                    filteredClients.map((c) => (
                        <div key={c.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <span className="font-semibold text-primary hover:underline cursor-pointer" onClick={() => setViewClient(c)}>{c.company_name}</span>
                                    <div className="text-xs text-muted-foreground">{c.client_uid}</div>
                                    {c.contact_name && (
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            Contact: <span className="font-medium text-foreground">{c.contact_name}</span>
                                        </div>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setViewClient(c)}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setEditClient(c); setFormClient({ ...c }); setEditPortalEnabled(!!c.User); }}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleToggleActive(c)} className={c.is_active ? "text-destructive" : "text-green-600"}>{c.is_active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={`capitalize ${industryColors[c.industry] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{c.industry?.replace(/_/g, ' ') || 'Other'}</Badge>
                                <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span className="truncate">{c.contact_email || c.email || '—'}</span>
                                <span className="shrink-0">{c.contact_phone || '—'}</span>
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
                            <TableHead>Company</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Loading clients...</TableCell></TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No clients found.</TableCell></TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{client.company_name}</span>
                                            <span className="text-xs text-muted-foreground">{client.client_uid}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{client.contact_name}</span>
                                            <span className="text-xs text-muted-foreground">{client.contact_email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="capitalize">{client.industry?.replace(/_/g, ' ')}</TableCell>
                                    <TableCell>
                                        <Badge variant={client.is_active ? "default" : "secondary"}>
                                            {client.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewClient(client)}>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditClient(client); setFormClient({ ...client }); setEditPortalEnabled(!!client.User); }}>Edit Details</DropdownMenuItem>
                                                <DropdownMenuItem className={client.is_active ? "text-destructive" : "text-green-600"} onClick={() => handleToggleActive(client)}>
                                                    {client.is_active ? "Deactivate" : "Activate"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Client Profile */}
            <Dialog open={!!viewClient} onOpenChange={() => setViewClient(null)}>
                <DialogContent className="p-0 sm:max-w-[600px] sm:h-[85vh] flex flex-col">
                    {/* Sticky Header */}
                    <div className="border-b shrink-0 px-4 sm:px-6 pt-6 pb-4">
                        <div className="flex items-start gap-3 sm:gap-4">
                            {(() => {
                                const initials = (viewClient?.company_name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                                const colorIdx = (viewClient?.company_name || '').charCodeAt(0) % avatarColors.length;
                                return (
                                    <div className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center shadow-md`}>
                                        <span className="text-white font-bold text-lg sm:text-xl">{initials}</span>
                                    </div>
                                );
                            })()}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">{viewClient?.company_name}</h2>
                                    <Badge variant={viewClient?.is_active ? "default" : "secondary"} className="shrink-0">{viewClient?.is_active ? "Active" : "Inactive"}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{viewClient?.client_uid}</p>
                                {/* Desktop inline stats */}
                                <div className="hidden sm:flex items-center gap-1.5 mt-2 text-xs text-muted-foreground flex-wrap">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${industryColors[viewClient?.industry] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                        <Building2 className="h-3 w-3 mr-1" />{viewClient?.industry?.replace(/_/g, ' ')}
                                    </span>
                                    {viewClient?.User && <Badge variant="outline" className="text-[10px] text-green-600 border-green-600">Portal Active</Badge>}
                                </div>
                            </div>
                        </div>
                        {/* Mobile stat cards */}
                        <div className="grid grid-cols-2 gap-2 mt-3 sm:hidden">
                            <div className="rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Building2 className="h-3 w-3" />Industry</div>
                                <p className="text-xs font-medium capitalize mt-0.5">{viewClient?.industry?.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="rounded-lg bg-muted/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><UserCheck className="h-3 w-3" />Portal</div>
                                <p className="text-xs font-medium mt-0.5">{viewClient?.User ? 'Active' : 'No access'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={viewTab} onValueChange={setViewTab} className="flex-1 flex flex-col min-h-0">
                        <div className="px-4 sm:px-6 pt-2 shrink-0">
                            <TabsList className="w-full">
                                <TabsTrigger value="profile" className="flex-1 text-xs sm:text-sm">Profile</TabsTrigger>
                                <TabsTrigger value="projects" className="flex-1 text-xs sm:text-sm">Projects</TabsTrigger>
                                <TabsTrigger value="invoices" className="flex-1 text-xs sm:text-sm">Invoices</TabsTrigger>
                                <TabsTrigger value="notifications" className="flex-1 text-xs sm:text-sm">Notifications</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 space-y-5 mt-0">
                            {/* Contact Info */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Primary Contact</h3>
                                <div className="space-y-2">
                                    {viewClient?.contact_name && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span>{viewClient.contact_name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="truncate">{viewClient?.contact_email || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span>{viewClient?.contact_phone || 'Not provided'}</span>
                                    </div>
                                    {viewClient?.alternate_number && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <span>{viewClient.alternate_number} <span className="text-[10px] text-muted-foreground">(alt)</span></span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Company Details */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Company Details</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Building2 className="h-3 w-3" />Industry</div>
                                        <p className="text-sm font-medium capitalize mt-0.5">{viewClient?.industry?.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Globe className="h-3 w-3" />Website</div>
                                        <p className="text-sm font-medium mt-0.5 truncate">{viewClient?.website_url || '—'}</p>
                                    </div>
                                    {viewClient?.address && (
                                        <div className="rounded-lg bg-muted/20 px-3 py-2.5 col-span-2">
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><MapPin className="h-3 w-3" />Address</div>
                                            <p className="text-sm font-medium mt-0.5">{viewClient.address}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {viewClient?.notes && (
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notes</h3>
                                    <div className="rounded-lg bg-muted/20 px-3 py-2.5">
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><StickyNote className="h-3 w-3" />Internal Notes</div>
                                        <p className="text-sm">{viewClient.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Portal Status */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Portal Access</h3>
                                <div className="rounded-lg border px-3 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>Client Portal</span>
                                    </div>
                                    <Badge variant="outline" className={viewClient?.User ? "text-green-600 border-green-600" : "text-muted-foreground"}>
                                        {viewClient?.User ? 'Active' : 'Not enabled'}
                                    </Badge>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Projects Tab */}
                        <TabsContent value="projects" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 mt-0">
                            {projLoading ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading projects...</div>
                            ) : clientProjects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <FolderKanban className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">No projects yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {clientProjects.map(p => (
                                        <div key={p.id} className="rounded-lg border p-3 space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{p.project_name}</p>
                                                    <span className="text-[10px] text-muted-foreground">{p.project_uid}</span>
                                                </div>
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getProjectStatusColor(p.status)}`}>
                                                    {p.status?.replace(/_/g, ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                {p.deadline && <span>Due: {new Date(p.deadline).toLocaleDateString()}</span>}
                                                {p.total_budget > 0 && <span>Budget: {fmtCurrency(p.total_budget)}</span>}
                                                <span className="capitalize">{p.priority} priority</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Invoices Tab */}
                        <TabsContent value="invoices" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 mt-0">
                            {invLoading ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading invoices...</div>
                            ) : clientInvoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <Receipt className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">No invoices yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {clientInvoices.map(inv => (
                                        <div key={inv.id} className="rounded-lg border p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">{inv.invoice_uid}</p>
                                                    <span className="text-[10px] text-muted-foreground">Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</span>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold">{fmtCurrency(inv.total_amount || inv.amount)}</p>
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getInvoiceStatusColor(inv.status)}`}>
                                                        {inv.status?.replace(/_/g, ' ').toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="flex-1 overflow-y-auto styled-scrollbar px-4 sm:px-6 py-4 mt-0">
                            {!viewClient?.User && !viewClient?.user_id ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <Bell className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">Client has no portal access.</p>
                                    <p className="text-xs mt-1">Enable the portal to send notifications.</p>
                                </div>
                            ) : notifLoading ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">Loading notifications...</div>
                            ) : clientNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <Bell className="h-8 w-8 mb-2 opacity-40" />
                                    <p className="text-sm">No notifications yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {clientNotifications.map(n => (
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

            {/* Edit Client */}
            <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
                <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                        <DialogDescription>Update client information.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        {/* Company Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Company Info</h3>
                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <Label>Company Name <span className="text-destructive">*</span></Label>
                                    <Input value={formClient?.company_name || ''} onChange={(e) => setFormClient({ ...formClient, company_name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Industry <span className="text-destructive">*</span></Label>
                                        <Select value={formClient?.industry || ''} onValueChange={(v) => setFormClient({ ...formClient, industry: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['e_commerce', 'healthcare', 'education', 'finance', 'technology', 'real_estate', 'other'].map(i => (
                                                    <SelectItem key={i} value={i}>{i.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Website URL</Label>
                                        <Input value={formClient?.website_url || ''} onChange={(e) => setFormClient({ ...formClient, website_url: e.target.value })} placeholder="https://example.com" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Address <span className="text-destructive">*</span></Label>
                                    <Input value={formClient?.address || ''} onChange={(e) => setFormClient({ ...formClient, address: e.target.value })} placeholder="Company address" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Input value={formClient?.notes || ''} onChange={(e) => setFormClient({ ...formClient, notes: e.target.value })} placeholder="Internal notes about this client" />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3 mt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Primary Contact</h3>
                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <Label>Contact Name <span className="text-destructive">*</span></Label>
                                    <Input value={formClient?.contact_name || ''} onChange={(e) => setFormClient({ ...formClient, contact_name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Email <span className="text-destructive">*</span></Label>
                                        <Input type="email" value={formClient?.contact_email || ''} onChange={(e) => setFormClient({ ...formClient, contact_email: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Phone <span className="text-destructive">*</span></Label>
                                        <Input value={formClient?.contact_phone || ''} onChange={(e) => setFormClient({ ...formClient, contact_phone: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Alternate Number</Label>
                                    <Input value={formClient?.alternate_number || ''} onChange={(e) => setFormClient({ ...formClient, alternate_number: e.target.value })} placeholder="+91 ..." />
                                </div>
                            </div>
                        </div>

                        {/* Portal Access */}
                        <div className="space-y-3 mt-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">Portal Access</h3>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium leading-none">Enable client portal login</p>
                                    <p className="text-xs text-muted-foreground">
                                        {editClient?.User
                                            ? "This client already has portal access."
                                            : "When enabled, an email will be sent to the client to set their password."}
                                    </p>
                                </div>
                                {!editClient?.User && (
                                    <button
                                        type="button"
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${editPortalEnabled ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30"}`}
                                        onClick={() => setEditPortalEnabled(!editPortalEnabled)}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${editPortalEnabled ? "translate-x-5" : "translate-x-1"}`} />
                                    </button>
                                )}
                                {editClient?.User && (
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                )}
                            </div>
                            {editPortalEnabled && !editClient?.User && (
                                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                                    <p className="text-sm text-primary">
                                        An invitation email with a link to set their password will be sent to the client's email address.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Client */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Add Client</DialogTitle>
                        <DialogDescription>Register a new client and optionally create a portal login.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        {/* Company Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Company Info</h3>
                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <Label>Company Name <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={newClient.company.company_name}
                                        onChange={(e) =>
                                            setNewClient({
                                                ...newClient,
                                                company: { ...newClient.company, company_name: e.target.value },
                                            })
                                        }
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Industry <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={newClient.company.industry}
                                            onValueChange={(v) =>
                                                setNewClient({
                                                    ...newClient,
                                                    company: { ...newClient.company, industry: v },
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[
                                                    "e_commerce",
                                                    "healthcare",
                                                    "education",
                                                    "finance",
                                                    "technology",
                                                    "real_estate",
                                                    "other",
                                                ].map((i) => (
                                                    <SelectItem key={i} value={i}>
                                                        {i.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Website URL</Label>
                                        <Input
                                            value={newClient.company.website_url}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    company: { ...newClient.company, website_url: e.target.value },
                                                })
                                            }
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Address <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={newClient.company.address}
                                        onChange={(e) =>
                                            setNewClient({
                                                ...newClient,
                                                company: { ...newClient.company, address: e.target.value },
                                            })
                                        }
                                        placeholder="Company address"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Input
                                        value={newClient.company.notes}
                                        onChange={(e) =>
                                            setNewClient({
                                                ...newClient,
                                                company: { ...newClient.company, notes: e.target.value },
                                            })
                                        }
                                        placeholder="Internal notes about this client"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Primary Contact</h3>
                            <div className="grid gap-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>First Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={newClient.contact.first_name}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    contact: { ...newClient.contact, first_name: e.target.value },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Last Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={newClient.contact.last_name}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    contact: { ...newClient.contact, last_name: e.target.value },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Email <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="email"
                                            value={newClient.contact.email}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    contact: { ...newClient.contact, email: e.target.value },
                                                })
                                            }
                                            placeholder="client@company.com"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Phone <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={newClient.contact.phone}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    contact: { ...newClient.contact, phone: e.target.value },
                                                })
                                            }
                                            placeholder="+91 ..."
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Alternate Number</Label>
                                    <Input
                                        value={newClient.contact.alternate_number}
                                        onChange={(e) =>
                                            setNewClient({
                                                ...newClient,
                                                contact: { ...newClient.contact, alternate_number: e.target.value },
                                            })
                                        }
                                        placeholder="+91 ..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Portal Access */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">Portal Access</h3>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium leading-none">Enable client portal login</p>
                                    <p className="text-xs text-muted-foreground">
                                        When enabled, an email will be sent to the client to set their password.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${portalEnabled ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30"
                                        }`}
                                    onClick={() => setPortalEnabled(!portalEnabled)}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform ${portalEnabled ? "translate-x-5" : "translate-x-1"
                                            }`}
                                    />
                                </button>
                            </div>

                            {portalEnabled && (
                                <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                                    <p className="text-sm text-primary">
                                        An invitation email with a link to set their password will be sent to the client's email address.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreate}>Add Client</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
