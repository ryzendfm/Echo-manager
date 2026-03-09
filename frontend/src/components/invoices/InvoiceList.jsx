import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Search, Trash2, FileDown } from "lucide-react";
import { invoiceApi } from "@/api/invoiceApi";
import { clientApi } from "@/api/clientApi";
import { projectApi } from "@/api/projectApi";
import { toast } from "sonner";
import { exportSingleInvoicePdf, exportAllInvoicesPdf } from "@/utils/generateInvoicePdf";

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientsLoading, setClientsLoading] = useState(true);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Dialog states
    const [viewInv, setViewInv] = useState(null);
    const [editInv, setEditInv] = useState(null);
    const [formInv, setFormInv] = useState(null);
    const [deleteInv, setDeleteInv] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);

    // Initial state for new invoice
    const initialInvoiceState = {
        client_id: '',
        project_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
        subtotal: 0,
        tax_rate: 0,
        tax_amount: 0,
        discount_rate: 0,
        discount_amount: 0,
        total_amount: 0,
        notes: '',
        status: 'draft'
    };

    const [newInv, setNewInv] = useState(initialInvoiceState);

    useEffect(() => {
        fetchInvoices();
        fetchClients();
        fetchProjects();
    }, []);

    // Recalculate totals whenever items, tax, or discount changes for NEW invoice
    useEffect(() => {
        if (showNewDialog) {
            setNewInv(prev => calculateInvoiceTotals(prev));
        }
    }, [newInv.items, newInv.tax_rate, newInv.discount_rate, showNewDialog]);

    // Recalculate totals for EDIT invoice
    useEffect(() => {
        if (formInv) {
            setFormInv(prev => calculateInvoiceTotals(prev));
        }
    }, [formInv?.items, formInv?.tax_rate, formInv?.discount_rate]);


    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await invoiceApi.getAll();
            setInvoices(res.data.invoices || []);
        } catch (err) { console.error("Failed to fetch invoices:", err); }
        finally { setLoading(false); }
    };

    const fetchClients = async () => {
        try {
            setClientsLoading(true);
            const res = await clientApi.getAll();
            setClients(res.data.clients || []);
        } catch (err) { console.error("Failed to fetch clients:", err); }
        finally { setClientsLoading(false); }
    };

    const fetchProjects = async () => {
        try {
            setProjectsLoading(true);
            const res = await projectApi.getAll();
            setProjects(res.data.projects || []);
        } catch (err) { console.error("Failed to fetch projects:", err); }
        finally { setProjectsLoading(false); }
    };

    const calculateInvoiceTotals = (inv) => {
        const subtotal = inv.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const taxAmount = (subtotal * (Number(inv.tax_rate) || 0)) / 100;
        const discountAmount = (subtotal * (Number(inv.discount_rate) || 0)) / 100;
        const total = subtotal + taxAmount - discountAmount;

        return {
            ...inv,
            subtotal,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: total
        };
    };

    const handleCreate = async () => {
        try {
            await invoiceApi.create(newInv);
            toast.success("Invoice created");
            setShowNewDialog(false);
            setNewInv(initialInvoiceState);
            fetchInvoices();
        } catch (err) { toast.error("Failed to create invoice"); }
    };

    const handleEdit = async () => {
        try {
            await invoiceApi.update(formInv.id, formInv);
            toast.success("Invoice updated");
            setEditInv(null);
            fetchInvoices();
        } catch (err) { toast.error("Failed to update invoice"); }
    };

    const handleDelete = async () => {
        try {
            await invoiceApi.delete(deleteInv.id);
            toast.success("Invoice deleted");
            setDeleteInv(null);
            fetchInvoices();
        } catch (err) { toast.error("Failed to delete invoice"); }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoice_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search invoices..." className="w-full pl-8"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[155px]">
                            <SelectValue placeholder="Filter status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="partially_paid">Partially Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button className="flex-1 sm:flex-initial" onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>
                    <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => { exportAllInvoicesPdf(filteredInvoices, clients); toast.success('Report exported'); }}><FileDown className="mr-2 h-4 w-4" />Export All</Button>
                </div>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No invoices found.</div>
                ) : (
                    filteredInvoices.map((inv) => (
                        <div key={inv.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-semibold">{inv.invoice_uid}</div>
                                    <div className="text-xs text-muted-foreground">{clients.find(c => c.id === inv.client_id)?.company_name}</div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setViewInv(inv)}>View</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setEditInv(inv); setFormInv({ ...inv, items: inv.items || [] }); }}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { exportSingleInvoicePdf(inv, clients.find(c => c.id === inv.client_id)?.company_name, projects.find(p => p.id === inv.project_id)?.project_name); toast.success('PDF exported'); }}>Export PDF</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteInv(inv)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">{fmt(inv.total_amount || inv.amount)}</span>
                                <Badge variant="outline" className={getStatusColor(inv.status)}>{inv.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice ID</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading invoices...</TableCell></TableRow>
                        ) : filteredInvoices.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No invoices found.</TableCell></TableRow>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="font-medium">{inv.invoice_uid}</TableCell>
                                    <TableCell>{clients.find(c => c.id === inv.client_id)?.company_name || inv.client_id}</TableCell>
                                    <TableCell className="font-semibold">{fmt(inv.total_amount || inv.amount)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getStatusColor(inv.status)}>
                                            {inv.status?.replace(/_/g, ' ').toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setViewInv(inv)}>View Invoice</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { setEditInv(inv); setFormInv({ ...inv }); }}>Edit Invoice</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => { exportSingleInvoicePdf(inv, clients.find(c => c.id === inv.client_id)?.company_name, projects.find(p => p.id === inv.project_id)?.project_name); toast.success('PDF exported'); }}>Export PDF</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteInv(inv)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Invoice */}
            <Dialog open={!!viewInv} onOpenChange={() => setViewInv(null)}>
                <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Invoice {viewInv?.invoice_uid}</DialogTitle>
                        <DialogDescription>
                            {clients.find(c => c.id === viewInv?.client_id)?.company_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <Badge variant="outline" className={getStatusColor(viewInv?.status)}>{viewInv?.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Issue Date</span>
                                <span>{viewInv?.issue_date ? new Date(viewInv.issue_date).toLocaleDateString() : '—'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Due Date</span>
                                <span>{viewInv?.due_date ? new Date(viewInv.due_date).toLocaleDateString() : '—'}</span>
                            </div>

                            {viewInv?.items && viewInv.items.length > 0 && (
                                <div className="mt-4 border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead>Description</TableHead>
                                                <TableHead className="text-right">Qty</TableHead>
                                                <TableHead className="text-right">Price</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewInv.items.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{item.description}</TableCell>
                                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{fmt(item.unit_price)}</TableCell>
                                                    <TableCell className="text-right">{fmt(item.amount)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            <div className="mt-4 space-y-1 text-right">
                                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(viewInv?.subtotal)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Tax ({viewInv?.tax_rate}%)</span><span>{fmt(viewInv?.tax_amount)}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Discount ({viewInv?.discount_rate}%)</span><span>- {fmt(viewInv?.discount_amount)}</span></div>
                                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{fmt(viewInv?.total_amount || viewInv?.amount)}</span></div>
                            </div>

                            {viewInv?.notes && (
                                <div className="mt-4 pt-4 border-t">
                                    <span className="font-semibold block mb-1">Notes:</span>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{viewInv.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { exportSingleInvoicePdf(viewInv, clients.find(c => c.id === viewInv?.client_id)?.company_name, projects.find(p => p.id === viewInv?.project_id)?.project_name); toast.success('PDF exported'); }}><FileDown className="mr-2 h-4 w-4" />Export PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Invoice */}
            <Dialog open={!!editInv} onOpenChange={() => { setEditInv(null); setFormInv(null); }}>
                <DialogContent className="sm:max-w-[700px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        {formInv && <InvoiceForm data={formInv} setData={setFormInv} clients={clients} projects={projects} clientsLoading={clientsLoading} projectsLoading={projectsLoading} isEditing={true} />}
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Invoice */}
            <Dialog open={!!deleteInv} onOpenChange={() => setDeleteInv(null)}>
                <DialogContent className="sm:max-w-[400px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Delete Invoice</DialogTitle>
                        <DialogDescription>Are you sure you want to delete <strong>{deleteInv?.invoice_uid}</strong>?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteInv(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Invoice */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[700px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <InvoiceForm data={newInv} setData={setNewInv} clients={clients} projects={projects} clientsLoading={clientsLoading} projectsLoading={projectsLoading} isEditing={false} />
                    </div>
                    <DialogFooter><Button onClick={handleCreate}>Create Invoice</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(v || 0);

const getStatusColor = (status) => {
    const m = { paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", partially_paid: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    return m[status] || "";
};

const InvoiceForm = ({ data, setData, clients, projects, clientsLoading, projectsLoading, isEditing }) => {
    const updateItem = (index, field, value) => {
        setData(prev => {
            const newItems = [...prev.items];
            const item = { ...newItems[index], [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                item.amount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
            }
            newItems[index] = item;
            return { ...prev, items: newItems };
        });
    };

    const addItem = () => {
        setData(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]
        }));
    };

    const removeItem = (index) => {
        setData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Client <span className="text-destructive">*</span></Label>
                    <Select value={String(data.client_id)} onValueChange={(v) => setData({ ...data, client_id: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select Client"} />
                        </SelectTrigger>
                        <SelectContent>
                            {clientsLoading ? (
                                <SelectItem value="loading" disabled>Loading clients...</SelectItem>
                            ) : (
                                clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.company_name}</SelectItem>)
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Project</Label>
                    <Select value={String(data.project_id || '')} onValueChange={(v) => setData({ ...data, project_id: v })}>
                        <SelectTrigger>
                            <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select Project (Optional)"} />
                        </SelectTrigger>
                        <SelectContent>
                            {projectsLoading ? (
                                <SelectItem value="loading" disabled>Loading projects...</SelectItem>
                            ) : (
                                projects
                                    .filter(p => !data.client_id || String(p.client_id) === String(data.client_id))
                                    .map(p => <SelectItem key={p.id} value={String(p.id)}>{p.project_name}</SelectItem>)
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Issue Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={data.issue_date || ''} onChange={(e) => setData({ ...data, issue_date: e.target.value })} />
                </div>
                <div className="grid gap-2">
                    <Label>Due Date <span className="text-destructive">*</span></Label>
                    <Input type="date" value={data.due_date || ''} onChange={(e) => setData({ ...data, due_date: e.target.value })} />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>Items <span className="text-destructive">*</span></Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                </div>
                {/* Mobile card layout */}
                <div className="space-y-3 sm:hidden">
                    {data.items?.map((item, index) => (
                        <div key={index} className="rounded-lg border bg-card p-3 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Description</Label>
                                    <Input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Item name" />
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive h-8 w-8 shrink-0 mt-5">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Qty</Label>
                                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Price</Label>
                                    <Input type="number" min="0" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Amount</Label>
                                    <div className="h-9 flex items-center justify-end font-medium text-sm">{fmt(item.amount)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!data.items || data.items.length === 0) && (
                        <div className="text-center text-muted-foreground p-4 border rounded-lg">No items added</div>
                    )}
                </div>

                {/* Desktop table layout */}
                <div className="hidden sm:block rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Description</TableHead>
                                <TableHead className="w-[15%]">Qty</TableHead>
                                <TableHead className="w-[20%]">Price</TableHead>
                                <TableHead className="w-[20%] text-right">Amount</TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.items?.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Item name" />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" min="0" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{fmt(item.amount)}</TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-destructive h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!data.items || data.items.length === 0) && (
                                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground p-4">No items added</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-2">
                    <Label>Notes / Terms</Label>
                    <Textarea value={data.notes || ''} onChange={(e) => setData({ ...data, notes: e.target.value })} placeholder="Payment terms, bank details, etc." className="h-24" />
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{fmt(data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Tax (%)</span>
                        <Input type="number" className="w-20 h-8 text-right" value={data.tax_rate} onChange={(e) => setData({ ...data, tax_rate: e.target.value })} />
                    </div>
                    <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Discount (%)</span>
                        <Input type="number" className="w-20 h-8 text-right" value={data.discount_rate} onChange={(e) => setData({ ...data, discount_rate: e.target.value })} />
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between items-center text-base font-bold">
                        <span>Total</span>
                        <span>{fmt(data.total_amount)}</span>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="grid gap-2">
                    <Label>Status <span className="text-destructive">*</span></Label>
                    <Select value={data.status || ''} onValueChange={(v) => setData({ ...data, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'].map(s => (
                                <SelectItem key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
};
