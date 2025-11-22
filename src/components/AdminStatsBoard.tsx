"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Stats = {
    userCount: number;
    pendingUsers: number;
    roomCount: number;
    reservationCount: number;
    bandCount: number;
    pendingBands: number;
};

export function AdminStatsBoard() {
    const [stats, setStats] = useState<Stats | null>(null);

    // Simple polling (WS had issues in some environments)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats", { cache: "no-store" });
                const data = await res.json();
                if (data?.success) setStats(data.data);
            } catch (err) {
                console.error("Failed to fetch stats", err);
            }
        };

        fetchStats();
        const poll = setInterval(fetchStats, 15000);
        return () => clearInterval(poll);
    }, []);

    const cards = [
        { label: "Total Users", value: stats?.userCount ?? "—", tone: "" },
        { label: "Pending Users", value: stats?.pendingUsers ?? "—", tone: "text-orange-500" },
        { label: "Total Bands", value: stats?.bandCount ?? "—", tone: "" },
        { label: "Pending Bands", value: stats?.pendingBands ?? "—", tone: "text-orange-500" },
        { label: "Total Rooms", value: stats?.roomCount ?? "—", tone: "" },
        { label: "Total Reservations", value: stats?.reservationCount ?? "—", tone: "" },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {cards.map((card) => (
                <Card key={card.label}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                        <CardTitle className="text-sm font-medium truncate">{card.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className={`text-2xl font-bold ${card.tone}`}>{card.value}</div>
                        <p className="text-xs text-muted-foreground">Auto-refreshing</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
