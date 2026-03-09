import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CalendarIcon, Search, Loader2, Building2, Check } from "lucide-react";
import { format } from "date-fns";
import { clientApi } from "@/api/clientApi";
import { forwardCallApi } from "@/api/forwardCallApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
        const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? "PM" : "AM";
        const label = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
        const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        TIME_OPTIONS.push({ label, value });
    }
}

const DURATION_OPTIONS = [
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hour", value: 60 },
    { label: "1.5 hours", value: 90 },
    { label: "2 hours", value: 120 },
];

export default function CreateForwardCallDialog({ open, onOpenChange, forwardCall, onSuccess }) {
    const isEdit = !!forwardCall;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [date, setDate] = useState(null);
    const [time, setTime] = useState("10:00");
    const [duration, setDuration] = useState(30);
    const [meetingLink, setMeetingLink] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Client picker
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [clientPopoverOpen, setClientPopoverOpen] = useState(false);

    useEffect(() => {
        if (open) {
            fetchClients();
            if (isEdit) {
                setTitle(forwardCall.title || "");
                setDescription(forwardCall.description || "");
                setSelectedClientId(forwardCall.client_id || null);
                const d = new Date(forwardCall.scheduled_at);
                setDate(d);
                setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
                setDuration(forwardCall.duration_minutes || 30);
                setMeetingLink(forwardCall.meeting_link || "");
            } else {
                resetForm();
            }
        }
    }, [open]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setSelectedClientId(null);
        setDate(null);
        setTime("10:00");
        setDuration(30);
        setMeetingLink("");
    };

    const fetchClients = async () => {
        try {
            setLoadingClients(true);
            const res = await clientApi.getAll();
            setClients((res.data.clients || []).filter(c => c.is_active));
        } catch (err) {
            console.error("Failed to load clients:", err);
        } finally {
            setLoadingClients(false);
        }
    };

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error("Title is required"); return; }
        if (!selectedClientId) { toast.error("Please select a client"); return; }
        if (!date) { toast.error("Date is required"); return; }
        if (!time) { toast.error("Time is required"); return; }

        const [hours, minutes] = time.split(":").map(Number);
        const scheduledAt = new Date(date);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            client_id: selectedClientId,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: duration,
            meeting_link: meetingLink.trim() || null,
        };

        try {
            setSubmitting(true);
            if (isEdit) {
                await forwardCallApi.update(forwardCall.id, payload);
                toast.success("Forward call updated");
            } else {
                await forwardCallApi.create(payload);
                toast.success("Forward call scheduled");
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            console.error("Failed to save forward call:", err);
            toast.error(err.response?.data?.message || "Failed to save forward call");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] sm:max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Forward Call" : "Schedule Forward Call"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update forward call details." : "Schedule a one-on-one call with a client."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto no-scrollbar p-1 space-y-4">
                    {/* Title */}
                    <div className="grid gap-2">
                        <Label>Title <span className="text-destructive">*</span></Label>
                        <Input placeholder="e.g., Project Status Update" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Agenda or notes (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    {/* Client Picker */}
                    <div className="grid gap-2">
                        <Label>Client <span className="text-destructive">*</span></Label>
                        <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm">
                                    <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                    {selectedClient ? (
                                        <span className="truncate">{selectedClient.company_name} ({selectedClient.client_uid})</span>
                                    ) : (
                                        <span className="text-muted-foreground">Select a client...</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search clients..." />
                                    <CommandList className="max-h-[200px]">
                                        <CommandEmpty>
                                            {loadingClients ? "Loading..." : "No clients found."}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {clients.map(c => (
                                                <CommandItem
                                                    key={c.id}
                                                    value={`${c.company_name} ${c.client_uid}`}
                                                    onSelect={() => { setSelectedClientId(c.id); setClientPopoverOpen(false); }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Check className={cn("h-4 w-4 shrink-0", selectedClientId === c.id ? "opacity-100" : "opacity-0")} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{c.company_name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{c.client_uid} · {c.contact_name}</div>
                                                    </div>
                                                    <Badge variant="outline" className="shrink-0 capitalize text-[10px] px-1.5">{c.industry?.replace(/_/g, " ")}</Badge>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Date <span className="text-destructive">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label>Time <span className="text-destructive">*</span></Label>
                            <Select value={time} onValueChange={setTime}>
                                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                    {TIME_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Duration & Meeting Link */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Duration</Label>
                            <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
                                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DURATION_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Meeting Link</Label>
                            <Input placeholder="https://meet.google.com/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} className="h-9 sm:h-10 text-xs sm:text-sm" />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Call" : "Schedule Call"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
