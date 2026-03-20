import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle, Upload, FileText, Lock, Pencil, Trash2, X } from "lucide-react";
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

export default function ProjectDetailDialog({ projectId, open, onClose }) {
    const [project, setProject] = useState(null);
    const [phases, setPhases] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Payment dialog
    const [paymentPhase, setPaymentPhase] = useState(null);
    const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', notes: '' });
    const [receiptFile, setReceiptFile] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Edit payment dialog
    const [editPaymentPhase, setEditPaymentPhase] = useState(null);
    const [editPaymentData, setEditPaymentData] = useState(null);
    const [editPaymentForm, setEditPaymentForm] = useState({ amount: '', payment_date: '', payment_method: 'bank_transfer', notes: '' });
    const [editPaymentLoading, setEditPaymentLoading] = useState(false);
    const [editReceiptFile, setEditReceiptFile] = useState(null);

    // Reset phase payments dialog
    const [resetPhase, setResetPhase] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);

    // Complete dialog
    const [completeDialog, setCompleteDialog] = useState(false);

    useEffect(() => {
        if (open && projectId) fetchData();
        if (!open) {
            setProject(null);
            setPhases([]);
            setEmployees([]);
            setInvoices([]);
            setLoading(true);
        }
    }, [open, projectId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projRes, phaseRes, empRes, invRes] = await Promise.all([
                projectApi.getById(projectId),
                projectPhaseApi.getPhases(projectId),
                projectApi.getProjectEmployees(projectId).catch(() => ({ data: { employees: [] } })),
                invoiceApi.getAll({ project_id: projectId }).catch(() => ({ data: { invoices: [] } })),
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

    const canUpdatePhase = (phaseIndex) => {
        if (phaseIndex === 0) return true;
        return phases[phaseIndex - 1]?.status === 'paid';
    };

    const handleRecordPayment = async () => {
        if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        try {
            setPaymentLoading(true);
            const formData = new FormData();
            formData.append('amount', paymentForm.amount);
            formData.append('payment_date', paymentForm.payment_date);
            formData.append('payment_method', paymentForm.payment_method);
            formData.append('notes', paymentForm.notes || '');
            formData.append('project_id', projectId);
            if (receiptFile) formData.append('receipt', receiptFile);

            await api.post(`/project-phases/${paymentPhase.id}/payments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success("Payment recorded");
            setPaymentPhase(null);
            setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'bank_transfer', notes: '' });
            setReceiptFile(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to record payment");
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleEditPayment = async () => {
        if (!editPaymentForm.amount || parseFloat(editPaymentForm.amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        try {
            setEditPaymentLoading(true);
            const formData = new FormData();
            formData.append('amount', editPaymentForm.amount);
            formData.append('payment_date', editPaymentForm.payment_date);
            formData.append('payment_method', editPaymentForm.payment_method);
            formData.append('notes', editPaymentForm.notes || '');
            if (editReceiptFile) {
                formData.append('receipt', editReceiptFile);
            }

            await projectPhaseApi.updatePayment(editPaymentPhase.id, editPaymentData.id, formData);
            toast.success("Payment updated");
            setEditPaymentPhase(null);
            setEditPaymentData(null);
            setEditReceiptFile(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update payment");
        } finally {
            setEditPaymentLoading(false);
        }
    };

    const handleResetPhasePayments = async () => {
        try {
            setResetLoading(true);
            await projectPhaseApi.resetPhasePayments(resetPhase.id);
            toast.success("Phase payments reset successfully");
            setResetPhase(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset payments");
        } finally {
            setResetLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        try {
            await projectApi.update(projectId, { status: 'completed' });
            toast.success("Project marked as complete");
            setCompleteDialog(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to update project status");
        }
    };

    const openEditPaymentDialog = (phase) => {
        // Get the latest payment for this phase
        const latestPayment = phase.payments?.length > 0
            ? phase.payments[phase.payments.length - 1]
            : null;
        if (!latestPayment) {
            toast.error("No payment to edit");
            return;
        }
        setEditPaymentForm({
            amount: latestPayment.amount || '',
            payment_date: latestPayment.payment_date || new Date().toISOString().split('T')[0],
            payment_method: latestPayment.payment_method || 'bank_transfer',
            notes: latestPayment.notes || '',
        });
        setEditPaymentData(latestPayment);
        setEditPaymentPhase(phase);
        setEditReceiptFile(null);
    };

    // Calculate rolling budgets for phases
    let _runningBudget = totalBudget;
    const enrichedPhases = phases.map((phase) => {
        const pPaid = parseFloat(phase.amount_paid || 0);
        const pAmt = _runningBudget;
        const pRem = Math.max(pAmt - pPaid, 0);
        _runningBudget = pRem;
        return { ...phase, _calcAmount: pAmt, _calcPaid: pPaid, _calcRemaining: pRem };
    });

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
                <DialogContent className="w-full h-[100dvh] max-w-[100vw] sm:w-[90vw] sm:max-w-[900px] sm:h-auto sm:max-h-[90vh] border-0 sm:border rounded-none sm:rounded-lg flex flex-col p-0 shadow-none sm:shadow-lg">
                    <DialogTitle className="sr-only">{project?.project_name || 'Project Details'}</DialogTitle>
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">Loading project...</div>
                    ) : !project ? (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">Project not found</div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-3 border-b shrink-0 pr-12">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="text-xl sm:text-xl font-bold tracking-tight truncate">{project.project_name}</h2>
                                        <p className="text-xs text-muted-foreground mt-1 sm:mt-0.5">{project.project_uid} {project.Client?.company_name ? `• ${project.Client.company_name}` : ''}</p>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 text-[10px] sm:text-xs ${getProjectStatusColor(project.status)}`}>{project.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                                </div>

                                {/* Desktop stats */}
                                <div className="hidden sm:flex flex-wrap gap-x-5 gap-y-1 mt-3 pb-1 text-xs text-muted-foreground">
                                    <span>Priority: <span className="text-foreground font-medium capitalize">{project.priority}</span></span>
                                    <span>Deadline: <span className="text-foreground font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : '—'}</span></span>
                                    <span>Budget: <span className="text-foreground font-medium">{fmt(totalBudget)}</span></span>
                                    <span>Collected: <span className="text-green-600 font-medium">{fmt(totalCollected)}</span></span>
                                </div>

                                {/* Mobile stats */}
                                <div className="grid grid-cols-2 gap-2.5 mt-4 sm:hidden">
                                    {[
                                        { label: 'Priority', value: project.priority, className: 'capitalize' },
                                        { label: 'Deadline', value: project.deadline ? new Date(project.deadline).toLocaleDateString() : '—' },
                                        { label: 'Budget', value: fmt(totalBudget) },
                                        { label: 'Collected', value: fmt(totalCollected), className: 'text-green-600' },
                                    ].map(stat => (
                                        <div key={stat.label} className="rounded-xl bg-muted/30 p-3 flex flex-col items-center justify-center text-center gap-0.5">
                                            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">{stat.label}</span>
                                            <span className={`text-sm font-bold ${stat.className || ''}`}>{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto styled-scrollbar px-5 sm:px-6 py-5 sm:py-5 space-y-6 sm:space-y-5">

                                {/* Description */}
                                {project.description && (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-1.5 sm:mb-1">Description</p>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed sm:leading-normal">{project.description}</p>
                                    </div>
                                )}

                                {/* Tech Stack + Attachment */}
                                {(project.tech_stack || project.file_attachments) && (
                                    <div className="flex flex-wrap items-center gap-2">
                                        {project.tech_stack && (Array.isArray(project.tech_stack) ? project.tech_stack : [project.tech_stack]).filter(Boolean).map(t => (
                                            <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                                        ))}
                                        {project.file_attachments && (
                                            <a href={project.file_attachments.startsWith('http') ? project.file_attachments : `${BACKEND_URL}/${project.file_attachments}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline text-xs">
                                                <FileText className="h-3 w-3" /> Attachment
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Team Members */}
                                {employees.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-2.5 sm:mb-2">Team Members</p>
                                        {/* Mobile: horizontal scroll chips */}
                                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap sm:overflow-visible">
                                            {employees.map(emp => (
                                                <div key={emp.id} className="flex items-center gap-2.5 rounded-full bg-muted/40 pl-1 pr-3.5 py-1 shrink-0 sm:rounded-lg sm:bg-transparent sm:border sm:px-3 sm:py-2 sm:shrink">
                                                    {emp.user?.avatar ? (
                                                        <img src={emp.user.avatar.startsWith('http') ? emp.user.avatar : `${BACKEND_URL}/${emp.user.avatar}`} alt="" className="h-7 w-7 sm:h-6 sm:w-6 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="h-7 w-7 sm:h-6 sm:w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary shrink-0">
                                                            {emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium truncate">{emp.user?.first_name} {emp.user?.last_name}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{emp.designation || ''}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Payment Progress Bar */}
                                <div>
                                    <div className="flex justify-between text-xs mb-2 sm:mb-1.5">
                                        <span className="text-muted-foreground font-medium">Payment Progress</span>
                                        <span className="font-semibold">{progressPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                                    </div>
                                </div>

                                {/* Phase Payments */}
                                {phases.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-3 sm:mb-2">Phase Payments</p>

                                        {/* Mobile cards */}
                                        <div className="space-y-3 sm:hidden">
                                            {enrichedPhases.map((phase, idx) => {
                                                const phaseAmt = phase._calcAmount;
                                                const phasePaid = phase._calcPaid;
                                                const remaining = phase._calcRemaining;
                                                const isLocked = !canUpdatePhase(idx);
                                                const isDone = phase.status === 'paid';

                                                return (
                                                    <div key={phase.id} className={`rounded-2xl bg-muted/20 p-4 space-y-3 ${isLocked && !isDone ? 'opacity-40' : ''}`}>
                                                        {/* Top row: name + status */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                {isLocked && !isDone && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                                                                <span className="font-semibold text-sm truncate">{phase.phase_name}</span>
                                                            </div>
                                                            {getPhaseStatusBadge(phase.status)}
                                                        </div>

                                                        {/* Amount row - inline */}
                                                        <div className="flex items-center justify-between text-xs">
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">Amount</p>
                                                                <p className="font-semibold">{fmt(phaseAmt)}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">Paid</p>
                                                                <p className="font-semibold text-green-600">{fmt(phasePaid)}</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-muted-foreground mb-0.5">Remaining</p>
                                                                <p className={`font-semibold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>{fmt(remaining)}</p>
                                                            </div>
                                                        </div>

                                                        {/* Progress bar */}
                                                        {phaseAmt > 0 && (
                                                            <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((phasePaid / phaseAmt) * 100, 100)}%` }} />
                                                            </div>
                                                        )}

                                                        {/* Receipt links */}
                                                        {phase.payments?.filter(p => p.receipt_path).length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {phase.payments.filter(p => p.receipt_path).map(p => (
                                                                    <a key={p.id} href={`${BACKEND_URL}/${p.receipt_path}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary font-medium px-2.5 py-1 bg-primary/5 rounded-full">
                                                                        <FileText className="h-3 w-3" /> Receipt
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Action buttons */}
                                                        <div className="flex gap-2 pt-0.5">
                                                            {!isLocked && !isDone && (
                                                                <Button size="sm" className="flex-1 h-10 text-xs rounded-xl" onClick={() => setPaymentPhase(phase)}>Update Payment</Button>
                                                            )}
                                                            {isLocked && !isDone && (
                                                                <p className="flex-1 text-[11px] text-muted-foreground text-center py-2">Complete previous phase first</p>
                                                            )}
                                                            {phase.payments?.length > 0 && (
                                                                <Button size="sm" variant="outline" className="h-10 w-10 p-0 shrink-0 rounded-xl" onClick={() => openEditPaymentDialog(phase)}>
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                            {phase.payments?.length > 0 && (
                                                                <Button size="sm" variant="outline" className="h-10 w-10 p-0 shrink-0 rounded-xl text-destructive hover:text-destructive" onClick={() => setResetPhase(phase)}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Desktop table */}
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
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {enrichedPhases.map((phase, idx) => {
                                                        const phaseAmt = phase._calcAmount;
                                                        const phasePaid = phase._calcPaid;
                                                        const remaining = phase._calcRemaining;
                                                        const isLocked = !canUpdatePhase(idx);
                                                        const isDone = phase.status === 'paid';
                                                        const hasPayments = phase.payments && phase.payments.length > 0;
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
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        {!isLocked && !isDone && (
                                                                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPaymentPhase(phase)}>Pay</Button>
                                                                        )}
                                                                        {phase.payments?.length > 0 && (
                                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditPaymentDialog(phase)}>
                                                                                <Pencil className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        )}
                                                                        {phase.payments?.length > 0 && (
                                                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => setResetPhase(phase)}>
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Invoices */}
                                {invoices.length > 0 && (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium mb-3 sm:mb-2">Invoices</p>
                                        <div className="space-y-2 sm:hidden">
                                            {invoices.map(inv => (
                                                <div key={inv.id} className="rounded-xl bg-muted/20 px-4 py-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium">{inv.invoice_uid}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{fmt(inv.total_amount || inv.amount)}</p>
                                                    </div>
                                                    <Badge variant="outline" className={`text-[10px] ${getProjectStatusColor(inv.status)}`}>{inv.status?.replace(/_/g, ' ')}</Badge>
                                                </div>
                                            ))}
                                        </div>
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
                                    </div>
                                )}

                                {/* Mark Complete */}
                                {allPhasesPaid && project.status !== 'completed' && (
                                    <Button className="w-full h-12 sm:h-11 bg-green-600 hover:bg-green-700 text-sm rounded-xl sm:rounded-md" onClick={() => setCompleteDialog(true)}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark Project as Complete
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment sub-dialog */}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                    <div className="flex items-center gap-2 rounded-md border p-2.5">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate flex-1">{receiptFile.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setReceiptFile(null)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50 transition-colors">
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

            {/* Edit payment sub-dialog */}
            <Dialog open={!!editPaymentPhase} onOpenChange={() => { setEditPaymentPhase(null); setEditPaymentData(null); setEditReceiptFile(null); }}>
                <DialogContent className="sm:max-w-[450px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Payment</DialogTitle>
                        <DialogDescription>{editPaymentPhase?.phase_name} — Update payment details</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid gap-4 p-1">
                            <div className="grid gap-2">
                                <Label>Amount (₹) <span className="text-destructive">*</span></Label>
                                <Input type="number" value={editPaymentForm.amount} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, amount: e.target.value })} placeholder="Enter amount" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label>Payment Date</Label>
                                    <Input type="date" value={editPaymentForm.payment_date} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, payment_date: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payment Method</Label>
                                    <Select value={editPaymentForm.payment_method} onValueChange={(v) => setEditPaymentForm({ ...editPaymentForm, payment_method: v })}>
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
                                <Textarea value={editPaymentForm.notes} onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })} placeholder="Optional notes" rows={2} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Payment Receipt</Label>
                                {editPaymentData?.receipt_path && !editReceiptFile && (
                                    <div className="text-xs mb-1 p-2 border rounded-md bg-muted/30">
                                        <span className="text-muted-foreground mr-2">Current receipt:</span>
                                        <a href={`${BACKEND_URL}/${editPaymentData.receipt_path}`} target="_blank" rel="noreferrer" className="text-primary underline inline-flex items-center">
                                            <FileText className="h-3 w-3 mr-1" /> View Receipt
                                        </a>
                                    </div>
                                )}
                                {editReceiptFile ? (
                                    <div className="flex items-center gap-2 rounded-md border p-2.5">
                                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm truncate flex-1">{editReceiptFile.name}</span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setEditReceiptFile(null)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Replace receipt (PDF, JPEG, PNG)</span>
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { if (e.target.files[0]) setEditReceiptFile(e.target.files[0]); }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setEditPaymentPhase(null); setEditPaymentData(null); setEditReceiptFile(null); }}>Cancel</Button>
                        <Button onClick={handleEditPayment} disabled={editPaymentLoading}>{editPaymentLoading ? 'Saving...' : 'Save Changes'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reset phase payments confirmation */}
            <Dialog open={!!resetPhase} onOpenChange={() => setResetPhase(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Reset Phase Payments</DialogTitle>
                        <DialogDescription>This will delete all payment records for "{resetPhase?.phase_name}" and reset its status to unpaid. The linked finance transactions will also be removed. This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => setResetPhase(null)}>Cancel</Button>
                        <Button variant="destructive" className="w-full sm:w-auto" onClick={handleResetPhasePayments} disabled={resetLoading}>{resetLoading ? 'Resetting...' : 'Reset Payments'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Complete confirmation */}
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
        </>
    );
}
