import UserList from "@/components/users/UserList";

export default function AdminUsers() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Manage all user accounts and permissions.
                </p>
            </div>
            <UserList />
        </div>
    );
}
