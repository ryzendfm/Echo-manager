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
import { MoreHorizontal, Plus, Search, Building2, Mail, Phone, Globe } from "lucide-react";
import { clientApi } from "@/api/clientApi";
import { invoiceApi } from "@/api/invoiceApi";
import { toast } from "sonner";

export default function ClientList() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewClient, setViewClient] = useState(null);
    const [editClient, setEditClient] = useState(null);
    const [formClient, setFormClient] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [portalEnabled, setPortalEnabled] = useState(false);
    const [clientInvoices, setClientInvoices] = useState([]);
    const [invLoading, setInvLoading] = useState(false);
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

        if (payload.portal.enabled) {
            if (!payload.portal.password || payload.portal.password.length < 6) {
                toast.error("Password must be at least 6 characters");
                return;
            }
            if (payload.portal.password !== payload.portal.confirm_password) {
                toast.error("Passwords do not match");
                return;
            }
        }

        try {
            await clientApi.create(payload);
            toast.success("Client created");
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
            await clientApi.update(formClient.id, formClient);
            toast.success("Client updated");
            setEditClient(null);
            fetchClients();
        } catch (err) {
            toast.error("Failed to update client");
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
                    filteredClients.map((c) => {
                        const initials = (c.company_name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                        const industryLabel = c.industry?.replace(/_/g, ' ') || 'Other';
                        const industryColors = {
                            technology: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                            finance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                            healthcare: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
                            education: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
                            retail: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                            manufacturing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                            ecommerce: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
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
                        const colorIdx = (c.company_name || '').charCodeAt(0) % avatarColors.length;

                        return (
                            <div
                                key={c.id}
                                className={`rounded-xl border bg-card transition-shadow hover:shadow-md ${c.is_active ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-slate-300 dark:border-l-slate-600 opacity-80'}`}
                            >
                                <div className="p-3 space-y-2">
                                    {/* Header: Avatar + Company + Actions */}
                                    <div className="flex items-start gap-2">
                                        <div className={`shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${avatarColors[colorIdx]} flex items-center justify-center shadow-sm`}>
                                            <span className="text-white font-bold text-sm">{initials}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-base leading-tight truncate">{c.company_name}</h3>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{c.client_uid}</p>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setViewClient(c)}>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => { setEditClient(c); setFormClient({ ...c }); }}>Edit</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(c)} className={c.is_active ? "text-destructive" : "text-green-600"}>{c.is_active ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags row */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${industryColors[c.industry] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                                            <Building2 className="h-3 w-3 mr-1" />{industryLabel}
                                        </span>
                                        <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[11px] h-5">
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>

                                    {/* Contact info */}
                                    <div className="space-y-1.5 pt-1 border-t border-border/50">
                                        {(c.contact_person || c.contact_name) && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground font-medium">{c.contact_person || c.contact_name}</span>
                                            </div>
                                        )}
                                        {(c.email || c.contact_email) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Mail className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{c.email || c.contact_email}</span>
                                            </div>
                                        )}
                                        {c.phone && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3 shrink-0" />
                                                <span>{c.phone}</span>
                                            </div>
                                        )}
                                        {c.website_url && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Globe className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{c.website_url}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
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
                                                <DropdownMenuItem onClick={() => {
                                                    setViewClient(client);
                                                    setInvLoading(true);
                                                    invoiceApi.getAll({ client_id: client.id })
                                                        .then(res => setClientInvoices(res.data.invoices || []))
                                                        .catch(err => console.error(err))
                                                        .finally(() => setInvLoading(false));
                                                }}>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditClient(client); setFormClient({ ...client }); }}>Edit Details</DropdownMenuItem>
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

            {/* View Client */}
            <Dialog open={!!viewClient} onOpenChange={() => setViewClient(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{viewClient?.company_name}</DialogTitle>
                        <DialogDescription>{viewClient?.client_uid}</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Industry</span><span className="capitalize">{viewClient?.industry?.replace(/_/g, ' ')}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Contact</span><span>{viewClient?.contact_name}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Email</span><span>{viewClient?.contact_email}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Phone</span><span>{viewClient?.contact_phone || '—'}</span></div>
                            <div className="grid grid-cols-2 gap-2"><span className="text-muted-foreground">Status</span><Badge variant={viewClient?.is_active ? "default" : "secondary"}>{viewClient?.is_active ? "Active" : "Inactive"}</Badge></div>

                            <div className="border-t pt-3 grid gap-2">
                                <span className="text-muted-foreground font-medium">Invoices</span>
                                {invLoading ? (
                                    <span className="text-xs text-muted-foreground">Loading invoices...</span>
                                ) : clientInvoices.length > 0 ? (
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
                                                {clientInvoices.map(inv => (
                                                    <TableRow key={inv.id} className="h-8">
                                                        <TableCell className="py-1 text-xs">{inv.invoice_uid}</TableCell>
                                                        <TableCell className="py-1 text-xs text-right">
                                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inv.total_amount || inv.amount)}
                                                        </TableCell>
                                                        <TableCell className="py-1 text-xs text-right">
                                                            <Badge variant="outline" className={`text-[10px] px-1 py-0 ${{
                                                                paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                                                                sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
                                                                draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                                                                overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                                                                partially_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
                                                                cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                                                            }[inv.status] || ''
                                                                }`}>
                                                                {inv.status?.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">No invoices found for this client.</span>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Client */}
            <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                        <DialogDescription>Update client information.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid gap-2"><Label>Company Name <span className="text-destructive">*</span></Label><Input value={formClient?.company_name || ''} onChange={(e) => setFormClient({ ...formClient, company_name: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Contact Name <span className="text-destructive">*</span></Label><Input value={formClient?.contact_name || ''} onChange={(e) => setFormClient({ ...formClient, contact_name: e.target.value })} /></div>
                                <div className="grid gap-2"><Label>Industry <span className="text-destructive">*</span></Label>
                                    <Select value={formClient?.industry || ''} onValueChange={(v) => setFormClient({ ...formClient, industry: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['e_commerce', 'healthcare', 'education', 'finance', 'technology', 'real_estate', 'other'].map(i => (
                                                <SelectItem key={i} value={i}>{i.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2"><Label>Address <span className="text-destructive">*</span></Label><Input value={formClient?.address || ''} onChange={(e) => setFormClient({ ...formClient, address: e.target.value })} placeholder="Company address" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Email <span className="text-destructive">*</span></Label><Input type="email" value={formClient?.contact_email || ''} onChange={(e) => setFormClient({ ...formClient, contact_email: e.target.value })} /></div>
                                <div className="grid gap-2"><Label>Phone <span className="text-destructive">*</span></Label><Input value={formClient?.contact_phone || ''} onChange={(e) => setFormClient({ ...formClient, contact_phone: e.target.value })} /></div>
                            </div>
                            <div className="grid gap-2"><Label>Alternate Number</Label><Input value={formClient?.alternate_number || ''} onChange={(e) => setFormClient({ ...formClient, alternate_number: e.target.value })} placeholder="+91 ..." /></div>
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
                                        When enabled, the contact can sign in using their email and password.
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Password <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="password"
                                            value={newClient.portal.password}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    portal: { ...newClient.portal, password: e.target.value },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Confirm Password <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="password"
                                            value={newClient.portal.confirm_password}
                                            onChange={(e) =>
                                                setNewClient({
                                                    ...newClient,
                                                    portal: { ...newClient.portal, confirm_password: e.target.value },
                                                })
                                            }
                                        />
                                    </div>
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
