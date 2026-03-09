import ProjectList from "@/components/projects/ProjectList";

export default function AdminProjects() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                <p className="text-muted-foreground">
                    Manage all company projects and deliverables.
                </p>
            </div>
            <ProjectList role="admin" />
        </div>
    );
}
