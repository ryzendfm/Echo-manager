import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Link2, StickyNote } from "lucide-react";
import { scrumCallApi } from "@/api/scrumCallApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";
import { format } from "date-fns";
import CreateScrumCallDialog from "./CreateScrumCallDialog";
import ScrumCallDetailDialog from "./ScrumCallDetailDialog";
import ScrumCallNotesDialog from "./ScrumCallNotesDialog";

const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

const selectionLabels = { all: "All Employees", individual: "Selected", team: "Team" };

const normalizeUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

function ParticipantAvatars({ participants, max = 4 }) {
    const shown = (participants || []).slice(0, max);
    const remaining = (participants || []).length - max;
    return (
        <div className="flex items-center -space-x-2">
            {shown.map(p => {
                const user = p.Employee?.User;
                return (
                    <Avatar key={p.id} className="h-7 w-7 border-2 border-background shrink-0">
                        <AvatarImage src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}/${user.avatar}`) : ''} />
                        <AvatarFallback className="text-[10px]">{user?.first_name?.[0]}{user?.last_name?.[0]}</AvatarFallback>
                    </Avatar>
                );
            })}
            {remaining > 0 && (
                <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                    +{remaining}
                </div>
            )}
        </div>
    );
}

export default function ScrumCalls() {
    const [scrumCalls, setScrumCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Dialog state
    const [showCreate, setShowCreate] = useState(false);
    const [editCall, setEditCall] = useState(null);
    const [viewCall, setViewCall] = useState(null);
    const [notesCall, setNotesCall] = useState(null);

    useEffect(() => { fetchScrumCalls(); }, []);

    const fetchScrumCalls = async () => {
        try {
            setLoading(true);
            const res = await scrumCallApi.getAll();
            setScrumCalls(res.data.scrumCalls || []);
        } catch (err) {
            console.error("Failed to fetch scrum calls:", err);
            toast.error("Failed to load scrum calls");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await scrumCallApi.updateStatus(id, { status });
            toast.success(`Scrum call ${status.replace("_", " ")}`);
            fetchScrumCalls();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        try {
            await scrumCallApi.delete(id);
            toast.success("Scrum call deleted");
            fetchScrumCalls();
        } catch (err) {
            toast.error("Failed to delete scrum call");
        }
    };

    const filteredCalls = scrumCalls.filter(sc => {
        const matchesStatus = statusFilter === "all" || sc.status === statusFilter;
        if (!matchesStatus) return false;
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return sc.title?.toLowerCase().includes(term) || sc.scrum_uid?.toLowerCase().includes(term);
    });

    const getStatusBadge = (s) => {
        const cfg = statusConfig[s] || statusConfig.scheduled;
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
    };

    const renderActions = (sc) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewCall(sc)}>View Details</DropdownMenuItem>
                {sc.status !== "cancelled" && sc.status !== "completed" && (
                    <DropdownMenuItem onClick={() => { setEditCall(sc); }}>Edit</DropdownMenuItem>
                )}
                {sc.status === "scheduled" && (
                    <DropdownMenuItem onClick={() => handleStatusChange(sc.id, "in_progress")}>Start Call</DropdownMenuItem>
                )}
                {sc.status === "in_progress" && (
                    <DropdownMenuItem onClick={() => handleStatusChange(sc.id, "completed")}>Mark Completed</DropdownMenuItem>
                )}
                {sc.status !== "cancelled" && sc.status !== "completed" && (
                    <DropdownMenuItem onClick={() => handleStatusChange(sc.id, "cancelled")} className="text-destructive">Cancel</DropdownMenuItem>
                )}
                {sc.status === "completed" && (
                    <DropdownMenuItem onClick={() => setNotesCall(sc)}>
                        <StickyNote className="mr-2 h-4 w-4" /> Notes
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(sc.id)} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="space-y-4">
            {/* Search + Filter + Create Button */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2">
                    <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 sm:top-1/2 sm:-translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="search" placeholder="Search scrum calls..." className="w-full pl-8 h-9 sm:h-10 text-xs sm:text-sm"
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
                    <Plus className="mr-2 h-4 w-4" />New Scrum Call
                </Button>
            </div>

            {/* Mobile card list */}
            <div className="space-y-3 sm:hidden">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading scrum calls...</div>
                ) : filteredCalls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No scrum calls found.</div>
                ) : (
                    filteredCalls.map(sc => {
                        const d = new Date(sc.scheduled_at);
                        return (
                            <div key={sc.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="font-semibold">{sc.title}</div>
                                        <div className="text-xs text-muted-foreground">{sc.scrum_uid}</div>
                                    </div>
                                    {renderActions(sc)}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                    <span>{format(d, "MMM d, yyyy")}</span>
                                    <span>·</span>
                                    <span>{format(d, "h:mm a")}</span>
                                    <span>·</span>
                                    <span>{sc.duration_minutes} min</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(sc.status)}
                                    <Badge variant="outline" className="text-[10px] px-1.5 capitalize">{selectionLabels[sc.selection_type]}</Badge>
                                </div>
                                <ParticipantAvatars participants={sc.participants} max={5} />
                                {sc.meeting_link && (
                                    <a href={normalizeUrl(sc.meeting_link)} target="_blank" rel="noopener noreferrer"
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
                            <TableHead>Scrum Call</TableHead>
                            <TableHead>Schedule</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Participants</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">Loading scrum calls...</TableCell></TableRow>
                        ) : filteredCalls.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No scrum calls found.</TableCell></TableRow>
                        ) : (
                            filteredCalls.map(sc => {
                                const d = new Date(sc.scheduled_at);
                                return (
                                    <TableRow key={sc.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{sc.title}</span>
                                                <span className="text-xs text-muted-foreground">{sc.scrum_uid}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <span>{format(d, "MMM d, yyyy")}</span>
                                                <span className="text-xs text-muted-foreground">{format(d, "h:mm a")} · {sc.duration_minutes} min</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-xs">{selectionLabels[sc.selection_type]}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <ParticipantAvatars participants={sc.participants} max={4} />
                                        </TableCell>
                                        <TableCell>
                                            {sc.meeting_link ? (
                                                <a href={normalizeUrl(sc.meeting_link)} target="_blank" rel="noopener noreferrer"
                                                    className="text-primary hover:underline text-sm flex items-center gap-1">
                                                    <Link2 className="h-3.5 w-3.5" /> Join
                                                </a>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(sc.status)}</TableCell>
                                        <TableCell className="text-right">{renderActions(sc)}</TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Dialog */}
            <CreateScrumCallDialog
                open={showCreate || !!editCall}
                onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditCall(null); } }}
                scrumCall={editCall}
                onSuccess={fetchScrumCalls}
            />

            <ScrumCallDetailDialog
                open={!!viewCall}
                onOpenChange={(open) => { if (!open) setViewCall(null); }}
                scrumCall={viewCall}
                onEdit={(sc) => setEditCall(sc)}
                onSuccess={() => { fetchScrumCalls(); }}
            />

            {/* Notes Dialog */}
            <ScrumCallNotesDialog
                open={!!notesCall}
                onOpenChange={(open) => { if (!open) setNotesCall(null); }}
                scrumCall={notesCall}
                onSuccess={fetchScrumCalls}
            />
        </div>
    );
}
