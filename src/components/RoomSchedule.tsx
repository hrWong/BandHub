import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { IReservation } from "@/models/Reservation";

interface RoomScheduleProps {
    reservations: IReservation[];
}

export function RoomSchedule({ reservations }: RoomScheduleProps) {
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
                        {upcoming.map((res) => (
                            <div key={String(res._id)} className="flex justify-between items-center border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-medium">{format(new Date(res.startTime), "PPP")}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(res.startTime), "p")} - {format(new Date(res.endTime), "p")}
                                    </p>
                                </div>
                                <div className="text-sm font-medium bg-secondary px-2 py-1 rounded">
                                    {res.bandName}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Past Bookings */}
                {past.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2 text-muted-foreground">Past Bookings</h3>
                        <div className="space-y-2">
                            {past.map((res) => (
                                <div key={String(res._id)} className="flex justify-between items-center opacity-60">
                                    <div>
                                        <p className="font-medium text-sm">{format(new Date(res.startTime), "PPP")}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(res.startTime), "p")} - {format(new Date(res.endTime), "p")}
                                        </p>
                                    </div>
                                    <div className="text-xs font-medium bg-red-100 text-red-800 px-2 py-1 rounded">
                                        {res.bandName}
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

