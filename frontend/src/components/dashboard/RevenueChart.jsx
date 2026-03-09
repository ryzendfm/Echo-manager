import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/api/dashboardApi";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md p-3">
                <p className="text-muted-foreground mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.stroke }}
                        />
                        <span className="font-medium" style={{ color: entry.stroke }}>
                            {entry.name}:
                        </span>
                        <span>
                            {`₹${Number(entry.value).toLocaleString('en-IN')}`}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function RevenueChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                const res = await dashboardApi.getRevenueChart();
                setData(res.data.chartData || []);
            } catch (err) {
                console.error("Failed to fetch revenue chart:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChart();
    }, []);

    const fmt = (v) => {
        if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
        if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
        return `₹${v}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly income vs expenses ({new Date().getFullYear()})</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                {loading ? (
                    <div className="flex h-[350px] items-center justify-center text-muted-foreground">Loading chart...</div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
                            <XAxis
                                dataKey="name"
                                stroke="var(--color-muted-foreground)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="var(--color-muted-foreground)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={fmt}
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                name="Expense"
                                stroke="#ef4444"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                            />
                            <Tooltip content={<CustomTooltip />} cursor={false} />
                            <Legend />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
}
