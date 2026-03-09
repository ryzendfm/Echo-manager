import TaskList from "@/components/tasks/TaskList";

export default function AdminTasks() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
                <p className="text-muted-foreground">
                    Monitor and manage tasks across all projects.
                </p>
            </div>
            <TaskList role="admin" />
        </div>
    );
}
