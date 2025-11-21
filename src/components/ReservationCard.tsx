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
    };
}

export function ReservationCard({ reservation }: ReservationCardProps) {
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

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="text-lg text-balance">
                        {reservation.roomId?.name || "Unknown Room"}
                    </CardTitle>
                    <Badge
                        variant={reservation.status === "confirmed" ? "default" : "destructive"}
                        className="w-fit"
                    >
                        {reservation.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="font-medium">Band: {reservation.bandName}</div>
                        <div className="text-muted-foreground">
                            Date: {format(new Date(reservation.startTime), "PPP")}
                        </div>
                        <div className="text-muted-foreground">
                            Time: {format(new Date(reservation.startTime), "p")} -{" "}
                            {format(new Date(reservation.endTime), "p")}
                        </div>
                        {reservation.purpose && (
                            <div className="text-muted-foreground italic">
                                Purpose: {reservation.purpose}
                            </div>
                        )}
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={handleCancel}
                        disabled={isCancelling}
                    >
                        {isCancelling ? "Cancelling..." : "Cancel Reservation"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
