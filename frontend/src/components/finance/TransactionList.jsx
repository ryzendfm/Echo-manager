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
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Plus, Search, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { transactionApi } from "@/api/transactionApi";
import { projectApi } from "@/api/projectApi";
import { toast } from "sonner";

export default function TransactionList() {
    const [transactions, setTransactions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [editTxn, setEditTxn] = useState(null);
    const [formTxn, setFormTxn] = useState(null);
    const [deleteTxn, setDeleteTxn] = useState(null);
    const [showNewDialog, setShowNewDialog] = useState(false);
    const [newTxn, setNewTxn] = useState({ type: 'income', category: 'project_payment', amount: '', date: '', description: '', payment_method: 'bank_transfer', reference_number: '', project_id: '' });

    useEffect(() => { fetchTransactions(); fetchProjects(); }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectApi.getAll();
            const data = res.data;
            setProjects(data.projects || data || []);
        } catch (err) { console.error("Failed to fetch projects:", err); }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await transactionApi.getAll();
            setTransactions(res.data.transactions || []);
        } catch (err) { console.error("Failed to fetch transactions:", err); }
        finally { setLoading(false); }
    };

    const handleCreate = async () => {
        try {
            const payload = { ...newTxn };
            if (!payload.project_id) payload.project_id = null;
            if (!payload.client_id) payload.client_id = null;

            await transactionApi.create(payload);
            toast.success("Transaction recorded");
            setShowNewDialog(false);
            setNewTxn({ type: 'income', category: 'project_payment', amount: '', date: '', description: '', payment_method: 'bank_transfer', reference_number: '', project_id: '' });
            fetchTransactions();
        } catch (err) { toast.error("Failed to create transaction"); }
    };

    const handleEdit = async () => {
        try {
            const payload = { ...formTxn };
            if (!payload.project_id) payload.project_id = null;
            if (!payload.client_id) payload.client_id = null;

            await transactionApi.update(formTxn.id, payload);
            toast.success("Transaction updated");
            setEditTxn(null);
            fetchTransactions();
        } catch (err) { toast.error("Failed to update transaction"); }
    };

    const handleDelete = async () => {
        try {
            await transactionApi.delete(deleteTxn.id);
            toast.success("Transaction deleted");
            setDeleteTxn(null);
            fetchTransactions();
        } catch (err) { toast.error("Failed to delete transaction"); }
    };

    const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const filteredTxns = transactions.filter(t => {
        const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === "all" || t.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <Card>
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                        <div className="min-w-0 w-full">
                            <p className="text-xs sm:text-sm text-muted-foreground">Income</p>
                            <p className="text-sm sm:text-2xl font-bold text-green-600 truncate">{fmt(totalIncome)}</p>
                        </div>
                        <TrendingUp className="hidden sm:block h-8 w-8 text-green-600 shrink-0" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                        <div className="min-w-0 w-full">
                            <p className="text-xs sm:text-sm text-muted-foreground">Expense</p>
                            <p className="text-sm sm:text-2xl font-bold text-red-600 truncate">{fmt(totalExpense)}</p>
                        </div>
                        <TrendingDown className="hidden sm:block h-8 w-8 text-red-600 shrink-0" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 sm:pt-6 px-3 sm:px-6 pb-4 sm:pb-6">
                        <div className="min-w-0 w-full">
                            <p className="text-xs sm:text-sm text-muted-foreground">Balance</p>
                            <p className={`text-sm sm:text-2xl font-bold truncate ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(totalIncome - totalExpense)}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <div className="flex gap-2 flex-1">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search transactions..." className="w-full pl-8"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[120px] shrink-0">
                            <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4" />Add Transaction</Button>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
                ) : filteredTxns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No transactions found.</div>
                ) : (
                    filteredTxns.map((t) => (
                        <div key={t.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{t.description || t.category}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{t.category?.replace(/_/g, ' ')}</div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => { setEditTxn(t); setFormTxn({ ...t }); }}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTxn(t)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="flex items-center justify-between">
                                <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>{t.type === 'income' ? '↑ Income' : '↓ Expense'}</Badge>
                                <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading transactions...</TableCell></TableRow>
                        ) : filteredTxns.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No transactions found.</TableCell></TableRow>
                        ) : (
                            filteredTxns.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell>
                                        <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>
                                            {t.type === 'income' ? '↑ Income' : '↓ Expense'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{t.category?.replace(/_/g, ' ')}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                                    <TableCell className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                    </TableCell>
                                    <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => { setEditTxn(t); setFormTxn({ ...t }); }}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTxn(t)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Transaction */}
            <Dialog open={!!editTxn} onOpenChange={() => setEditTxn(null)}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader><DialogTitle>Edit Transaction</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Amount (₹) <span className="text-destructive">*</span></Label><Input type="number" value={formTxn?.amount || ''} onChange={(e) => setFormTxn({ ...formTxn, amount: e.target.value })} /></div>
                                <div className="grid gap-2"><Label>Date <span className="text-destructive">*</span></Label><Input type="date" value={formTxn?.date || ''} onChange={(e) => setFormTxn({ ...formTxn, date: e.target.value })} /></div>
                            </div>
                            {formTxn?.category === 'project_payment' && (
                                <div className="grid gap-2"><Label>Select Project</Label>
                                    <Select value={formTxn?.project_id ? String(formTxn.project_id) : ''} onValueChange={(v) => setFormTxn({ ...formTxn, project_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.project_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid gap-2"><Label>Description</Label><Textarea value={formTxn?.description || ''} onChange={(e) => setFormTxn({ ...formTxn, description: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleEdit}>Save Changes</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Transaction */}
            <Dialog open={!!deleteTxn} onOpenChange={() => setDeleteTxn(null)}>
                <DialogContent className="sm:max-w-[400px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                        <DialogDescription>Are you sure you want to delete this transaction?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTxn(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Transaction */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[500px] sm:max-h-[80vh] flex flex-col">
                    <DialogHeader><DialogTitle>Add Transaction</DialogTitle></DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Type <span className="text-destructive">*</span></Label>
                                    <Select value={newTxn.type} onValueChange={(v) => setNewTxn({ ...newTxn, type: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Category <span className="text-destructive">*</span></Label>
                                    <Select value={newTxn.category} onValueChange={(v) => { setNewTxn({ ...newTxn, category: v, project_id: v === 'project_payment' ? newTxn.project_id : '' }); }}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['project_payment', 'freelance', 'salary', 'software', 'hosting', 'office', 'marketing', 'other'].map(c => (
                                                <SelectItem key={c} value={c}>{c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {(newTxn.category === 'project_payment' || newTxn.type === 'expense') && (
                                <div className="grid gap-2"><Label>{newTxn.type === 'expense' ? 'Link to Project (optional)' : 'Select Project'}</Label>
                                    <Select value={newTxn.project_id ? String(newTxn.project_id) : ''} onValueChange={(v) => setNewTxn({ ...newTxn, project_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                                        <SelectContent>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={String(p.id)}>{p.project_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Amount (₹) <span className="text-destructive">*</span></Label><Input type="number" value={newTxn.amount} onChange={(e) => setNewTxn({ ...newTxn, amount: e.target.value })} /></div>
                                <div className="grid gap-2"><Label>Date <span className="text-destructive">*</span></Label><Input type="date" value={newTxn.date} onChange={(e) => setNewTxn({ ...newTxn, date: e.target.value })} /></div>
                            </div>
                            <div className="grid gap-2"><Label>Description</Label><Textarea value={newTxn.description} onChange={(e) => setNewTxn({ ...newTxn, description: e.target.value })} /></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label>Payment Method</Label>
                                    <Select value={newTxn.payment_method} onValueChange={(v) => setNewTxn({ ...newTxn, payment_method: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['bank_transfer', 'upi', 'card', 'cash', 'other'].map(m => (
                                                <SelectItem key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2"><Label>Reference</Label><Input value={newTxn.reference_number} onChange={(e) => setNewTxn({ ...newTxn, reference_number: e.target.value })} /></div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleCreate}>Record Transaction</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
