import { useState, useEffect } from "react";
import { leaveApi } from "@/api/leaveApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Calendar, TreePalm, X } from "lucide-react";

export default function Leaves() {
    const [leaves, setLeaves] = useState([]);
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApplyDialog, setShowApplyDialog] = useState(false);
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
    });

    useEffect(() => {
        fetchLeaves();
        fetchBalance();
    }, []);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await leaveApi.getMyLeaves();
            setLeaves(res.data.leaves || []);
        } catch (err) {
            console.error("Failed to fetch leaves:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await leaveApi.getMyBalance();
            setBalance(res.data.balance || null);
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    };

    const handleApply = async () => {
        if (!formData.leave_type || !formData.start_date || !formData.end_date || !formData.reason) {
            toast.error("All fields are required");
            return;
        }
        try {
            await leaveApi.apply(formData);
            toast.success("Leave request submitted");
            setShowApplyDialog(false);
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' });
            fetchLeaves();
            fetchBalance();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to apply");
        }
    };

    const handleCancel = async (id) => {
        try {
            await leaveApi.cancel(id);
            toast.success("Leave cancelled");
            fetchLeaves();
            fetchBalance();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel");
        }
    };

    const getStatusColor = (s) => {
        const m = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        };
        return m[s] || "";
    };

    const getTypeColor = (t) => {
        const m = {
            casual: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            sick: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
            earned: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            unpaid: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        };
        return m[t] || "";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leaves</h1>
                    <p className="text-muted-foreground">Manage your leave requests and balance.</p>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => setShowApplyDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Apply Leave
                </Button>
            </div>

            {/* Leave Balance Cards */}
            {balance && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                    {[
                        { type: 'Casual', data: balance.casual, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                        { type: 'Sick', data: balance.sick, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                        { type: 'Earned', data: balance.earned, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/10' },
                    ].map((item) => (
                        <Card key={item.type} className={item.bg}>
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{item.type} Leave</p>
                                        <div className={`text-3xl font-bold ${item.color} mt-1`}>
                                            {item.data.remaining}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            of {item.data.total} remaining
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground space-y-1">
                                        <div>Used: {item.data.used}</div>
                                        {item.data.pending > 0 && (
                                            <div className="text-yellow-600">Pending: {item.data.pending}</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Leave History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" /> Leave History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">Loading...</div>
                    ) : leaves.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <TreePalm className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">No leave history yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile card list */}
                            <div className="space-y-3 p-4 sm:hidden">
                                {leaves.map((l) => (
                                    <div key={l.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className={getTypeColor(l.leave_type)}>{l.leave_type?.toUpperCase()}</Badge>
                                                <Badge variant="outline" className={getStatusColor(l.status)}>{l.status?.toUpperCase()}</Badge>
                                            </div>
                                            {l.status === 'pending' && (
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 p-0 shrink-0" onClick={() => handleCancel(l.id)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(l.start_date).toLocaleDateString('en-IN')} — {new Date(l.end_date).toLocaleDateString('en-IN')} ({l.total_days} days)
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate">{l.reason}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Desktop table */}
                            <div className="hidden sm:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>From</TableHead>
                                            <TableHead>To</TableHead>
                                            <TableHead>Days</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaves.map((l) => (
                                            <TableRow key={l.id}>
                                                <TableCell><Badge variant="outline" className={getTypeColor(l.leave_type)}>{l.leave_type?.toUpperCase()}</Badge></TableCell>
                                                <TableCell>{new Date(l.start_date).toLocaleDateString('en-IN')}</TableCell>
                                                <TableCell>{new Date(l.end_date).toLocaleDateString('en-IN')}</TableCell>
                                                <TableCell>{l.total_days}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                                                <TableCell><Badge variant="outline" className={getStatusColor(l.status)}>{l.status?.toUpperCase()}</Badge></TableCell>
                                                <TableCell>
                                                    {l.status === 'pending' && (
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleCancel(l.id)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Apply Leave Dialog */}
            <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Apply for Leave</DialogTitle>
                        <DialogDescription>Submit a leave request for approval.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Leave Type</Label>
                            <Select
                                value={formData.leave_type}
                                onValueChange={(v) => setFormData({ ...formData, leave_type: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leave type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="casual">Casual Leave</SelectItem>
                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                    <SelectItem value="earned">Earned Leave</SelectItem>
                                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Reason</Label>
                            <Textarea
                                placeholder="Enter reason for leave..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
                        <Button onClick={handleApply}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
