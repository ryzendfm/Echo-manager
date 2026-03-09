import { useState, useEffect } from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/api/dashboardApi";
import UpcomingScrumCalls from "./UpcomingScrumCalls";

export default function EmployeeCharts() {
    const [charts, setCharts] = useState({ velocity: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const res = await dashboardApi.getEmployeeCharts();
                if (res.data.success) {
                    setCharts(res.data.charts);
                }
            } catch (err) {
                console.error("Failed to fetch employee charts:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCharts();
    }, []);

    const VelocityTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md p-3">
                    <p className="text-muted-foreground mb-1">{payload[0].payload.fullDate}</p>
                    <p className="font-medium text-emerald-500">
                        {payload[0].value} Tasks Completed
                    </p>
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
            {/* Task Velocity */}
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Task Velocity</CardTitle>
                    <CardDescription>Your completion rate over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.velocity}>
                                <XAxis
                                    dataKey="date"
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
                                    tickFormatter={(value) => `${value}`}
                                    allowDecimals={false}
                                />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<VelocityTooltip />} />
                                <Bar dataKey="completed" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {(charts.velocity || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#10b981" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Scrum Calls */}
            <UpcomingScrumCalls />
        </div>
    );
}
