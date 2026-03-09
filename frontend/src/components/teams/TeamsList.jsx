import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Briefcase, X, UserPlus, Calendar, DollarSign, Flag, Code, Loader2, ArrowLeft } from "lucide-react";
import { projectApi } from "@/api/projectApi";
import { employeeApi } from "@/api/employeeApi";
import { BACKEND_URL } from "@/api/axiosInstance";
import { toast } from "sonner";

const statusColors = {
    planning: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    on_hold: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const priorityColors = {
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function getInitials(first, last) {
    return `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
}

export default function TeamsList() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Team detail popup
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [allEmployees, setAllEmployees] = useState([]);
    const [teamMemberIds, setTeamMemberIds] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [savingMembers, setSavingMembers] = useState(false);

    // Add member view
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberSearch, setMemberSearch] = useState("");
    const [newMemberIds, setNewMemberIds] = useState([]);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const res = await projectApi.getAllTeams();
            setTeams(res.data.teams || []);
        } catch (err) {
            console.error("Failed to fetch teams:", err);
        } finally {
            setLoading(false);
        }
    };

    const openTeamDetail = async (team) => {
        setSelectedTeam(team);
        setShowAddMember(false);
        setMemberSearch("");
        setNewMemberIds([]);
        setLoadingMembers(true);

        try {
            const [empRes, memberRes] = await Promise.all([
                employeeApi.getAll(),
                projectApi.getProjectEmployees(team.project.id),
            ]);
            setAllEmployees((empRes.data.employees || []).filter(e => e.is_active));
            setTeamMemberIds((memberRes.data.employees || []).map(e => e.id));
        } catch (err) {
            console.error("Failed to fetch team data:", err);
        } finally {
            setLoadingMembers(false);
        }
    };

    const removeMember = async (employeeId) => {
        const updatedIds = teamMemberIds.filter(id => id !== employeeId);
        try {
            setSavingMembers(true);
            await projectApi.assignProjectEmployees(selectedTeam.project.id, updatedIds);
            setTeamMemberIds(updatedIds);

            // Update selectedTeam members in place
            setSelectedTeam(prev => ({
                ...prev,
                members: prev.members.filter(m => m.id !== employeeId),
                memberCount: prev.memberCount - 1,
            }));

            toast.success("Member removed");
            fetchTeams();
        } catch (err) {
            console.error("Failed to remove member:", err);
            toast.error("Failed to remove member");
        } finally {
            setSavingMembers(false);
        }
    };

    const openAddMemberView = () => {
        setShowAddMember(true);
        setMemberSearch("");
        setNewMemberIds([...teamMemberIds]);
    };

    const toggleNewMember = (id) => {
        setNewMemberIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const saveNewMembers = async () => {
        try {
            setSavingMembers(true);
            await projectApi.assignProjectEmployees(selectedTeam.project.id, newMemberIds);
            setTeamMemberIds(newMemberIds);

            // Rebuild members list from allEmployees
            const updatedMembers = allEmployees.filter(e => newMemberIds.includes(e.id));
            setSelectedTeam(prev => ({
                ...prev,
                members: updatedMembers,
                memberCount: updatedMembers.length,
            }));

            toast.success("Team members updated");
            setShowAddMember(false);
            fetchTeams();
        } catch (err) {
            console.error("Failed to update members:", err);
            toast.error("Failed to update members");
        } finally {
            setSavingMembers(false);
        }
    };

    const closeDetail = () => {
        setSelectedTeam(null);
        setShowAddMember(false);
    };

    const filteredTeams = teams.filter((team) => {
        if (team.memberCount === 0) return false;
        const matchesStatus = statusFilter === "all" || team.project.status === statusFilter;
        if (!matchesStatus) return false;

        const term = searchTerm.toLowerCase();
        if (!term) return true;

        if (team.teamName.toLowerCase().includes(term)) return true;
        if (team.project.project_name?.toLowerCase().includes(term)) return true;
        if (team.project.project_uid?.toLowerCase().includes(term)) return true;
        if (team.members.some(m =>
            m.user?.first_name?.toLowerCase().includes(term) ||
            m.user?.last_name?.toLowerCase().includes(term) ||
            `${m.user?.first_name} ${m.user?.last_name}`.toLowerCase().includes(term)
        )) return true;

        return false;
    });

    const sortedTeams = [...filteredTeams].sort((a, b) => b.memberCount - a.memberCount);

    // Employees available to add (not already in team)
    const availableEmployees = allEmployees.filter(emp => {
        const term = memberSearch.toLowerCase();
        const matchesSearch = !term ||
            `${emp.user?.first_name} ${emp.user?.last_name}`.toLowerCase().includes(term) ||
            emp.employee_uid?.toLowerCase().includes(term) ||
            emp.designation?.toLowerCase().includes(term);
        return matchesSearch;
    });

    const newlyAddedCount = newMemberIds.filter(id => !teamMemberIds.includes(id)).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Search bar + Status filter */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-md flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by project, team, or employee name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    <span>{teams.length} project{teams.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>
                        {teams.filter(t => t.memberCount > 0).length} active team{teams.filter(t => t.memberCount > 0).length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Team cards grid */}
            {sortedTeams.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No teams found</p>
                    <p className="text-sm">Try adjusting your search or assign employees to projects.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedTeams.map((team) => (
                        <Card
                            key={team.project.id}
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => openTeamDetail(team)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <CardTitle className="text-base truncate">
                                            {team.teamName}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-0.5">
                                            {team.project.project_uid}
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        className={`text-[10px] px-2 py-0.5 shrink-0 ${statusColors[team.project.status] || "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {team.project.status?.replace(/_/g, " ").toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>
                                        {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {team.memberCount === 0 ? (
                                    <div className="text-xs text-muted-foreground italic py-2 text-center border rounded-md border-dashed">
                                        No members assigned yet
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {team.members.map((member) => (
                                            <div key={member.id} className="flex items-center gap-2.5">
                                                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {getInitials(member.user?.first_name, member.user?.last_name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium truncate">
                                                        {member.user?.first_name} {member.user?.last_name}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground truncate">
                                                        {member.designation || "—"}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[10px] shrink-0">
                                                    {member.department?.toUpperCase() || "—"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Team Detail Dialog */}
            <Dialog open={!!selectedTeam} onOpenChange={(open) => { if (!open) closeDetail(); }}>
                <DialogContent className="sm:max-w-[600px] h-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden">
                    {showAddMember ? (
                        /* ── Add Member View ── */
                        <>
                            <DialogHeader className="shrink-0">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() => setShowAddMember(false)}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="min-w-0">
                                        <DialogTitle>Add Team Members</DialogTitle>
                                        <DialogDescription>
                                            Select employees to add to {selectedTeam?.teamName}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3 pt-1">
                                <div className="relative shrink-0">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employees..."
                                        className="pl-8 h-9 text-sm"
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto border rounded-md divide-y">
                                    {availableEmployees.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">No employees found.</div>
                                    ) : (
                                        availableEmployees.map((emp) => {
                                            const isSelected = newMemberIds.includes(emp.id);
                                            const isExisting = teamMemberIds.includes(emp.id);
                                            const name = `${emp.user?.first_name || ""} ${emp.user?.last_name || ""}`.trim();
                                            return (
                                                <div
                                                    key={emp.id}
                                                    className={`flex items-center gap-3 p-2.5 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                                                    onClick={() => toggleNewMember(emp.id)}
                                                >
                                                    <Checkbox checked={isSelected} className="shrink-0" />
                                                    <Avatar className="h-7 w-7 shrink-0">
                                                        <AvatarImage src={emp.user?.avatar ? `${BACKEND_URL}/${emp.user.avatar}` : undefined} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {getInitials(emp.user?.first_name, emp.user?.last_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{name}</div>
                                                        <div className="text-[11px] text-muted-foreground">{emp.employee_uid} · {emp.designation}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {isExisting && (
                                                            <Badge variant="secondary" className="text-[10px]">Current</Badge>
                                                        )}
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {emp.department?.toUpperCase() || "—"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground shrink-0">
                                    {newMemberIds.length} selected · {newlyAddedCount} new member{newlyAddedCount !== 1 ? "s" : ""} to add
                                </div>
                            </div>
                            <DialogFooter className="shrink-0">
                                <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
                                <Button onClick={saveNewMembers} disabled={savingMembers}>
                                    {savingMembers && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Members
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        /* ── Team Detail View ── */
                        <>
                            <DialogHeader className="shrink-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <DialogTitle className="truncate text-lg">{selectedTeam?.teamName}</DialogTitle>
                                        <DialogDescription>{selectedTeam?.project?.project_uid}</DialogDescription>
                                    </div>
                                    <Badge
                                        className={`text-[10px] sm:text-xs shrink-0 ${statusColors[selectedTeam?.project?.status] || "bg-gray-100 text-gray-700"}`}
                                    >
                                        {selectedTeam?.project?.status?.replace(/_/g, " ").toUpperCase()}
                                    </Badge>
                                </div>
                            </DialogHeader>
                            <div className="flex-1 min-h-0 overflow-y-auto space-y-4 sm:space-y-5">
                                {/* Project Info - stacked on mobile, grid on desktop */}
                                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3 text-sm">
                                    {selectedTeam?.project?.priority && (
                                        <div className="flex items-center gap-2 rounded-lg border p-2.5 sm:p-2">
                                            <Flag className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">Priority:</span>
                                            <Badge className={`text-[10px] ml-auto sm:ml-0 ${priorityColors[selectedTeam.project.priority] || ""}`}>
                                                {selectedTeam.project.priority?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    )}
                                    {selectedTeam?.project?.deadline && (
                                        <div className="flex items-center gap-2 rounded-lg border p-2.5 sm:p-2">
                                            <Calendar className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">Deadline:</span>
                                            <span className="font-medium ml-auto sm:ml-0">{new Date(selectedTeam.project.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    )}
                                    {selectedTeam?.project?.budget_estimated > 0 && (
                                        <div className="flex items-center gap-2 rounded-lg border p-2.5 sm:p-2">
                                            <DollarSign className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">Budget:</span>
                                            <span className="font-medium ml-auto sm:ml-0">RS {parseFloat(selectedTeam.project.budget_estimated).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tech Stack */}
                                {selectedTeam?.project?.tech_stack && selectedTeam.project.tech_stack.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Code className="h-3.5 w-3.5" />
                                            Tech Stack
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedTeam.project.tech_stack.map((tech, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {selectedTeam?.project?.description && (
                                    <div className="space-y-1.5">
                                        <div className="text-xs text-muted-foreground">Description</div>
                                        <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-md p-3">{selectedTeam.project.description}</p>
                                    </div>
                                )}

                                {/* Team Members */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            <Users className="h-4 w-4" />
                                            Team Members ({selectedTeam?.members?.length || 0})
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 sm:h-7 text-xs px-3"
                                            onClick={openAddMemberView}
                                            disabled={loadingMembers}
                                        >
                                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                                            Add Members
                                        </Button>
                                    </div>

                                    {loadingMembers ? (
                                        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading members...
                                        </div>
                                    ) : !selectedTeam?.members?.length ? (
                                        <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-md border-dashed">
                                            No members assigned yet. Click "Add Members" to get started.
                                        </div>
                                    ) : (
                                        <div className="space-y-0 border rounded-md divide-y">
                                            {selectedTeam.members.map((member) => {
                                                const name = `${member.user?.first_name || ""} ${member.user?.last_name || ""}`.trim();
                                                return (
                                                    <div key={member.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5">
                                                        <Avatar className="h-8 w-8 shrink-0">
                                                            <AvatarImage src={member.user?.avatar ? `${BACKEND_URL}/${member.user.avatar}` : undefined} />
                                                            <AvatarFallback className="text-xs">
                                                                {getInitials(member.user?.first_name, member.user?.last_name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium truncate">{name || "—"}</div>
                                                            <div className="text-[11px] text-muted-foreground truncate">
                                                                {member.employee_uid} · {member.designation || "—"}
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="text-[10px] shrink-0 hidden sm:inline-flex">
                                                            {member.department?.toUpperCase() || "—"}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                                                            disabled={savingMembers}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
