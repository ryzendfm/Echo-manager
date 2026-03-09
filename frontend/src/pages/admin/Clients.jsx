import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClientList from "@/components/clients/ClientList";
import ForwardCalls from "@/components/clients/ForwardCalls";

export default function AdminClients() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients</h1>
                <p className="text-muted-foreground">
                    Manage client profiles and agreements.
                </p>
            </div>

            <Tabs defaultValue="list" className="space-y-4">
                <TabsList className="w-full sm:w-auto flex h-auto overflow-x-auto justify-start p-1 no-scrollbar">
                    <TabsTrigger className="text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap" value="list">All Clients</TabsTrigger>
                    <TabsTrigger className="text-xs sm:text-sm py-1.5 sm:py-2 whitespace-nowrap" value="forward">Forward Calls</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                    <ClientList />
                </TabsContent>
                <TabsContent value="forward" className="space-y-4">
                    <ForwardCalls />
                </TabsContent>
            </Tabs>
        </div>
    );
}
