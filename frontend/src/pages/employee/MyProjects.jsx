import { useState, useEffect } from "react";
import { employeeApi } from "@/api/employeeApi";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Search } from "lucide-react";

export default function MyProjects() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await employeeApi.getMyProjects();
            setProjects(res.data.projects || []);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const m = {
            planning: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            on_hold: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        return m[status] || "";
    };

    const getPriorityColor = (p) => {
        const m = {
            low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
            medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        return m[p] || "";
    };

    const filtered = projects.filter(p => {
        const matchesSearch = p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.project_uid?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || p.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Projects</h1>
                <p className="text-muted-foreground">Projects you are assigned to.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[135px]"><SelectValue placeholder="All Priorities" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">Loading projects...</div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No projects assigned yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Mobile card list */}
                    <div className="space-y-3 sm:hidden">
                        {filtered.map((p) => (
                            <div key={p.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                <div className="font-semibold">{p.project_name}</div>
                                <div className="text-xs text-muted-foreground">{p.project_uid}</div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className={getStatusColor(p.status)}>{p.status?.replace(/_/g, ' ').toUpperCase()}</Badge>
                                    <Badge variant="outline" className={getPriorityColor(p.priority)}>{p.priority?.toUpperCase()}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Due: {p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : '—'}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop table */}
                    <Card className="hidden sm:block">
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Deadline</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell><div><div className="font-medium">{p.project_name}</div><div className="text-xs text-muted-foreground">{p.project_uid}</div></div></TableCell>
                                            <TableCell><Badge variant="outline" className={getStatusColor(p.status)}>{p.status?.replace(/_/g, ' ').toUpperCase()}</Badge></TableCell>
                                            <TableCell><Badge variant="outline" className={getPriorityColor(p.priority)}>{p.priority?.toUpperCase()}</Badge></TableCell>
                                            <TableCell>{p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : '—'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
