import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectPhaseApi } from "@/api/projectPhaseApi";

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function ProjectFinancials() {
    const [financials, setFinancials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await projectPhaseApi.getAllFinancials();
                setFinancials(res.data.financials || []);
            } catch (err) {
                console.error("Failed to fetch financials:", err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const getStatusBadge = (status) => {
        const m = {
            'On Track': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'Over Budget': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'Completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        };
        return <Badge variant="outline" className={m[status] || ''}>{status}</Badge>;
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Project Financials</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : financials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No projects found.</div>
                ) : (
                    <>
                        {/* Mobile */}
                        <div className="space-y-3 sm:hidden">
                            {financials.map(f => (
                                <div key={f.project_id} className="border rounded-lg p-3 space-y-1.5">
                                    <div className="flex items-start justify-between">
                                        <span className="font-medium">{f.project_name}</span>
                                        {getStatusBadge(f.status)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                        <span className="text-muted-foreground">Budget: {fmt(f.total_budget)}</span>
                                        <span className="text-green-600">Collected: {fmt(f.total_collected)}</span>
                                        <span className="text-red-600">Expenses: {fmt(f.total_expenses)}</span>
                                        <span className={`font-semibold ${f.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            P/L: {f.profit_loss >= 0 ? '' : '-'}{fmt(Math.abs(f.profit_loss))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop */}
                        <div className="hidden sm:block rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Budget</TableHead>
                                        <TableHead>Collected</TableHead>
                                        <TableHead>Expenses</TableHead>
                                        <TableHead>Profit / Loss</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {financials.map(f => (
                                        <TableRow key={f.project_id}>
                                            <TableCell>
                                                <span className="font-medium">{f.project_name}</span>
                                                {f.client_name && <div className="text-xs text-muted-foreground">{f.client_name}</div>}
                                            </TableCell>
                                            <TableCell>{fmt(f.total_budget)}</TableCell>
                                            <TableCell className="text-green-600">{fmt(f.total_collected)}</TableCell>
                                            <TableCell className="text-red-600">{fmt(f.total_expenses)}</TableCell>
                                            <TableCell className={`font-semibold ${f.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {f.profit_loss >= 0 ? '' : '-'}{fmt(Math.abs(f.profit_loss))}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(f.status)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
