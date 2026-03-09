import { useState, useEffect, useMemo } from "react";
import { attendanceApi } from "@/api/attendanceApi";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    CalendarDays,
    Users,
    UserCheck,
    UserX,
    Clock,
    MapPin,
    TrendingUp,
} from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminAttendance() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [overview, setOverview] = useState({});
    const [totalEmployees, setTotalEmployees] = useState(0);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateData, setDateData] = useState(null);
    const [dateLoading, setDateLoading] = useState(false);

    useEffect(() => {
        fetchMonthlyOverview();
    }, [selectedMonth, selectedYear]);

    const fetchMonthlyOverview = async () => {
        try {
            setLoading(true);
            const res = await attendanceApi.getMonthlyOverview({
                month: selectedMonth,
                year: selectedYear,
            });
            setOverview(res.data.overview || {});
            setTotalEmployees(res.data.total_employees || 0);
        } catch (err) {
            console.error("Failed to fetch overview:", err);
            toast.error("Failed to load attendance overview");
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = async (dateStr) => {
        setSelectedDate(dateStr);
        setDialogOpen(true);
        setDateLoading(true);
        setDateData(null);
        try {
            const res = await attendanceApi.getByDate(dateStr);
            setDateData(res.data);
        } catch (err) {
            console.error("Failed to fetch date attendance:", err);
            toast.error("Failed to load attendance details");
        } finally {
            setDateLoading(false);
        }
    };

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
        const cells = [];
        const todayStr = new Date().toISOString().split("T")[0];

        for (let i = 0; i < firstDay; i++) {
            cells.push({ empty: true });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const dayData = overview[dateStr] || null;
            const isToday = dateStr === todayStr;
            const dayOfWeek = new Date(selectedYear, selectedMonth - 1, d).getDay();
            const isSunday = dayOfWeek === 0;
            const isFuture = dateStr > todayStr;
            const isPast = dateStr < todayStr;
            cells.push({ day: d, date: dateStr, data: dayData, isToday, isSunday, isFuture, isPast });
        }

        return cells;
    }, [overview, selectedMonth, selectedYear]);

    // Monthly stats
    const monthlyStats = useMemo(() => {
        const dates = Object.keys(overview);
        if (dates.length === 0 || totalEmployees === 0) {
            return { avgPresent: 0, avgAbsent: 0, bestDay: null, worstDay: null, totalDays: 0, overallRate: 0 };
        }

        let totalPresent = 0;
        let bestDay = null;
        let worstDay = null;
        let bestCount = -1;
        let worstCount = Infinity;

        dates.forEach((d) => {
            const day = overview[d];
            totalPresent += day.present_count;
            if (day.present_count > bestCount) {
                bestCount = day.present_count;
                bestDay = d;
            }
            if (day.present_count < worstCount) {
                worstCount = day.present_count;
                worstDay = d;
            }
        });

        const workingDays = dates.length;

        return {
            avgPresent: Math.round(totalPresent / workingDays),
            avgAbsent: Math.round((totalEmployees * workingDays - totalPresent) / workingDays),
            bestDay,
            worstDay,
            totalDays: workingDays,
            overallRate: Math.round((totalPresent / (totalEmployees * workingDays)) * 100),
        };
    }, [overview, totalEmployees]);

    const getPresenceDotColor = (data) => {
        if (!data) return "";
        const pct = totalEmployees ? (data.present_count / totalEmployees) * 100 : 0;
        if (pct >= 80) return "bg-green-500";
        if (pct >= 50) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getPresenceBgColor = (cell) => {
        if (cell.empty || cell.isFuture || cell.isSunday) return "";
        const data = cell.data;
        // Past/today date with no overview data = no attendance recorded = all absent
        if (!data && (cell.isPast || cell.isToday)) {
            return "bg-red-50 dark:bg-red-950/20";
        }
        if (!data) return "";
        const pct = totalEmployees ? (data.present_count / totalEmployees) * 100 : 0;
        if (pct >= 80) return "bg-green-50 dark:bg-green-950/20";
        if (pct >= 50) return "bg-yellow-50 dark:bg-yellow-950/20";
        return "bg-red-50 dark:bg-red-950/20";
    };

    const getStatusBadgeColor = (s) => {
        const m = {
            present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            "half-day": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            late: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
            "on-leave": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            holiday: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        };
        return m[s] || "";
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Attendance Overview</h1>
                <p className="text-muted-foreground">Monitor employee attendance across the organization.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                            <p className="text-xs text-muted-foreground leading-tight">Total Employees</p>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold mt-1">{totalEmployees}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="flex items-center gap-1.5">
                            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-tight">Avg. Daily Present</p>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-green-600 mt-1">{monthlyStats.avgPresent}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="flex items-center gap-1.5">
                            <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-tight">Avg. Daily Absent</p>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-red-600 mt-1">{monthlyStats.avgAbsent}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 pb-3 sm:pb-6">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-tight">Attendance Rate</p>
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-blue-600 mt-1">{monthlyStats.overallRate}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarDays className="h-5 w-5" /> Monthly Calendar
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
                                {calendarDays.map((cell, i) => {
                                    const hasData = !!cell.data;
                                    const showIndicator = hasData || (!cell.empty && !cell.isFuture && !cell.isSunday && (cell.isPast || cell.isToday));
                                    const presentCount = cell.data?.present_count ?? 0;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => !cell.empty && !cell.isFuture && handleDateClick(cell.date)}
                                            className={`
                                            relative h-12 sm:h-16 rounded-lg flex flex-col items-center justify-center text-xs sm:text-sm
                                            ${cell.empty ? "" : "border"}
                                            ${cell.isToday ? "ring-2 ring-primary ring-offset-1" : ""}
                                            ${cell.isSunday && !cell.empty ? "bg-muted/50" : getPresenceBgColor(cell)}
                                            ${!cell.empty && !cell.isFuture ? "cursor-pointer hover:bg-muted/80 transition-colors" : ""}
                                            ${cell.isFuture ? "opacity-40" : ""}
                                        `}
                                        >
                                            {!cell.empty && (
                                                <>
                                                    <span className={showIndicator ? "font-medium" : "text-muted-foreground"}>{cell.day}</span>
                                                    {showIndicator && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <div className={`w-2 h-2 rounded-full ${getPresenceDotColor(cell.data) || "bg-red-500"}`} />
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {presentCount}/{totalEmployees}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-4 text-xs">
                                {[
                                    { label: ">80% Present", color: "bg-green-500" },
                                    { label: "50-80% Present", color: "bg-yellow-500" },
                                    { label: "<50% Present", color: "bg-red-500" },
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

            {/* Attendance Details Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-3xl sm:max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Attendance Details — {selectedDate && formatDate(selectedDate)}</DialogTitle>
                        <DialogDescription>
                            View present and absent employees for the selected date.
                        </DialogDescription>
                    </DialogHeader>

                    {dateLoading ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[1, 2, 3].map((n) => (
                                    <Skeleton key={n} className="h-20 rounded-lg" />
                                ))}
                            </div>
                            <Skeleton className="h-8 w-48" />
                            {[1, 2, 3, 4].map((n) => (
                                <Skeleton key={n} className="h-12" />
                            ))}
                        </div>
                    ) : dateData ? (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <Card>
                                    <CardContent className="pt-4 pb-4 text-center">
                                        <div className="text-2xl font-bold text-green-600">{dateData.summary.total_present}</div>
                                        <p className="text-xs text-muted-foreground">Present ({dateData.summary.present_percentage}%)</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4 pb-4 text-center">
                                        <div className="text-2xl font-bold text-red-600">{dateData.summary.total_absent}</div>
                                        <p className="text-xs text-muted-foreground">Absent ({dateData.summary.absent_percentage}%)</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="pt-4 pb-4 text-center">
                                        <div className="text-2xl font-bold">{dateData.summary.total_employees}</div>
                                        <p className="text-xs text-muted-foreground">Total Employees</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Tabs */}
                            <Tabs defaultValue="present">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="present">
                                        Present ({dateData.summary.total_present})
                                    </TabsTrigger>
                                    <TabsTrigger value="absent">
                                        Absent ({dateData.summary.total_absent})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="present" className="mt-4">
                                    {dateData.attendance.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No employees were present on this date.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile card list */}
                                            <div className="space-y-3 sm:hidden">
                                                {dateData.attendance.map((record) => (
                                                    <div key={record.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-7 w-7">
                                                                <AvatarImage src={record.Employee?.User?.avatar} />
                                                                <AvatarFallback className="text-xs">{record.Employee?.User?.first_name?.charAt(0) || "?"}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium text-sm">{record.Employee?.User?.first_name} {record.Employee?.User?.last_name}</div>
                                                                <div className="text-xs text-muted-foreground">{record.Employee?.department}</div>
                                                            </div>
                                                            <Badge variant="outline" className={`ml-auto ${getStatusBadgeColor(record.status)}`}>{record.status}</Badge>
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(record.check_in)} — {formatTime(record.check_out)}</span>
                                                            <span>{record.total_hours || '—'} hrs</span>
                                                            <span className="flex items-center gap-1 capitalize"><MapPin className="h-3 w-3" />{record.work_mode}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Desktop table */}
                                            <div className="hidden sm:block rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Employee</TableHead>
                                                            <TableHead>Department</TableHead>
                                                            <TableHead>Check In</TableHead>
                                                            <TableHead>Check Out</TableHead>
                                                            <TableHead>Hours</TableHead>
                                                            <TableHead>Mode</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {dateData.attendance.map((record) => (
                                                            <TableRow key={record.id}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-7 w-7"><AvatarImage src={record.Employee?.User?.avatar} /><AvatarFallback className="text-xs">{record.Employee?.User?.first_name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                                                                        <div><div className="font-medium text-sm">{record.Employee?.User?.first_name} {record.Employee?.User?.last_name}</div><div className="text-xs text-muted-foreground">{record.Employee?.designation}</div></div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="capitalize text-sm">{record.Employee?.department}</TableCell>
                                                                <TableCell className="text-sm"><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{formatTime(record.check_in)}</div></TableCell>
                                                                <TableCell className="text-sm">{formatTime(record.check_out)}</TableCell>
                                                                <TableCell className="text-sm">{record.total_hours || "—"}</TableCell>
                                                                <TableCell className="text-sm"><div className="flex items-center gap-1 capitalize"><MapPin className="h-3 w-3 text-muted-foreground" />{record.work_mode}</div></TableCell>
                                                                <TableCell><Badge variant="outline" className={getStatusBadgeColor(record.status)}>{record.status}</Badge></TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>

                                <TabsContent value="absent" className="mt-4">
                                    {dateData.absent.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            All employees were present on this date.
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile card list */}
                                            <div className="space-y-3 sm:hidden">
                                                {dateData.absent.map((record) => (
                                                    <div key={record.employee_id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-7 w-7">
                                                                <AvatarImage src={record.Employee?.User?.avatar} />
                                                                <AvatarFallback className="text-xs">{record.Employee?.User?.first_name?.charAt(0) || "?"}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium text-sm">{record.Employee?.User?.first_name} {record.Employee?.User?.last_name}</div>
                                                                <div className="text-xs text-muted-foreground capitalize">{record.Employee?.department}</div>
                                                            </div>
                                                            <Badge variant="outline" className={`ml-auto ${getStatusBadgeColor(record.status)}`}>{record.status}</Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            <span className="capitalize">{record.Employee?.employee_type}</span>
                                                            {record.notes && <span> · {record.notes}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Desktop table */}
                                            <div className="hidden sm:block rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Employee</TableHead>
                                                            <TableHead>Department</TableHead>
                                                            <TableHead>Type</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead>Notes</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {dateData.absent.map((record) => (
                                                            <TableRow key={record.employee_id}>
                                                                <TableCell>
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-7 w-7"><AvatarImage src={record.Employee?.User?.avatar} /><AvatarFallback className="text-xs">{record.Employee?.User?.first_name?.charAt(0) || "?"}</AvatarFallback></Avatar>
                                                                        <div><div className="font-medium text-sm">{record.Employee?.User?.first_name} {record.Employee?.User?.last_name}</div><div className="text-xs text-muted-foreground">{record.Employee?.designation}</div></div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="capitalize text-sm">{record.Employee?.department}</TableCell>
                                                                <TableCell className="capitalize text-sm">{record.Employee?.employee_type}</TableCell>
                                                                <TableCell><Badge variant="outline" className={getStatusBadgeColor(record.status)}>{record.status}</Badge></TableCell>
                                                                <TableCell className="text-sm text-muted-foreground">{record.notes || "—"}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Failed to load data.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
