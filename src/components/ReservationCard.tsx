"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ReservationCardProps {
    reservation: {
        _id: string;
        roomId: {
            name: string;
        };
        bandName: string;
        startTime: string;
        endTime: string;
        status: string;
        purpose?: string;
        type?: 'exclusive' | 'shared';
        participantCount?: number;
    };
    canCancel?: boolean;
}

export function ReservationCard({ reservation, canCancel = true }: ReservationCardProps) {
    const router = useRouter();
    const [isCancelling, setIsCancelling] = useState(false);

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this reservation?")) return;

        setIsCancelling(true);
        try {
            const res = await fetch(`/api/reservations/${reservation._id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to cancel");
            }

            toast.success("Reservation cancelled");
            router.refresh();
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsCancelling(false);
        }
    };

    const start = new Date(reservation.startTime);
    const end = new Date(reservation.endTime);
    const durationHours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 10) / 10;
    const now = new Date();
    const isPast = end < now;
    const statusVariant =
        reservation.status === "confirmed"
            ? "default"
            : reservation.status === "pending"
                ? "secondary"
                : "destructive";

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg text-balance">
                            {reservation.roomId?.name || "Unknown Room"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {reservation.bandName}
                            {/* @ts-ignore */}
                            {reservation.userId?.name && <span className="text-xs ml-1">({reservation.userId.name})</span>}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {reservation.type && (
                            <Badge variant={reservation.type === 'exclusive' ? 'default' : 'secondary'} className="w-fit capitalize">
                                {reservation.type}
                                {reservation.type === 'shared' && reservation.participantCount && ` (${reservation.participantCount})`}
                            </Badge>
                        )}
                        <Badge variant={statusVariant} className="w-fit capitalize">
                            {isPast ? "completed" : reservation.status}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="space-y-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="rounded-md bg-primary/10 px-2 py-1 leading-none text-primary">
                                {format(start, "PPP")}
                            </span>
                            <span className="rounded-md bg-muted/80 px-2 py-1 leading-none">
                                {format(start, "p")} – {format(end, "p")}
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground/80 font-medium">
                            Duration: {durationHours}h
                        </div>
                        {reservation.purpose && (
                            <div className="text-muted-foreground italic text-sm">
                                Purpose: {reservation.purpose}
                            </div>
                        )}
                    </div>
                    {canCancel && !isPast ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={handleCancel}
                            disabled={isCancelling}
                        >
                            {isCancelling ? "Cancelling..." : "Cancel Reservation"}
                        </Button>
                    ) : (
                        <p className="text-xs text-muted-foreground text-center">
                            This reservation has ended.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
