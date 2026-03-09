import { useState, useEffect } from "react";
import { projectApi } from "@/api/projectApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, Search, ExternalLink, Users, Loader2, Calendar, IndianRupee, Eye } from "lucide-react";

export default function ClientMyProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [selectedProject, setSelectedProject] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await projectApi.getMyProjects();
            setProjects(res.data.projects || []);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDetails = async (project) => {
        setSelectedProject(project);
        setTeamMembers([]);
        setLoadingDetails(true);
        try {
            const res = await projectApi.getProjectEmployees(project.id);
            setTeamMembers(res.data.employees || res.data || []);
        } catch (err) {
            console.error("Failed to fetch team members:", err);
        } finally {
            setLoadingDetails(false);
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

    const getProgressPercent = (status) => {
        const m = { planning: 10, in_progress: 50, on_hold: 35, completed: 100, cancelled: 0 };
        return m[status] || 0;
    };

    const parseTechStack = (techStack) => {
        if (!techStack) return [];
        if (Array.isArray(techStack)) return techStack;
        try {
            const parsed = JSON.parse(techStack);
            return Array.isArray(parsed) ? parsed : [String(parsed)];
        } catch {
            return techStack.split(",").map(s => s.trim()).filter(Boolean);
        }
    };

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Projects</h1>
                <p className="text-muted-foreground">Track the progress of your projects.</p>
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
                        <p className="text-muted-foreground">No projects found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((p) => {
                        const progress = getProgressPercent(p.status);
                        return (
                            <Card
                                key={p.id}
                                className="overflow-hidden cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => handleOpenDetails(p)}
                            >
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">{p.project_name}</h3>
                                                <p className="text-xs text-muted-foreground">{p.project_uid}</p>
                                            </div>
                                            <Badge variant="outline" className={getStatusColor(p.status)}>
                                                {p.status?.replace(/_/g, ' ').toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2">
                                            <Badge variant="outline" className={getPriorityColor(p.priority)}>
                                                {p.priority?.toUpperCase()}
                                            </Badge>
                                        </div>

                                        {/* Progress bar */}
                                        <div>
                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                <span>Progress</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary rounded-full h-2 transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Budget</span>
                                                <p className="font-medium">₹{Number(p.budget_estimated || 0).toLocaleString('en-IN')}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Deadline</span>
                                                <p className="font-medium">
                                                    {p.deadline ? new Date(p.deadline).toLocaleDateString('en-IN') : '—'}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDetails(p);
                                            }}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Project Details Modal */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => { if (!open) setSelectedProject(null); }}>
                <DialogContent className="sm:max-w-3xl sm:max-h-[90vh] p-0">
                    <ScrollArea className="sm:max-h-[90vh]">
                        <div className="p-6 space-y-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl">{selectedProject?.project_name}</DialogTitle>
                                <DialogDescription className="text-sm font-mono">
                                    {selectedProject?.project_uid}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Status & Priority */}
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className={getStatusColor(selectedProject?.status)}>
                                    {selectedProject?.status?.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className={getPriorityColor(selectedProject?.priority)}>
                                    {selectedProject?.priority?.toUpperCase()}
                                </Badge>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                                <p className="text-sm leading-relaxed">
                                    {selectedProject?.description || "No description available."}
                                </p>
                            </div>

                            {/* Tech Stack */}
                            {(() => {
                                const stack = parseTechStack(selectedProject?.tech_stack);
                                return stack.length > 0 ? (
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Tech Stack</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {stack.map((tech, i) => (
                                                <Badge key={i} variant="secondary">{tech}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ) : null;
                            })()}

                            {/* File Attachments */}
                            {selectedProject?.file_attachments && (
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Attachments</h4>
                                    <a
                                        href={selectedProject.file_attachments.startsWith('http')
                                            ? selectedProject.file_attachments
                                            : `${BACKEND_URL}/${selectedProject.file_attachments}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        {selectedProject.file_attachments.split('/').pop()}
                                    </a>
                                </div>
                            )}

                            {/* Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <IndianRupee className="h-4 w-4" />
                                        <span className="text-xs font-semibold">Budget</span>
                                    </div>
                                    <p className="text-lg font-semibold">
                                        ₹{Number(selectedProject?.budget_estimated || 0).toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Calendar className="h-4 w-4" />
                                        <span className="text-xs font-semibold">Deadline</span>
                                    </div>
                                    <p className="text-lg font-semibold">
                                        {selectedProject?.deadline
                                            ? new Date(selectedProject.deadline).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })
                                            : "N/A"}
                                    </p>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Briefcase className="h-4 w-4" />
                                        <span className="text-xs font-semibold">Progress</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary rounded-full h-2 transition-all"
                                                style={{ width: `${getProgressPercent(selectedProject?.status)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {getProgressPercent(selectedProject?.status)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold text-muted-foreground">Team Members</h4>
                                </div>
                                {loadingDetails ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading team...
                                    </div>
                                ) : teamMembers.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2">No team members assigned.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {teamMembers.map((member) => {
                                            const user = member.user || member;
                                            const name = user.name || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                                            return (
                                                <div key={member.id || member.employee_id} className="flex items-center gap-3 rounded-lg border p-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={(user.avatar || user.profile_image) ? ((user.avatar || user.profile_image).startsWith('http') ? (user.avatar || user.profile_image) : `${BACKEND_URL}/${user.avatar || user.profile_image}`) : ''} alt={name} />
                                                        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{name || "Unnamed"}</p>
                                                        {(member.role || member.designation) && (
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {member.role || member.designation}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
