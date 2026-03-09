import { useState, useEffect } from "react";
import { notificationApi } from "@/api/notificationApi";
import { projectApi } from "@/api/projectApi";
import { employeeApi } from "@/api/employeeApi";
import { clientApi } from "@/api/clientApi";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function SendNotificationDialog({ onSent }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [targetType, setTargetType] = useState("");
    const [targetId, setTargetId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");

    // Options for dropdowns
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [clients, setClients] = useState([]);

    useEffect(() => {
        if (!open) return;

        const fetchOptions = async () => {
            try {
                const [projRes, empRes, clientRes] = await Promise.all([
                    projectApi.getAll().catch(() => ({ data: { projects: [] } })),
                    employeeApi.getAll().catch(() => ({ data: { employees: [] } })),
                    clientApi.getAll().catch(() => ({ data: { clients: [] } })),
                ]);
                setProjects(projRes.data.projects || []);
                setEmployees(empRes.data.employees || []);
                setClients(clientRes.data.clients || []);
            } catch {
                // ignore
            }
        };
        fetchOptions();
    }, [open]);

    const resetForm = () => {
        setTargetType("");
        setTargetId("");
        setTitle("");
        setMessage("");
    };

    const handleSubmit = async () => {
        if (!targetType || !title.trim() || !message.trim()) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (targetType !== "all_employees" && !targetId) {
            toast.error("Please select a target");
            return;
        }

        setLoading(true);
        try {
            await notificationApi.send({
                title: title.trim(),
                message: message.trim(),
                target_type: targetType,
                target_id: targetType === "all_employees" ? null : Number(targetId),
            });
            toast.success("Notification sent successfully");
            resetForm();
            setOpen(false);
            onSent?.();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to send notification");
        }
        setLoading(false);
    };

    const needsTarget = targetType && targetType !== "all_employees";

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
                <Button size="sm" className="flex-1 sm:flex-none">
                    <Send className="mr-2 h-4 w-4" />
                    Send Notification
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Send Notification</DialogTitle>
                    <DialogDescription>
                        Send a notification to employees or clients
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Target <span className="text-destructive">*</span></Label>
                        <Select value={targetType} onValueChange={(v) => { setTargetType(v); setTargetId(""); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all_employees">All Employees</SelectItem>
                                <SelectItem value="project_team">Project Team</SelectItem>
                                <SelectItem value="individual">Individual Employee</SelectItem>
                                <SelectItem value="client">Specific Client</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {targetType === "project_team" && (
                        <div className="grid gap-2">
                            <Label>Project <span className="text-destructive">*</span></Label>
                            <Select value={targetId} onValueChange={setTargetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.project_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {targetType === "individual" && (
                        <div className="grid gap-2">
                            <Label>Employee <span className="text-destructive">*</span></Label>
                            <Select value={targetId} onValueChange={setTargetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((emp) => {
                                        const userObj = emp.user || emp.User;
                                        const name = userObj
                                            ? `${userObj.first_name} ${userObj.last_name}`
                                            : `Employee #${emp.id}`;
                                        return (
                                            <SelectItem key={emp.user_id || emp.id} value={String(emp.user_id || emp.id)}>
                                                {name}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {targetType === "client" && (
                        <div className="grid gap-2">
                            <Label>Client <span className="text-destructive">*</span></Label>
                            <Select value={targetId} onValueChange={setTargetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients
                                        .filter((c) => c.User || c.user_id)
                                        .map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.company_name} ({c.contact_name})
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>Title <span className="text-destructive">*</span></Label>
                        <Input
                            placeholder="Notification title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Message <span className="text-destructive">*</span></Label>
                        <Textarea
                            placeholder="Write your notification message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:gap-0">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setOpen(false); resetForm(); }}>
                        Cancel
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Sending..." : "Send"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
