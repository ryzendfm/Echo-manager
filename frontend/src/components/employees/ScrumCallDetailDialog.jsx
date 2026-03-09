import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, Link2, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { scrumCallApi } from "@/api/scrumCallApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

const selectionLabels = { all: "All Employees", individual: "Selected Employees", team: "Team" };

const normalizeUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
};

export default function ScrumCallDetailDialog({ open, onOpenChange, scrumCall, onEdit, onSuccess }) {
    const [attendance, setAttendance] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (scrumCall?.participants) {
            const map = {};
            scrumCall.participants.forEach(p => { map[p.employee_id] = p.attended; });
            setAttendance(map);
        }
    }, [scrumCall]);

    if (!scrumCall) return null;

    const status = statusConfig[scrumCall.status] || statusConfig.scheduled;
    const scheduledDate = new Date(scrumCall.scheduled_at);
    const canMarkAttendance = scrumCall.status === "in_progress" || scrumCall.status === "completed";

    const toggleAttendance = (empId) => {
        if (!canMarkAttendance) return;
        setAttendance(prev => ({ ...prev, [empId]: !prev[empId] }));
    };

    const handleSaveAttendance = async () => {
        const attendees = Object.entries(attendance).map(([employee_id, attended]) => ({
            employee_id: Number(employee_id),
            attended,
        }));

        try {
            setSaving(true);
            await scrumCallApi.markAttendance(scrumCall.id, { attendees });
            toast.success("Attendance saved");
            onSuccess?.();
        } catch (err) {
            toast.error("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] sm:max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                        <span>{scrumCall.scrum_uid}</span>
                        <span className="text-muted-foreground font-normal">—</span>
                        <span className="truncate">{scrumCall.title}</span>
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 flex-wrap">
                        <Badge className={status.className}>{status.label}</Badge>
                        <span>·</span>
                        <span>{selectionLabels[scrumCall.selection_type]}</span>
                        {scrumCall.creator && (
                            <>
                                <span>·</span>
                                <span>by {scrumCall.creator.first_name} {scrumCall.creator.last_name}</span>
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto no-scrollbar p-1 space-y-4">
                    {/* Schedule Info */}
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="h-4 w-4 shrink-0" />
                            <span>{format(scheduledDate, "EEEE, MMM d, yyyy")} · {format(scheduledDate, "h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{scrumCall.duration_minutes} minutes</span>
                        </div>
                        {scrumCall.meeting_link && (
                            <div className="flex items-center gap-2">
                                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <a href={normalizeUrl(scrumCall.meeting_link)} target="_blank" rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate text-sm">
                                    {scrumCall.meeting_link}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {scrumCall.description && (
                        <>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium mb-1">Description</div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scrumCall.description}</p>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Participants */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-medium">Participants ({scrumCall.participants?.length || 0})</span>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto space-y-1">
                            {(scrumCall.participants || []).map(p => {
                                const emp = p.Employee;
                                const user = emp?.User;
                                const isAttended = attendance[p.employee_id] || false;
                                return (
                                    <div key={p.id} className={`flex items-center gap-2.5 p-2 rounded-md ${canMarkAttendance ? "cursor-pointer hover:bg-muted/50" : ""}`}
                                        onClick={() => toggleAttendance(p.employee_id)}>
                                        {canMarkAttendance && <Checkbox checked={isAttended} className="shrink-0" />}
                                        <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarImage src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${BACKEND_URL}/${user.avatar}`) : ''} />
                                            <AvatarFallback className="text-[10px]">{user?.first_name?.[0]}{user?.last_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate">{user?.first_name} {user?.last_name}</div>
                                        </div>
                                        {!canMarkAttendance && (
                                            <span className="text-xs text-muted-foreground shrink-0">Participant</span>
                                        )}
                                        {canMarkAttendance && (
                                            <span className={`text-xs shrink-0 ${isAttended ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                                {isAttended ? "Attended" : "Absent"}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {canMarkAttendance && (
                        <Button variant="outline" onClick={handleSaveAttendance} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Attendance
                        </Button>
                    )}
                    {scrumCall.status !== "cancelled" && scrumCall.status !== "completed" && (
                        <Button variant="outline" onClick={() => { onOpenChange(false); onEdit?.(scrumCall); }}>Edit</Button>
                    )}
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
