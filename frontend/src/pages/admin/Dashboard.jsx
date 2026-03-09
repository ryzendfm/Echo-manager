import AdminOverviewCards from "@/components/dashboard/AdminOverviewCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Overview of your company performance and activities.
                </p>
            </div>

            <AdminOverviewCards />

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <div className="md:col-span-1 lg:col-span-4">
                    <RevenueChart />
                </div>
                <div className="md:col-span-1 lg:col-span-3">
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
