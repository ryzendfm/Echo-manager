import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Plus, Trash2 } from "lucide-react";
import { profitSharingApi } from "@/api/profitSharingApi";
import { toast } from "sonner";
import api from "@/api/axiosInstance";

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export default function ProfitSharing() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [companyPct, setCompanyPct] = useState(50);
    const [adminShares, setAdminShares] = useState([]);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [adminUsers, setAdminUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await profitSharingApi.getOverview();
            setData(res.data);
            setCompanyPct(res.data.settings.company_share_percent);
            setAdminShares(res.data.adminBreakdown || []);
        } catch (err) {
            console.error("Failed to fetch profit sharing:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminUsers = async () => {
        try {
            const res = await api.get('/users');
            const users = (res.data.users || []).filter(u => u.role === 'admin');
            setAdminUsers(users);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            await profitSharingApi.updateSettings({ company_share_percent: companyPct });

            // Save admin shares
            if (adminShares.length > 0) {
                const total = adminShares.reduce((s, a) => s + a.share_percent, 0);
                if (Math.abs(total - 100) > 0.01) {
                    toast.error("Admin shares must total 100%");
                    setSaving(false);
                    return;
                }
                await profitSharingApi.updateAdminsBulk(adminShares.map(a => ({ id: a.id, share_percent: a.share_percent })));
            }

            toast.success("Settings saved");
            setShowSettings(false);
            fetchData();
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleAddAdmin = async () => {
        if (!selectedUserId) return;
        try {
            // Default equal split
            const count = adminShares.length + 1;
            const pct = parseFloat((100 / count).toFixed(2));
            await profitSharingApi.addAdmin({ user_id: selectedUserId, share_percent: pct });

            // Re-balance existing shares
            const allAdmins = await profitSharingApi.getAdmins();
            const admins = allAdmins.data.admins || [];
            const equalPct = parseFloat((100 / admins.length).toFixed(2));
            await profitSharingApi.updateAdminsBulk(admins.map(a => ({ id: a.id, share_percent: equalPct })));

            toast.success("Admin added to profit sharing");
            setShowAddAdmin(false);
            setSelectedUserId('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add admin");
        }
    };

    const handleRemoveAdmin = async (id) => {
        try {
            await profitSharingApi.removeAdmin(id);
            toast.success("Admin removed");
            fetchData();
        } catch (err) {
            toast.error("Failed to remove admin");
        }
    };

    if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    if (!data) return <div className="text-center py-8 text-muted-foreground">Failed to load data.</div>;

    const adminSharesTotal = adminShares.reduce((s, a) => s + a.share_percent, 0);

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card><CardContent className="pt-4 pb-4 px-4">
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                    <p className={`text-lg font-bold ${data.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(data.totalProfit)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 px-4">
                    <p className="text-xs text-muted-foreground">Company Share ({data.settings.company_share_percent}%)</p>
                    <p className="text-lg font-bold">{fmt(data.companyShare)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 px-4">
                    <p className="text-xs text-muted-foreground">Admins Pool ({data.settings.admins_share_percent}%)</p>
                    <p className="text-lg font-bold">{fmt(data.adminsPool)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 pb-4 px-4 flex items-center justify-center">
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                        <Settings className="mr-1 h-4 w-4" /> Settings
                    </Button>
                </CardContent></Card>
            </div>

            {/* Admin Breakdown */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Admin Profit Sharing</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => { fetchAdminUsers(); setShowAddAdmin(true); }}>
                        <Plus className="mr-1 h-3 w-3" /> Add Admin
                    </Button>
                </CardHeader>
                <CardContent>
                    {adminShares.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No admins configured for profit sharing.</p>
                    ) : (
                        <>
                            {/* Mobile */}
                            <div className="space-y-2 sm:hidden">
                                {adminShares.map(a => (
                                    <div key={a.id} className="border rounded-lg p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{a.name}</p>
                                            <p className="text-xs text-muted-foreground">{a.share_percent}% — {fmt(a.share_amount)}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveAdmin(a.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop */}
                            <div className="hidden sm:block rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Admin</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Share %</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adminShares.map(a => (
                                            <TableRow key={a.id}>
                                                <TableCell className="font-medium">{a.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{a.email}</TableCell>
                                                <TableCell>{a.share_percent}%</TableCell>
                                                <TableCell className="font-semibold text-green-600">{fmt(a.share_amount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveAdmin(a.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Settings Dialog */}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Profit Sharing Settings</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Company Share %</Label>
                            <Input type="number" min="0" max="100" value={companyPct} onChange={(e) => setCompanyPct(parseFloat(e.target.value) || 0)} />
                            <p className="text-xs text-muted-foreground">Admins Share: {(100 - companyPct).toFixed(2)}%</p>
                        </div>

                        {adminShares.length > 0 && (
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label>Per-Admin Split</Label>
                                    <span className={`text-xs ${Math.abs(adminSharesTotal - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                                        Total: {adminSharesTotal.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {adminShares.map((a, idx) => (
                                        <div key={a.id} className="flex items-center gap-2">
                                            <span className="text-sm flex-1 truncate">{a.name}</span>
                                            <Input type="number" min="0" max="100" className="w-24" value={a.share_percent}
                                                onChange={(e) => {
                                                    const updated = [...adminShares];
                                                    updated[idx] = { ...updated[idx], share_percent: parseFloat(e.target.value) || 0 };
                                                    setAdminShares(updated);
                                                }}
                                            />
                                            <span className="text-xs text-muted-foreground">%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Admin Dialog */}
            <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Add Admin to Profit Sharing</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Select Admin User</Label>
                            <Select value={selectedUserId ? String(selectedUserId) : ''} onValueChange={setSelectedUserId}>
                                <SelectTrigger><SelectValue placeholder="Select admin" /></SelectTrigger>
                                <SelectContent>
                                    {adminUsers
                                        .filter(u => !adminShares.some(a => a.user_id === u.id))
                                        .map(u => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.first_name} {u.last_name} ({u.email})</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddAdmin}>Add Admin</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
