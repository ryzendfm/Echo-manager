import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Phone, Link2, CalendarIcon, Clock, Users } from "lucide-react";
import { scrumCallApi } from "@/api/scrumCallApi";
import { format, isToday, isTomorrow } from "date-fns";

function formatRelativeDate(date) {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
}

export default function UpcomingScrumCalls() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCall, setSelectedCall] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const selectedDate = selectedCall ? new Date(selectedCall.scheduled_at) : null;

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const res = await scrumCallApi.getMyScrumCalls({ status: "scheduled" });
                // Sort nearest first and take top 5
                const sorted = (res.data.scrumCalls || [])
                    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                    .slice(0, 5);
                setCalls(sorted);
            } catch (err) {
                console.error("Failed to fetch scrum calls:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Scrum Calls</CardTitle>
                    <CardDescription>Your scheduled scrum calls</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Upcoming Scrum Calls
                    </CardTitle>
                    <CardDescription>Your scheduled scrum calls</CardDescription>
                </CardHeader>
                <CardContent>
                    {calls.length === 0 ? (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No upcoming scrum calls.
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-0">
                            {calls.map((sc, idx) => {
                                const d = new Date(sc.scheduled_at);
                                const relDate = formatRelativeDate(d);
                                const isUrgent = isToday(d) || isTomorrow(d);
                                return (
                                    <div key={sc.id}>
                                        {idx > 0 && <Separator className="my-0" />}
                                        <div
                                            className="py-3 px-2 space-y-1.5 cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                                            onClick={() => {
                                                setSelectedCall(sc);
                                                setDetailOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-sm truncate">{sc.title}</span>
                                                <Badge className={`shrink-0 text-[10px] px-2 py-0.5 ${isUrgent
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}>
                                                    {relDate}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {format(d, "MMM d, yyyy")}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(d, "h:mm a")}
                                                </span>
                                                <span>{sc.duration_minutes} min</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedCall && (
                <Dialog
                    open={detailOpen}
                    onOpenChange={(open) => {
                        setDetailOpen(open);
                        if (!open) {
                            setSelectedCall(null);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[520px] sm:max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex flex-col gap-1">
                                {selectedCall.scrum_uid && (
                                    <span className="text-xs text-muted-foreground">
                                        {selectedCall.scrum_uid}
                                    </span>
                                )}
                                <span className="text-base font-semibold truncate">
                                    {selectedCall.title}
                                </span>
                            </DialogTitle>
                            <DialogDescription>
                                Your scrum call details
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 text-sm">
                            {selectedDate && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>{format(selectedDate, "EEEE, MMM d, yyyy")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            {format(selectedDate, "h:mm a")} · {selectedCall.duration_minutes} min
                                        </span>
                                    </div>
                                    {selectedCall.meeting_link && (
                                        <div className="flex items-center gap-2">
                                            <Link2 className="h-4 w-4 text-muted-foreground" />
                                            <a
                                                href={selectedCall.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline truncate"
                                            >
                                                {selectedCall.meeting_link}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedCall.description && (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="text-sm font-medium mb-1">Description</div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedCall.description}
                                        </p>
                                    </div>
                                </>
                            )}
                            {selectedCall.participants?.length ? (
                                <>
                                    <Separator />
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                Participants ({selectedCall.participants.length})
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedCall.participants.map((p) => {
                                                const user = p.Employee?.User;
                                                const name = [user?.first_name, user?.last_name]
                                                    .filter(Boolean)
                                                    .join(" ") || "Employee";
                                                return (
                                                    <span
                                                        key={p.id}
                                                        className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground"
                                                    >
                                                        {name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            {selectedCall.meeting_link && (
                                <Button asChild>
                                    <a
                                        href={selectedCall.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Join Meeting
                                    </a>
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDetailOpen(false);
                                    setSelectedCall(null);
                                }}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
