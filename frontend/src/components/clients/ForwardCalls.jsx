import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Link2, Building2 } from "lucide-react";
import { forwardCallApi } from "@/api/forwardCallApi";
import { toast } from "sonner";
import { format } from "date-fns";
import CreateForwardCallDialog from "./CreateForwardCallDialog";
import ForwardCallDetailDialog from "./ForwardCallDetailDialog";

const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ForwardCalls() {
    const [forwardCalls, setForwardCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [showCreate, setShowCreate] = useState(false);
    const [editCall, setEditCall] = useState(null);
    const [viewCall, setViewCall] = useState(null);

    useEffect(() => { fetchForwardCalls(); }, []);

    const fetchForwardCalls = async () => {
        try {
            setLoading(true);
            const res = await forwardCallApi.getAll();
            setForwardCalls(res.data.forwardCalls || []);
        } catch (err) {
            console.error("Failed to fetch forward calls:", err);
            toast.error("Failed to load forward calls");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await forwardCallApi.updateStatus(id, { status });
            toast.success(`Forward call ${status.replace("_", " ")}`);
            fetchForwardCalls();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        try {
            await forwardCallApi.delete(id);
            toast.success("Forward call deleted");
            fetchForwardCalls();
        } catch (err) {
            toast.error("Failed to delete forward call");
        }
    };

    const filteredCalls = forwardCalls.filter(fc => {
        const matchesStatus = statusFilter === "all" || fc.status === statusFilter;
        if (!matchesStatus) return false;
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return fc.title?.toLowerCase().includes(term) ||
            fc.forward_uid?.toLowerCase().includes(term) ||
            fc.Client?.company_name?.toLowerCase().includes(term);
    });

    const getStatusBadge = (s) => {
        const cfg = statusConfig[s] || statusConfig.scheduled;
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
    };

    const renderActions = (fc) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewCall(fc)}>View Details</DropdownMenuItem>
                {fc.status !== "cancelled" && fc.status !== "completed" && (
                    <DropdownMenuItem onClick={() => setEditCall(fc)}>Edit</DropdownMenuItem>
                )}
                {fc.status === "scheduled" && (
                    <DropdownMenuItem onClick={() => handleStatusChange(fc.id, "in_progress")}>Start Call</DropdownMenuItem>
                )}
                {fc.status === "in_progress" && (
                    <DropdownMenuItem onClick={() => handleStatusChange(fc.id, "completed")}>Mark Completed</DropdownMenuItem>
                )}
                {fc.status !== "cancelled" && fc.status !== "completed" && (
                    <DropdownMenuItem onClick={() => handleStatusChange(fc.id, "cancelled")} className="text-destructive">Cancel</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(fc.id)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-4">
            {/* Search + Filter + Create */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 sm:top-1/2 sm:-translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search forward calls..." className="w-full pl-8 h-9 sm:h-10 text-xs sm:text-sm"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="flex-1 sm:w-[150px] h-9 sm:h-10 text-xs sm:text-sm">
                                <SelectValue placeholder="Filter status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Button className="w-full sm:w-auto" onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />New Forward Call
                </Button>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading forward calls...</div>
                ) : filteredCalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No forward calls found.</div>
                ) : (
                    filteredCalls.map(fc => {
                        const d = new Date(fc.scheduled_at);
                        return (
                            <div key={fc.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">{fc.title}</div>
                                        <div className="text-xs text-muted-foreground">{fc.forward_uid}</div>
                                    </div>
                                    {renderActions(fc)}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>{format(d, "MMM d, yyyy")}</span>
                                    <span>·</span>
                                    <span>{format(d, "h:mm a")}</span>
                                    <span>·</span>
                                    <span>{fc.duration_minutes} min</span>
                                </div>
                                {fc.Client && (
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="truncate">{fc.Client.company_name}</span>
                                        <span className="text-xs text-muted-foreground">({fc.Client.client_uid})</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(fc.status)}
                                    {fc.status === "completed" && (
                                        <span className={`text-xs ${fc.attended ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                            {fc.attended ? "Attended" : "Not attended"}
                                        </span>
                                    )}
                                </div>
                                {fc.meeting_link && (
                                    <a href={fc.meeting_link} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                                        <Link2 className="h-3 w-3 shrink-0" /> Join Meeting
                                    </a>
                                )}
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
                            <TableHead>Forward Call</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Loading forward calls...</TableCell></TableRow>
                        ) : filteredCalls.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No forward calls found.</TableCell></TableRow>
                        ) : (
                            filteredCalls.map(fc => {
                                const d = new Date(fc.scheduled_at);
                                return (
                                    <TableRow key={fc.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{fc.title}</span>
                                                <span className="text-xs text-muted-foreground">{fc.forward_uid}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {fc.Client && (
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{fc.Client.company_name}</span>
                                                    <span className="text-xs text-muted-foreground">{fc.Client.client_uid}</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{format(d, "MMM d, yyyy")}</span>
                                                <span className="text-xs text-muted-foreground">{format(d, "h:mm a")} · {fc.duration_minutes} min</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {fc.meeting_link ? (
                                                <a href={fc.meeting_link} target="_blank" rel="noopener noreferrer"
                                                    className="text-primary hover:underline text-sm flex items-center gap-1">
                                                    <Link2 className="h-3.5 w-3.5" /> Join
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(fc.status)}</TableCell>
                                        <TableCell className="text-right">{renderActions(fc)}</TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Dialog */}
            <CreateForwardCallDialog
                open={showCreate || !!editCall}
                onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditCall(null); } }}
                forwardCall={editCall}
                onSuccess={fetchForwardCalls}
            />

            {/* View Detail Dialog */}
            <ForwardCallDetailDialog
                open={!!viewCall}
                onOpenChange={(open) => { if (!open) setViewCall(null); }}
                forwardCall={viewCall}
                onEdit={(fc) => setEditCall(fc)}
                onSuccess={fetchForwardCalls}
            />
        </div>
    );
}
