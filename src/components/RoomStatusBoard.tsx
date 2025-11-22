"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Zap } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type RoomStatus = {
    _id: string;
    name: string;
    isAvailable: boolean;
    capacity: number;
    imageUrl?: string | null;
    equipment?: string[];
    status: "available" | "occupied" | "maintenance";
    currentReservation?: {
        bandName: string;
        endTime: string;
    } | null;
};

export function RoomStatusBoard() {
    const [rooms, setRooms] = useState<RoomStatus[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/admin/room-status", { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data?.success) {
                    setRooms(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch room status", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const poll = setInterval(fetchStatus, 15000);
        return () => clearInterval(poll);
    }, []);

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading live room status...</p>;
    }

    if (!loading && rooms.length === 0) {
        return <p className="text-sm text-muted-foreground">No rooms found. Add rooms to see live status.</p>;
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rooms.map((room) => {
                const isOccupied = room.status === "occupied";
                const isAvailable = room.status === "available";
                const tone = isOccupied
                    ? "border-orange-400 bg-orange-50 dark:border-orange-700/70 dark:bg-orange-900/20"
                    : isAvailable
                        ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700/70 dark:bg-emerald-900/20"
                        : "border-muted";
                return (
                    <Card key={room._id} className={cn("flex flex-col overflow-hidden border-2", tone)}>
                        <div className="relative aspect-video w-full bg-muted">
                            {room.imageUrl ? (
                                <Image
                                    src={room.imageUrl}
                                    alt={room.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5">
                                    <Zap className="h-10 w-10 text-primary/60" />
                                </div>
                            )}
                           
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-between space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{room.equipment?.slice(0, 3).join(", ") || "Standard setup"}</span>
                            </div>
                            <div className="mt-auto">
                                {room.currentReservation ? (
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Clock className="h-4 w-4 text-orange-500" />
                                        <span className="font-semibold">
                                            {room.currentReservation.bandName} · until{" "}
                                            {format(new Date(room.currentReservation.endTime), "p")}
                                        </span>
                                    </div>
                                ) : room.status === "maintenance" ? (
                                    <p className="font-medium text-destructive">Maintenance</p>
                                ) : (
                                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">Available now</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
