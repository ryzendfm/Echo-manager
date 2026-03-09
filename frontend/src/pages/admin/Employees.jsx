import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmployeeList from "@/components/employees/EmployeeList";
import AssignTask from "@/components/employees/AssignTask";
import LeaveRequests from "@/components/employees/LeaveRequests";
import ScrumCalls from "@/components/employees/ScrumCalls";

export default function AdminEmployees() {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get("tab") || "list";

    const handleTabChange = (value) => {
        setSearchParams({ tab: value });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                <p className="text-muted-foreground">
                    Manage employee records and leave requests.
                </p>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList className="w-full sm:w-auto flex h-auto overflow-x-auto justify-start p-1 no-scrollbar">
                    <TabsTrigger className="text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap" value="list">All Employees</TabsTrigger>
                    <TabsTrigger className="text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap" value="assign">Assign Task</TabsTrigger>
                    <TabsTrigger className="text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap" value="scrum">Scrum Calls</TabsTrigger>
                    <TabsTrigger className="text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap" value="leaves">Leave Requests</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                    <EmployeeList />
                </TabsContent>
                <TabsContent value="assign" className="space-y-4">
                    <AssignTask />
                </TabsContent>
                <TabsContent value="scrum" className="space-y-4">
                    <ScrumCalls />
                </TabsContent>
                <TabsContent value="leaves" className="space-y-4">
                    <LeaveRequests />
                </TabsContent>
            </Tabs>
        </div>
    );
}

