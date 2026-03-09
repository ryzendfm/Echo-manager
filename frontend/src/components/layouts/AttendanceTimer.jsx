import { useState, useEffect, useRef } from "react";
import { attendanceApi } from "@/api/attendanceApi";
import { Clock } from "lucide-react";
import { toast } from "sonner";

const MAX_HOURS = 8;
const MAX_MS = MAX_HOURS * 60 * 60 * 1000;

export default function AttendanceTimer() {
    const [attendance, setAttendance] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);

    const fetchToday = async () => {
        try {
            const res = await attendanceApi.getToday();
            setAttendance(res.data.attendance);
        } catch {
            setAttendance(null);
        }
    };

    useEffect(() => {
        fetchToday();
        // Re-fetch every 60 seconds to stay in sync
        const pollId = setInterval(fetchToday, 60000);
        return () => clearInterval(pollId);
    }, []);

    // Live tick every second when checked in and not checked out
    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (attendance?.check_in && !attendance?.check_out) {
            const checkInTime = new Date(attendance.check_in).getTime();

            const tick = () => {
                const now = Date.now();
                const diff = now - checkInTime;
                setElapsed(Math.min(diff, MAX_MS));

                // Auto-checkout when 8 hours reached
                if (diff >= MAX_MS) {
                    clearInterval(intervalRef.current);
                    attendanceApi.checkOut({}).then(() => {
                        toast.success("Auto checked out — 8 hour limit reached");
                        fetchToday();
                    }).catch(() => {
                        // Backend may have already auto-checked out
                        fetchToday();
                    });
                }
            };

            tick();
            intervalRef.current = setInterval(tick, 1000);
        } else {
            setElapsed(0);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [attendance]);

    // Don't render if not checked in or already checked out
    if (!attendance?.check_in || attendance?.check_out) return null;

    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, "0");
    const timeStr = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    // Progress percentage (0 to 100)
    const progress = Math.min((elapsed / MAX_MS) * 100, 100);

    // Current hour's minute countdown (60 min cycle)
    const minutesInCurrentHour = minutes;
    const minutesRemaining = 60 - minutesInCurrentHour;

    return (
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-primary">{timeStr}</span>
                <span className="text-muted-foreground text-xs hidden sm:inline">/ {MAX_HOURS}h</span>
            </div>
            {/* Mini progress bar */}
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                <div
                    className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <span className="text-xs text-muted-foreground hidden md:inline">
                {minutesRemaining}m left in hr
            </span>
        </div>
    );
}
