import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Check, X, Clock, AlertCircle } from "lucide-react";
import { leaveApi } from "@/api/leaveApi";
import { toast } from "sonner";
import { format } from "date-fns";

export default function LeaveRequests() {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [rejectDialog, setRejectDialog] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await leaveApi.getAll();
            setLeaves(res.data.leaves || []);
        } catch (err) {
            console.error("Failed to fetch leaves:", err);
            toast.error("Failed to load leave requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setActionLoading(true);
            await leaveApi.approve(id);
            toast.success("Leave approved");
            fetchLeaves();
        } catch (err) {
            toast.error("Failed to approve leave");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        try {
            setActionLoading(true);
            await leaveApi.reject(rejectDialog.id, { reason: rejectReason });
            toast.success("Leave rejected");
            setRejectDialog(null);
            setRejectReason("");
            fetchLeaves();
        } catch (err) {
            toast.error("Failed to reject leave");
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "approved": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Approved</Badge>;
            case "rejected": return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Rejected</Badge>;
            case "cancelled": return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>;
            default: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
        }
    };

    const filteredLeaves = leaves.filter(leave => {
        const term = searchTerm.toLowerCase();
        const empName = `${leave.Employee?.User?.first_name || ''} ${leave.Employee?.User?.last_name || ''}`.toLowerCase();
        return empName.includes(term) ||
            leave.leave_type.toLowerCase().includes(term) ||
            leave.status.toLowerCase().includes(term);
    });

    const pendingLeaves = filteredLeaves.filter(l => l.status === 'pending');
    const pastLeaves = filteredLeaves.filter(l => l.status !== 'pending');

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2.5 top-2.5 sm:top-1/2 sm:-translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 h-9 sm:h-10 text-xs sm:text-sm"
                    />
                </div>
            </div>

            <Tabs defaultValue="pending">
                <TabsList>
                    <TabsTrigger value="pending" className="relative">
                        Pending requests
                        {pendingLeaves.length > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                {pendingLeaves.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    {/* Mobile cards */}
                    <div className="space-y-3 sm:hidden">
                        {pendingLeaves.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No pending leave requests.</div>
                        ) : pendingLeaves.map((leave) => (
                            <div key={leave.id} className="rounded-lg border bg-card p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                        {(leave.Employee?.User?.first_name?.[0] || '')}{(leave.Employee?.User?.last_name?.[0] || '')}
                                    </div>
                                    <div>
                                        <div className="font-medium">{leave.Employee?.User?.first_name} {leave.Employee?.User?.last_name}</div>
                                        <div className="text-xs text-muted-foreground capitalize">{leave.leave_type} · {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">{format(new Date(leave.start_date), "MMM d")} – {format(new Date(leave.end_date), "MMM d, yyyy")}</div>
                                {leave.reason && <div className="text-sm text-muted-foreground line-clamp-2">{leave.reason}</div>}
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialog(leave)} disabled={actionLoading}><X className="h-4 w-4 mr-1" />Reject</Button>
                                    <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(leave.id)} disabled={actionLoading}><Check className="h-4 w-4 mr-1" />Approve</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden sm:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Requested On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLeaves.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No pending leave requests.</TableCell></TableRow>
                                ) : (
                                    pendingLeaves.map((leave) => (
                                        <TableRow key={leave.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{(leave.Employee?.User?.first_name?.[0] || '')}{(leave.Employee?.User?.last_name?.[0] || '')}</div>
                                                    <div><div className="font-medium">{leave.Employee?.User?.first_name} {leave.Employee?.User?.last_name}</div><div className="text-xs text-muted-foreground">{leave.Employee?.designation}</div></div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{leave.leave_type}</TableCell>
                                            <TableCell><div className="font-medium">{leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</div><div className="text-xs text-muted-foreground">{format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}</div></TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={leave.reason}>{leave.reason}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{format(new Date(leave.created_at), "MMM d, yyyy")}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setRejectDialog(leave)} disabled={actionLoading}><X className="h-4 w-4 mr-1" /> Reject</Button>
                                                    <Button size="sm" className="h-8 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(leave.id)} disabled={actionLoading}><Check className="h-4 w-4 mr-1" /> Approve</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    {/* Mobile cards */}
                    <div className="space-y-3 sm:hidden">
                        {pastLeaves.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No past leave requests found.</div>
                        ) : pastLeaves.map((leave) => (
                            <div key={leave.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium">{leave.Employee?.User?.first_name} {leave.Employee?.User?.last_name}</div>
                                    {getStatusBadge(leave.status)}
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">{leave.leave_type} · {leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(leave.start_date), "MMM d")} – {format(new Date(leave.end_date), "MMM d, yyyy")}</div>
                                {leave.reason && <div className="text-sm text-muted-foreground line-clamp-2">{leave.reason}</div>}
                                {leave.status === 'rejected' && leave.rejection_reason && <div className="text-xs text-red-500">Reason: {leave.rejection_reason}</div>}
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden sm:block rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Processed By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pastLeaves.length === 0 ? (
                                    <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No past leave requests found.</TableCell></TableRow>
                                ) : (
                                    pastLeaves.map((leave) => (
                                        <TableRow key={leave.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">{(leave.Employee?.User?.first_name?.[0] || '')}{(leave.Employee?.User?.last_name?.[0] || '')}</div>
                                                    <div className="font-medium">{leave.Employee?.User?.first_name} {leave.Employee?.User?.last_name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{leave.leave_type}</TableCell>
                                            <TableCell><div className="font-medium">{leave.total_days} day{leave.total_days !== 1 ? 's' : ''}</div><div className="text-xs text-muted-foreground">{format(new Date(leave.start_date), "MMM d")} - {format(new Date(leave.end_date), "MMM d, yyyy")}</div></TableCell>
                                            <TableCell className="max-w-[200px] truncate" title={leave.reason}>{leave.reason}{leave.status === 'rejected' && leave.rejection_reason && <div className="text-xs text-red-500 mt-1">Reason: {leave.rejection_reason}</div>}</TableCell>
                                            <TableCell>{getStatusBadge(leave.status)}</TableCell>
                                            <TableCell className="text-right text-xs text-muted-foreground">{leave.approved_at ? format(new Date(leave.approved_at), "MMM d, yyyy") : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Reject Dialog */}
            <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
                <DialogContent className="sm:max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Reject Leave Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this leave request? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                        <Label htmlFor="reason" className="mb-2 block">Reason for rejection <span className="text-destructive">*</span></Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
                            {actionLoading ? 'Rejecting...' : 'Reject Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
