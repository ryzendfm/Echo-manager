import { useState, useEffect } from "react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { employeeApi } from "@/api/employeeApi";
import { projectApi } from "@/api/projectApi";
import { scrumCallApi } from "@/api/scrumCallApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

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

export default function CreateScrumCallDialog({ open, onOpenChange, scrumCall, onSuccess }) {
    const isEdit = !!scrumCall;

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(null);
    const [time, setTime] = useState("10:00");
    const [duration, setDuration] = useState(30);
    const [meetingLink, setMeetingLink] = useState("");
    const [selectionType, setSelectionType] = useState("all");
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [selectedProjectIds, setSelectedProjectIds] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [teamSearch, setTeamSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (open) {
            fetchData();
            if (isEdit) {
                setTitle(scrumCall.title || "");
                setDescription(scrumCall.description || "");
                const d = new Date(scrumCall.scheduled_at);
                setDate(d);
                setTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
                setDuration(scrumCall.duration_minutes || 30);
                setMeetingLink(scrumCall.meeting_link || "");
                setSelectionType(scrumCall.selection_type || "all");
            } else {
                resetForm();
            }
        }
    }, [open]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDate(null);
        setTime("10:00");
        setDuration(30);
        setMeetingLink("");
        setSelectionType("all");
        setSelectedEmployeeIds([]);
        setSelectedProjectIds([]);
        setEmpSearch("");
        setTeamSearch("");
    };

    const fetchData = async () => {
        try {
            setLoadingData(true);
            const [empRes, teamRes] = await Promise.all([
                employeeApi.getAll(),
                projectApi.getAllTeams(),
            ]);
            setEmployees((empRes.data.employees || []).filter(e => e.is_active));
            setTeams((teamRes.data.teams || []).filter(t => t.memberCount > 0));
        } catch (err) {
            console.error("Failed to load data:", err);
        } finally {
            setLoadingData(false);
        }
    };

    const toggleEmployee = (id) => {
        setSelectedEmployeeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleProject = (id) => {
        setSelectedProjectIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Calculate unique employees for team selection
    const getUniqueTeamEmployeeCount = () => {
        const empIds = new Set();
        teams.filter(t => selectedProjectIds.includes(t.project.id)).forEach(t => {
            t.members.forEach(m => empIds.add(m.id));
        });
        return empIds.size;
    };

    const filteredEmployees = employees.filter(emp => {
        const term = empSearch.toLowerCase();
        if (!term) return true;
        const name = `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.toLowerCase();
        return name.includes(term) || emp.employee_uid?.toLowerCase().includes(term) || emp.department?.toLowerCase().includes(term);
    });

    const filteredTeams = teams.filter(t => {
        const term = teamSearch.toLowerCase();
        if (!term) return true;
        return t.teamName?.toLowerCase().includes(term) || t.project?.project_uid?.toLowerCase().includes(term);
    });

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error("Title is required"); return; }
        if (!date) { toast.error("Date is required"); return; }
        if (!time) { toast.error("Time is required"); return; }

        if (selectionType === "individual" && selectedEmployeeIds.length === 0) {
            toast.error("Select at least one employee"); return;
        }
        if (selectionType === "team" && selectedProjectIds.length === 0) {
            toast.error("Select at least one team"); return;
        }

        // Build scheduled_at datetime
        const [hours, minutes] = time.split(":").map(Number);
        const scheduledAt = new Date(date);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            scheduled_at: scheduledAt.toISOString(),
            duration_minutes: duration,
            meeting_link: meetingLink.trim() || null,
            selection_type: selectionType,
        };

        if (selectionType === "individual") payload.employee_ids = selectedEmployeeIds;
        if (selectionType === "team") payload.project_ids = selectedProjectIds;

        try {
            setSubmitting(true);
            if (isEdit) {
                await scrumCallApi.update(scrumCall.id, payload);
                toast.success("Scrum call updated");
            } else {
                await scrumCallApi.create(payload);
                toast.success("Scrum call created");
            }
            onOpenChange(false);
            onSuccess?.();
        } catch (err) {
            console.error("Failed to save scrum call:", err);
            toast.error(err.response?.data?.message || "Failed to save scrum call");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] sm:max-h-[80vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Scrum Call" : "Create Scrum Call"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update scrum call details." : "Schedule a new scrum call and select participants."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto no-scrollbar p-1 space-y-4">
                    {/* Title */}
                    <div className="grid gap-2">
                        <Label>Title <span className="text-destructive">*</span></Label>
                        <Input placeholder="e.g., Daily Standup" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea placeholder="Agenda or notes (optional)" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
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

                    {/* Participant Selection */}
                    {!isEdit && (
                        <div className="space-y-3">
                            <Label>Select Participants <span className="text-destructive">*</span></Label>
                            <RadioGroup value={selectionType} onValueChange={(v) => { setSelectionType(v); setSelectedEmployeeIds([]); setSelectedProjectIds([]); }} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="sel-all" />
                                    <Label htmlFor="sel-all" className="font-normal cursor-pointer">Everyone</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="individual" id="sel-ind" />
                                    <Label htmlFor="sel-ind" className="font-normal cursor-pointer">Individuals</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="team" id="sel-team" />
                                    <Label htmlFor="sel-team" className="font-normal cursor-pointer">By Team</Label>
                                </div>
                            </RadioGroup>

                            {loadingData ? (
                                <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                                </div>
                            ) : selectionType === "all" ? (
                                <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground flex items-center gap-2">
                                    <Users className="h-4 w-4 shrink-0" />
                                    All {employees.length} active employees will be included.
                                </div>
                            ) : selectionType === "individual" ? (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search employees..." className="pl-8 h-9 text-xs" value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-lg border p-2">
                                        {filteredEmployees.length === 0 ? (
                                            <div className="text-center py-3 text-xs text-muted-foreground">No employees found.</div>
                                        ) : filteredEmployees.map(emp => {
                                            const isSelected = selectedEmployeeIds.includes(emp.id);
                                            return (
                                                <div key={emp.id} onClick={() => toggleEmployee(emp.id)}
                                                    className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/50"}`}>
                                                    <Checkbox checked={isSelected} className="shrink-0" />
                                                    <Avatar className="h-7 w-7 shrink-0">
                                                        <AvatarImage src={emp.user?.avatar ? (emp.user.avatar.startsWith('http') ? emp.user.avatar : `${BACKEND_URL}/${emp.user.avatar}`) : ''} />
                                                        <AvatarFallback className="text-[10px]">{emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{emp.user?.first_name} {emp.user?.last_name}</div>
                                                        <div className="text-[10px] text-muted-foreground">{emp.employee_uid} · {emp.designation}</div>
                                                    </div>
                                                    <Badge variant="outline" className="shrink-0 capitalize text-[10px] px-1.5">{emp.department}</Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Selected: {selectedEmployeeIds.length} employee{selectedEmployeeIds.length !== 1 ? "s" : ""}</div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Search teams..." className="pl-8 h-9 text-xs" value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} />
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-lg border p-2">
                                        {filteredTeams.length === 0 ? (
                                            <div className="text-center py-3 text-xs text-muted-foreground">No teams found.</div>
                                        ) : filteredTeams.map(team => {
                                            const isSelected = selectedProjectIds.includes(team.project.id);
                                            return (
                                                <div key={team.project.id} onClick={() => toggleProject(team.project.id)}
                                                    className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${isSelected ? "bg-primary/5 dark:bg-primary/10" : "hover:bg-muted/50"}`}>
                                                    <Checkbox checked={isSelected} className="shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{team.teamName}</div>
                                                        <div className="text-[10px] text-muted-foreground">{team.project.project_uid}</div>
                                                    </div>
                                                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">{team.memberCount} members</Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Selected: {selectedProjectIds.length} team{selectedProjectIds.length !== 1 ? "s" : ""}
                                        {selectedProjectIds.length > 0 && ` · ${getUniqueTeamEmployeeCount()} unique employees`}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Scrum Call" : "Create Scrum Call"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
