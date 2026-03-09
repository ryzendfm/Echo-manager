import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/api/dashboardApi";

export default function RecentActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await dashboardApi.getRecentActivity();
                setActivities(res.data.activities || []);
            } catch (err) {
                console.error("Failed to fetch recent activity:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across all modules</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">Loading activity...</div>
                ) : activities.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">No recent activity.</div>
                ) : (
                    <div className="space-y-8">
                        {activities.map((activity, index) => (
                            <div key={index} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={activity.avatar} alt="Avatar" />
                                    <AvatarFallback>{activity.initials}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {activity.user}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.action} <span className="font-semibold text-foreground">{activity.target}</span>
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">
                                    {activity.time}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
