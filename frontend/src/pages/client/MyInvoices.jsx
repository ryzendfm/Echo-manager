import { useState, useEffect } from "react";
import { invoiceApi } from "@/api/invoiceApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Filter } from "lucide-react";

export default function ClientMyInvoices() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewInvoice, setViewInvoice] = useState(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await invoiceApi.getMyInvoices();
            setInvoices(res.data.invoices || []);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (s) => {
        const m = {
            draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            partially_paid: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        };
        return m[s] || "";
    };

    const filtered = invoices.filter(i => {
        const matchSearch = i.invoice_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" || i.status === statusFilter;
        return matchSearch && matchStatus;
    });

    // Helper to get effective amount
    const getAmount = (inv) => {
        const mainAmount = parseFloat(inv.total_amount || inv.amount || 0);
        if (mainAmount > 0) return mainAmount;
        // Fallback: sum items if main amount is 0
        if (inv.items && Array.isArray(inv.items)) {
            return inv.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
        }
        return 0;
    };

    // Summary stats
    const stats = {
        total: filtered.length,
        totalAmount: filtered.reduce((sum, i) => sum + getAmount(i), 0),
        paid: filtered.filter(i => i.status === 'paid').reduce((sum, i) => sum + getAmount(i), 0),
        pending: filtered.filter(i => ['sent', 'partially_paid', 'overdue', 'draft'].includes(i.status)).reduce((sum, i) => sum + getAmount(i), 0),
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Invoices</h1>
                <p className="text-muted-foreground">View your billing invoices and payment status.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Billed</p>
                        <p className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString('en-IN')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-2xl font-bold text-green-600">₹{stats.paid.toLocaleString('en-IN')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-600">₹{stats.pending.toLocaleString('en-IN')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by invoice ID..."
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
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partially_paid">Partially Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">Loading invoices...</div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No invoices found.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="space-y-3 sm:hidden">
                        {filtered.map((inv) => (
                            <div key={inv.id} className="rounded-lg border bg-card p-3 space-y-1.5 cursor-pointer" onClick={() => setViewInvoice(inv)}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-semibold">{inv.invoice_uid}</div>
                                    <Badge variant="outline" className={getStatusColor(inv.status)}>{inv.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                                </div>
                                <div className="font-bold text-lg">₹{getAmount(inv).toLocaleString('en-IN')}</div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Date: {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}</span>
                                    <span>Due: {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</span>
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
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((inv) => (
                                        <TableRow key={inv.id} className="cursor-pointer" onClick={() => setViewInvoice(inv)}>
                                            <TableCell className="font-medium">{inv.invoice_uid}</TableCell>
                                            <TableCell>{inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN') : '—'}</TableCell>
                                            <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</TableCell>
                                            <TableCell className="font-medium">₹{getAmount(inv).toLocaleString('en-IN')}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(inv.status)}>{inv.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* View Dialog */}
            <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{viewInvoice?.invoice_uid}</DialogTitle>
                        <DialogDescription>Invoice details</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline" className={getStatusColor(viewInvoice?.status)}>
                                {viewInvoice?.status?.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Invoice Date</span>
                            <span>{viewInvoice?.created_at ? new Date(viewInvoice.created_at).toLocaleDateString('en-IN') : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Date</span>
                            <span>{viewInvoice?.due_date ? new Date(viewInvoice.due_date).toLocaleDateString('en-IN') : '—'}</span>
                        </div>

                        {viewInvoice?.items && viewInvoice.items.length > 0 && (
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
                                        {viewInvoice.items.map((item, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{Number(item.unit_price).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                                <TableCell className="text-right">{Number(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="mt-4 space-y-1 text-right">
                            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{Number(viewInvoice?.subtotal || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({viewInvoice?.tax_rate || 0}%)</span><span>{Number(viewInvoice?.tax_amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Discount ({viewInvoice?.discount_rate || 0}%)</span><span>- {Number(viewInvoice?.discount_amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span></div>
                            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span>{viewInvoice ? getAmount(viewInvoice).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : 0}</span></div>
                        </div>

                        {viewInvoice?.notes && (
                            <div className="mt-4 pt-4 border-t">
                                <span className="font-semibold block mb-1">Notes:</span>
                                <p className="text-muted-foreground whitespace-pre-wrap">{viewInvoice.notes}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
