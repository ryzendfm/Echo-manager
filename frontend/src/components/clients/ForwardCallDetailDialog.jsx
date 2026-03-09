import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, Link2, Building2, Loader2, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { forwardCallApi } from "@/api/forwardCallApi";
import { toast } from "sonner";

const statusConfig = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
    in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

export default function ForwardCallDetailDialog({ open, onOpenChange, forwardCall, onEdit, onSuccess }) {
    const [attended, setAttended] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (forwardCall) {
            setAttended(forwardCall.attended || false);
        }
    }, [forwardCall]);

    if (!forwardCall) return null;

    const status = statusConfig[forwardCall.status] || statusConfig.scheduled;
    const scheduledDate = new Date(forwardCall.scheduled_at);
    const client = forwardCall.Client;
    const canMarkAttendance = forwardCall.status === "in_progress" || forwardCall.status === "completed";

    const handleSaveAttendance = async () => {
        try {
            setSaving(true);
            await forwardCallApi.markAttendance(forwardCall.id, { attended });
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
            <DialogContent className="sm:max-w-[520px] sm:max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 flex-wrap">
                        <span>{forwardCall.forward_uid}</span>
                        <span className="text-muted-foreground font-normal">—</span>
                        <span className="truncate">{forwardCall.title}</span>
                    </DialogTitle>
                    <DialogDescription className="flex items-center gap-2 flex-wrap">
                        <Badge className={status.className}>{status.label}</Badge>
                        {forwardCall.forwardCreator && (
                            <>
                                <span>·</span>
                                <span>by {forwardCall.forwardCreator.first_name} {forwardCall.forwardCreator.last_name}</span>
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
                            <span>{forwardCall.duration_minutes} minutes</span>
                        </div>
                        {forwardCall.meeting_link && (
                            <div className="flex items-center gap-2">
                                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <a href={forwardCall.meeting_link} target="_blank" rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate text-sm">
                                    {forwardCall.meeting_link}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {forwardCall.description && (
                        <>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium mb-1">Description</div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{forwardCall.description}</p>
                            </div>
                        </>
                    )}

                    <Separator />

                    {/* Client Info */}
                    {client && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Client</span>
                            </div>
                            <div className="rounded-lg border bg-card p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="font-medium text-sm">{client.company_name}</div>
                                        <div className="text-xs text-muted-foreground">{client.client_uid}</div>
                                    </div>
                                    <Badge variant="outline" className="capitalize text-[10px] px-1.5 shrink-0">{client.industry?.replace(/_/g, " ")}</Badge>
                                </div>
                                {client.contact_name && (
                                    <div className="text-xs text-muted-foreground">Contact: {client.contact_name}</div>
                                )}
                                {client.contact_email && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" /> {client.contact_email}
                                    </div>
                                )}
                                {client.contact_phone && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Phone className="h-3 w-3" /> {client.contact_phone}
                                    </div>
                                )}
                                {canMarkAttendance && (
                                    <div className="flex items-center gap-2 pt-1 border-t mt-2">
                                        <Checkbox checked={attended} onCheckedChange={setAttended} id="attended" />
                                        <label htmlFor="attended" className={`text-xs cursor-pointer ${attended ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                                            {attended ? "Attended" : "Not attended"}
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {canMarkAttendance && (
                        <Button variant="outline" onClick={handleSaveAttendance} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Attendance
                        </Button>
                    )}
                    {forwardCall.status !== "cancelled" && forwardCall.status !== "completed" && (
                        <Button variant="outline" onClick={() => { onOpenChange(false); onEdit?.(forwardCall); }}>Edit</Button>
                    )}
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
