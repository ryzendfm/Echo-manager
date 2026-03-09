import TeamsList from "@/components/teams/TeamsList";

export default function AdminTeams() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
                <p className="text-muted-foreground">
                    View all project teams and their members.
                </p>
            </div>
            <TeamsList />
        </div>
    );
}
