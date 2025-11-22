"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { IReservation } from "@/models/Reservation";
import { Users } from "lucide-react";

interface RoomScheduleProps {
    reservations: IReservation[];
    roomCapacity: number;
}

export function RoomSchedule({ reservations, roomCapacity }: RoomScheduleProps) {
    // Filter for future reservations only
    const upcoming = reservations
        .filter(r => new Date(r.endTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const past = reservations
        .filter(r => new Date(r.endTime) <= new Date())
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
                {upcoming.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No upcoming bookings. The room is free!</p>
                ) : (
                    <div className="space-y-4">
                        {upcoming.map((res) => {
                            const isShared = res.type === 'shared';
                            const isExclusive = res.type === 'exclusive' || !res.type;
                            const displayName = isShared ? "Shared Session" : res.bandName;

                            return (
                                <div
                                    key={String(res._id)}
                                    className="flex flex-col gap-3 border-b pb-3 last:border-0"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium">{format(new Date(res.startTime), "PPP")}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(res.startTime), "p")} - {format(new Date(res.endTime), "p")}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant={isExclusive ? 'default' : 'secondary'} className="capitalize">
                                                {res.type || 'exclusive'}
                                            </Badge>
                                            {isShared && res.participantCount && (
                                                <Badge variant="outline" className="gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {res.participantCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs uppercase tracking-wide text-muted-foreground">Band</span>
                                        <div className="text-sm font-medium bg-secondary px-2 py-1 rounded">
                                            {displayName}
                                        </div>
                                    </div>
                                    {isShared && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <p className="text-muted-foreground italic flex-1">
                                                ✓ Shared practice - {res.participantCount || 1}/{roomCapacity} capacity used
                                            </p>
                                            {(roomCapacity - (res.participantCount || 1)) > 0 && (
                                                <Badge variant="outline" className="text-xs gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {roomCapacity - (res.participantCount || 1)} spots left
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                    {isExclusive && (
                                        <p className="text-xs text-muted-foreground italic">
                                            🔒 Exclusive booking - full room reserved
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                {/* Past Bookings */}
                {past.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Past Bookings</h3>
                        <div className="space-y-2">
                            {past.map((res) => (
                                <div
                                    key={String(res._id)}
                                    className="flex flex-col gap-2 opacity-60 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-sm">{format(new Date(res.startTime), "PPP")}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(res.startTime), "p")} - {format(new Date(res.endTime), "p")}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {res.type && (
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {res.type}
                                            </Badge>
                                        )}
                                        <div className="text-xs font-medium bg-muted px-2 py-1 rounded">
                                            {res.type === 'shared' ? "Shared Session" : res.bandName}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
