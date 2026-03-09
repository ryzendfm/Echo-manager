import { useState, useEffect } from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/api/dashboardApi";
import UpcomingForwardCalls from "./UpcomingForwardCalls";

export default function ClientCharts() {
    const [charts, setCharts] = useState({ budgetBilled: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const res = await dashboardApi.getClientCharts();
                if (res.data.success) {
                    setCharts(res.data.charts);
                }
            } catch (err) {
                console.error("Failed to fetch client charts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCharts();
    }, []);

    const BudgetTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md p-3">
                    <p className="font-medium mb-2">{data.fullProjectName}</p>
                    <div className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Budget:</span>
                        <span className="font-medium text-emerald-500">₹{data.budget.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">Billed:</span>
                        <span className="font-medium text-blue-500">₹{data.billed.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return <div className="flex flex-col gap-4 animate-pulse">
            <div className="w-full h-[350px] bg-muted rounded-xl"></div>
            <div className="w-full h-[350px] bg-muted rounded-xl"></div>
        </div>;
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Budget vs Billed (Composed Chart) */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>Estimated Budget vs Actual Billed Amount</CardDescription>
                </CardHeader>
                <CardContent>
                    {charts.budgetBilled && charts.budgetBilled.length > 0 ? (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.budgetBilled} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                    <XAxis
                                        dataKey="project"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                                    />
                                    <Tooltip content={<BudgetTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Legend />
                                    <Bar dataKey="budget" name="Estimated Budget" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="billed" name="Amount Billed" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                            No active projects found.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upcoming Forward Calls */}
            <UpcomingForwardCalls />
        </div>
    );
}
