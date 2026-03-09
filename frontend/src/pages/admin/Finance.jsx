import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionList from "@/components/finance/TransactionList";
import ProjectFinancials from "@/components/finance/ProjectFinancials";
import ProfitSharing from "@/components/finance/ProfitSharing";

export default function AdminFinance() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Finance</h1>
                <p className="text-muted-foreground">
                    Track income, expenses, and financial reports.
                </p>
            </div>
            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="flex w-full overflow-x-auto sm:grid sm:grid-cols-3 h-auto min-h-[40px] p-1 bg-muted rounded-lg hide-scrollbar scroll-smooth snap-x">
                    <TabsTrigger value="transactions" className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 snap-center">Transactions</TabsTrigger>
                    <TabsTrigger value="project-financials" className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 snap-center">Project Financials</TabsTrigger>
                    <TabsTrigger value="profit-sharing" className="flex-1 whitespace-nowrap text-xs sm:text-sm px-3 py-1.5 snap-center">Profit Sharing</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions" className="mt-4">
                    <TransactionList />
                </TabsContent>
                <TabsContent value="project-financials" className="mt-4">
                    <ProjectFinancials />
                </TabsContent>
                <TabsContent value="profit-sharing" className="mt-4">
                    <ProfitSharing />
                </TabsContent>
            </Tabs>
        </div>
    );
}
