import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, Upload, FileText, Lock, X } from "lucide-react";
import { projectApi } from "@/api/projectApi";
import { projectPhaseApi } from "@/api/projectPhaseApi";
import { invoiceApi } from "@/api/invoiceApi";
import api, { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const getPhaseStatusBadge = (status) => {
    const m = {
        unpaid: { label: 'Unpaid', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
        partial: { label: 'Partially Paid', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
        paid: { label: 'Fully Paid', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    };
    const s = m[status] || m.unpaid;
    return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
};

const getProjectStatusColor = (status) => {
    const m = { in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", planning: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", on_hold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
    return m[status] || "";
};

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [phases, setPhases] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Payment modal
    const [paymentPhase, setPaymentPhase] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', notes: '' });
    const [receiptFile, setReceiptFile] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [completeDialog, setCompleteDialog] = useState(false);

    useEffect(() => { fetchData(); }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projRes, phaseRes, empRes, invRes] = await Promise.all([
                projectApi.getById(id),
                projectPhaseApi.getPhases(id),
                projectApi.getProjectEmployees(id).catch(() => ({ data: { employees: [] } })),
                invoiceApi.getAll({ project_id: id }).catch(() => ({ data: { invoices: [] } })),
            ]);
            setProject(projRes.data.project);
            setPhases(phaseRes.data.phases || []);
            setEmployees(empRes.data.employees || []);
            setInvoices(invRes.data.invoices || []);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load project");
        } finally {
            setLoading(false);
        }
    };

    const totalBudget = parseFloat(project?.total_budget || project?.budget_estimated || 0);
    const totalCollected = phases.reduce((s, p) => s + parseFloat(p.amount_paid || 0), 0);
    const progressPct = totalBudget > 0 ? Math.min((totalCollected / totalBudget) * 100, 100) : 0;
    const allPhasesPaid = phases.length > 0 && phases.every(p => p.status === 'paid');

    // Check if a phase can be updated (sequential locking)
    const canUpdatePhase = (phaseIndex) => {
        if (phaseIndex === 0) return true;
        // Previous phase must be 'paid'
        return phases[phaseIndex - 1]?.status === 'paid';
    };

    const handleRecordPayment = async () => {
        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        try {
            setPaymentLoading(true);

            // Build FormData to support receipt upload
            const formData = new FormData();
            formData.append('amount', paymentForm.amount);
            formData.append('payment_date', paymentForm.payment_date);
            formData.append('payment_method', paymentForm.payment_method);
            formData.append('notes', paymentForm.notes || '');
            formData.append('project_id', id);
            if (receiptFile) {
                formData.append('receipt', receiptFile);
            }

            await api.post(`/project-phases/${paymentPhase.id}/payments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success("Payment recorded");
            setPaymentPhase(null);
            setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', notes: '' });
            setReceiptFile(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to record payment");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        try {
            await projectApi.update(id, { status: 'completed' });
            toast.success("Project marked as complete");
            setCompleteDialog(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to update project status");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading project...</div>;
    }

    if (!project) {
        return <div className="flex items-center justify-center h-64 text-muted-foreground">Project not found</div>;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/admin/projects')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">{project.project_name}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">{project.project_uid}</p>
                </div>
            </div>

            {/* Project Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                <Card><CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Status</p>
                    <Badge variant="outline" className={`mt-1 text-[10px] sm:text-xs ${getProjectStatusColor(project.status)}`}>{project.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                </CardContent></Card>
                <Card><CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Priority</p>
                    <p className="font-semibold capitalize text-sm mt-1">{project.priority}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Deadline</p>
                    <p className="font-semibold text-sm mt-1">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total Budget</p>
                    <p className="font-semibold text-sm mt-1">{fmt(totalBudget)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Client</p>
                    <p className="font-semibold text-sm mt-1 truncate">{project.Client?.company_name || '—'}</p>
                </CardContent></Card>
            </div>

            {/* Description */}
            {project.description && (
                <Card><CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{project.description}</p>
                </CardContent></Card>
            )}

            {/* Tech Stack */}
            {project.tech_stack && (Array.isArray(project.tech_stack) ? project.tech_stack.length > 0 : project.tech_stack) && (
                <div className="flex flex-wrap gap-1">
                    {(Array.isArray(project.tech_stack) ? project.tech_stack : [project.tech_stack]).map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                </div>
            )}

            {/* Attachment */}
            {project.file_attachments && (
                <Card><CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Attachment</p>
                    <a href={project.file_attachments.startsWith('http') ? project.file_attachments : `${BACKEND_URL}/${project.file_attachments}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline text-xs truncate">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        {project.file_attachments.split('/').pop()}
                    </a>
                </CardContent></Card>
            )}

            {/* Team Members */}
            <Card>
                <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No employees assigned to this project.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {employees.map(emp => (
                                <div key={emp.id} className="flex items-center gap-2 border rounded-lg px-3 py-2">
                                    {emp.user?.avatar ? (
                                        <img src={emp.user.avatar.startsWith('http') ? emp.user.avatar : `${BACKEND_URL}/${emp.user.avatar}`} alt="" className="h-7 w-7 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                            {emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{emp.user?.first_name} {emp.user?.last_name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{emp.designation || emp.department || ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Progress */}
            <Card>
                <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">Payment Progress</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span>{fmt(totalCollected)} collected</span>
                            <span>{fmt(totalBudget)} total</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground text-right">{progressPct.toFixed(1)}% collected</p>
                    </div>
                </CardContent>
            </Card>

            {/* Phase Payments — Sequential Locking */}
            <Card>
                <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">Phase Payments</CardTitle>
                </CardHeader>
                <CardContent>
                    {phases.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No phases configured. Edit the project to add phases.</p>
                    ) : (
                        <>
                            {/* Mobile */}
                            <div className="space-y-3 sm:hidden">
                                {phases.map((phase, idx) => {
                                    const phaseAmt = parseFloat(phase.phase_amount || 0);
                                    const phasePaid = parseFloat(phase.amount_paid || 0);
                                    const isLocked = !canUpdatePhase(idx);
                                    const isDone = phase.status === 'paid';
                                    return (
                                        <div key={phase.id} className={`border rounded-lg p-3 space-y-2 ${isLocked ? 'opacity-60' : ''}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        {isLocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                                                        <p className="font-medium text-sm truncate">{phase.phase_name}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{fmt(phasePaid)} / {fmt(phaseAmt)}</p>
                                                </div>
                                                {getPhaseStatusBadge(phase.status)}
                                            </div>
                                            {phaseAmt > 0 && (
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((phasePaid / phaseAmt) * 100, 100)}%` }} />
                                                </div>
                                            )}
                                            {/* Show receipt links */}
                                            {phase.payments?.filter(p => p.receipt_path).map(p => (
                                                <a key={p.id} href={`${BACKEND_URL}/${p.receipt_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline">
                                                    <FileText className="h-3 w-3" /> Receipt
                                                </a>
                                            ))}
                                            {!isDone && !isLocked && (
                                                <Button size="sm" className="w-full" onClick={() => setPaymentPhase(phase)}>Update Payment</Button>
                                            )}
                                            {isLocked && !isDone && (
                                                <p className="text-[10px] text-muted-foreground text-center">Complete previous phase first</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop */}
                            <div className="hidden sm:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Phase</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead>Remaining</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Receipt</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {phases.map((phase, idx) => {
                                            const phaseAmt = parseFloat(phase.phase_amount || 0);
                                            const phasePaid = parseFloat(phase.amount_paid || 0);
                                            const remaining = Math.max(phaseAmt - phasePaid, 0);
                                            const isLocked = !canUpdatePhase(idx);
                                            const isDone = phase.status === 'paid';
                                            return (
                                                <TableRow key={phase.id} className={isLocked && !isDone ? 'opacity-50' : ''}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            {isLocked && !isDone && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                                                            {phase.phase_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{fmt(phaseAmt)}</TableCell>
                                                    <TableCell className="text-green-600">{fmt(phasePaid)}</TableCell>
                                                    <TableCell className={remaining > 0 ? 'text-orange-600' : 'text-green-600'}>{fmt(remaining)}</TableCell>
                                                    <TableCell>{getPhaseStatusBadge(phase.status)}</TableCell>
                                                    <TableCell>
                                                        {phase.payments?.filter(p => p.receipt_path).map(p => (
                                                            <a key={p.id} href={`${BACKEND_URL}/${p.receipt_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary underline mr-2">
                                                                <FileText className="h-3 w-3" /> View
                                                            </a>
                                                        ))}
                                                        {(!phase.payments || phase.payments.filter(p => p.receipt_path).length === 0) && (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {isDone ? (
                                                            <span className="text-xs text-green-600 font-medium">Completed</span>
                                                        ) : isLocked ? (
                                                            <span className="text-xs text-muted-foreground">Locked</span>
                                                        ) : (
                                                            <Button size="sm" variant="outline" onClick={() => setPaymentPhase(phase)}>Update Payment</Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Invoices */}
            {invoices.length > 0 && (
                <Card>
                    <CardHeader className="pb-2 sm:pb-3">
                        <CardTitle className="text-base sm:text-lg">Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Mobile */}
                        <div className="space-y-2 sm:hidden">
                            {invoices.map(inv => (
                                <div key={inv.id} className="border rounded-lg p-2 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{inv.invoice_uid}</p>
                                        <p className="text-xs text-muted-foreground">{fmt(inv.total_amount || inv.amount)}</p>
                                    </div>
                                    <Badge variant="outline" className={`text-[10px] ${getProjectStatusColor(inv.status)}`}>{inv.status?.replace(/_/g, ' ')}</Badge>
                                </div>
                            ))}
                        </div>
                        {/* Desktop */}
                        <div className="hidden sm:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map(inv => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="text-sm">{inv.invoice_uid}</TableCell>
                                            <TableCell className="text-sm text-right">{fmt(inv.total_amount || inv.amount)}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={`text-[10px] ${getProjectStatusColor(inv.status)}`}>{inv.status?.replace(/_/g, ' ')}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Mark Complete Button */}
            {allPhasesPaid && project.status !== 'completed' && (
                <Button size="lg" className="w-full bg-green-600 hover:bg-green-700" onClick={() => setCompleteDialog(true)}>
                    <CheckCircle className="mr-2 h-5 w-5" /> Mark Project as Complete
                </Button>
            )}

            {/* Update Payment Modal */}
            <Dialog open={!!paymentPhase} onOpenChange={() => { setPaymentPhase(null); setReceiptFile(null); }}>
                <DialogContent className="sm:max-w-[450px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>{paymentPhase?.phase_name} — {fmt(parseFloat(paymentPhase?.phase_amount || 0) - parseFloat(paymentPhase?.amount_paid || 0))} remaining</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid gap-4 p-1">
                            <div className="grid gap-2">
                                <Label>Amount Received (₹) <span className="text-destructive">*</span></Label>
                                <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Enter amount" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Payment Date</Label>
                                    <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payment Method</Label>
                                    <Select value={paymentForm.payment_method} onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['bank_transfer', 'upi', 'cash', 'cheque', 'card', 'other'].map(m => (
                                                <SelectItem key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Notes / Reference</Label>
                                <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Optional notes" rows={2} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Payment Receipt</Label>
                                {receiptFile ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate flex-1">{receiptFile.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReceiptFile(null)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Upload receipt (PDF, JPEG, PNG)</span>
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files[0]) setReceiptFile(e.target.files[0]); }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button className="w-full sm:w-auto" onClick={handleRecordPayment} disabled={paymentLoading}>{paymentLoading ? 'Recording...' : 'Record Payment'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete Confirmation */}
            <Dialog open={completeDialog} onOpenChange={setCompleteDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Mark Project as Complete</DialogTitle>
                        <DialogDescription>All phases are fully paid. Mark this project as complete?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCompleteDialog(false)}>Cancel</Button>
                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={handleMarkComplete}>Confirm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
