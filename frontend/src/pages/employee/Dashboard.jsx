import EmployeeOverviewCards from "@/components/dashboard/EmployeeOverviewCards";
import EmployeeCharts from "@/components/dashboard/EmployeeCharts";

export default function EmployeeDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here's your daily overview.
                </p>
            </div>

            <EmployeeOverviewCards />

            {/* My Tasks and Calendar will go here */}
            {/* My Tasks and Calendar will go here */}
            <EmployeeCharts />
        </div>
    );
}
