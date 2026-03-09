import { useState, useEffect, useMemo, useRef } from "react";
import { attendanceApi } from "@/api/attendanceApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, LogIn, LogOut, MapPin, Timer, CalendarDays } from "lucide-react";

const MAX_HOURS = 8;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Attendance() {
    const [today, setToday] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const autoCheckoutRef = useRef(false);

    useEffect(() => {
        fetchToday();
        fetchMonthly();
    }, [selectedMonth, selectedYear]);

    // Auto-checkout check every 60 seconds
    useEffect(() => {
        const checkAutoCheckout = () => {
            if (!today?.check_in || today?.check_out || autoCheckoutRef.current) return;
            const checkInTime = new Date(today.check_in).getTime();
            const elapsed = Date.now() - checkInTime;
            const elapsedHours = elapsed / (1000 * 60 * 60);
            if (elapsedHours >= MAX_HOURS) {
                autoCheckoutRef.current = true;
                attendanceApi.checkOut({}).then(() => {
                    toast.success("Auto checked out — 8 hour limit reached");
                    fetchToday();
                    fetchMonthly();
                    autoCheckoutRef.current = false;
                }).catch(() => {
                    // Backend may have already auto-checked out, just refresh
                    fetchToday();
                    fetchMonthly();
                    autoCheckoutRef.current = false;
                });
            }
        };

        checkAutoCheckout();
        const id = setInterval(checkAutoCheckout, 60000);
        return () => clearInterval(id);
    }, [today]);

    const fetchToday = async () => {
        try {
            const res = await attendanceApi.getToday();
            setToday(res.data.attendance);
        } catch (err) {
            console.error("Failed to fetch today:", err);
        }
    };

    const fetchMonthly = async () => {
        try {
            setLoading(true);
            const res = await attendanceApi.getMyAttendance({
                month: selectedMonth,
                year: selectedYear,
            });
            setRecords(res.data.attendance || []);
        } catch (err) {
            console.error("Failed to fetch attendance:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        try {
            setCheckingIn(true);
            await attendanceApi.checkIn({ work_mode: 'office' });
            toast.success("Checked in successfully!");
            fetchToday();
            fetchMonthly();
        } catch (err) {
            toast.error(err.response?.data?.message || "Check-in failed");
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        try {
            setCheckingOut(true);
            await attendanceApi.checkOut({});
            toast.success("Checked out successfully!");
            fetchToday();
            fetchMonthly();
        } catch (err) {
            toast.error(err.response?.data?.message || "Check-out failed");
        } finally {
            setCheckingOut(false);
        }
    };

    const getStatusColor = (s) => {
        const m = {
            present: "bg-green-500",
            absent: "bg-red-500",
            'half-day': "bg-yellow-500",
            late: "bg-orange-500",
            'on-leave': "bg-purple-500",
            holiday: "bg-blue-500",
        };
        return m[s] || "bg-gray-300";
    };

    const getStatusBadgeColor = (s) => {
        const m = {
            present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            'half-day': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            late: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
            'on-leave': "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            holiday: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        };
        return m[s] || "";
    };

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const cells = [];
        const today = new Date().toISOString().split('T')[0];

        // Record lookup map
        const lookup = {};
        records.forEach((r) => {
            lookup[r.date] = r;
        });

        // Empty cells before the 1st
        for (let i = 0; i < firstDay; i++) {
            cells.push({ empty: true });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const rec = lookup[dateStr];
            const isToday = dateStr === today;
            const isSunday = new Date(selectedYear, selectedMonth - 1, d).getDay() === 0;
            cells.push({ day: d, date: dateStr, record: rec, isToday, isSunday });
        }

        return cells;
    }, [records, selectedMonth, selectedYear]);

    // Stats
    const stats = useMemo(() => {
        let present = 0, absent = 0, late = 0, totalHours = 0;
        records.forEach((r) => {
            if (r.status === 'present') present++;
            else if (r.status === 'absent') absent++;
            else if (r.status === 'late') { late++; present++; }
            totalHours += parseFloat(r.total_hours || 0);
        });
        return { present, absent, late, totalHours: totalHours.toFixed(1) };
    }, [records]);

    const formatTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance</h1>
                <p className="text-muted-foreground">Track your daily attendance and work hours.</p>
            </div>

            {/* Today's Status + Check-in/out */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="order-2 md:order-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5" /> Today's Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {today ? (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Status</span>
                                    <Badge variant="outline" className={getStatusBadgeColor(today.status)}>
                                        {today.status?.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1"><LogIn className="h-3 w-3" /> Check-in</span>
                                    <span className="font-medium">{formatTime(today.check_in)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1"><LogOut className="h-3 w-3" /> Check-out</span>
                                    <span className="font-medium">{formatTime(today.check_out)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" /> Hours</span>
                                    <span className="font-medium">{today.total_hours || '0'} hrs</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Mode</span>
                                    <span className="font-medium capitalize">{today.work_mode}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Not checked in yet today.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="order-1 md:order-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Mark your attendance for today</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCheckIn}
                            disabled={checkingIn || !!today}
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            {checkingIn ? "Checking in..." : today ? "Already Checked In" : "Check In"}
                        </Button>
                        <Button
                            className="w-full"
                            size="lg"
                            variant="outline"
                            onClick={handleCheckOut}
                            disabled={checkingOut || !today || !!today?.check_out}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            {checkingOut ? "Checking out..." : today?.check_out ? "Already Checked Out" : "Check Out"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        <p className="text-xs text-muted-foreground">Days Present</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        <p className="text-xs text-muted-foreground">Days Absent</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{stats.late}</div>
                        <p className="text-xs text-muted-foreground">Late Arrivals</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalHours}</div>
                        <p className="text-xs text-muted-foreground">Total Hours</p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" /> Monthly View
                        </CardTitle>
                        <div className="flex gap-2">
                            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map((m, i) => (<SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>))}
                                </SelectContent>
                            </Select>
                            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[2024, 2025, 2026].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {DAYS.map((d) => (
                                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((cell, i) => (
                                    <div
                                        key={i}
                                        className={`
                                            relative h-10 sm:h-12 rounded-lg flex items-center justify-center text-xs sm:text-sm
                                            ${cell.empty ? '' : 'border'}
                                            ${cell.isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                                            ${cell.isSunday && !cell.empty ? 'bg-muted/50' : ''}
                                        `}
                                    >
                                        {!cell.empty && (
                                            <>
                                                <span className={cell.record ? 'font-medium' : 'text-muted-foreground'}>{cell.day}</span>
                                                {cell.record && (
                                                    <div className={`absolute bottom-1 w-2 h-2 rounded-full ${getStatusColor(cell.record.status)}`} />
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-4 text-xs">
                                {[
                                    { label: 'Present', color: 'bg-green-500' },
                                    { label: 'Absent', color: 'bg-red-500' },
                                    { label: 'Late', color: 'bg-orange-500' },
                                    { label: 'On Leave', color: 'bg-purple-500' },
                                    { label: 'Holiday', color: 'bg-blue-500' },
                                ].map((l) => (
                                    <div key={l.label} className="flex items-center gap-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
                                        <span className="text-muted-foreground">{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
