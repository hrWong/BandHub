import dbConnect from "@/lib/db";
import Reservation from "@/models/Reservation";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReservationCard } from "@/components/ReservationCard";

async function getReservations(userId: string) {
    await dbConnect();
    try {
        const reservations = await Reservation.find({ userId })
            .populate("roomId")
            .sort({ startTime: 1 })
            .lean();
        return JSON.parse(JSON.stringify(reservations));
    } catch (error) {
        return [];
    }
}

export default async function ReservationsPage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/login");
    }

    // @ts-ignore
    const reservations = await getReservations(session.user.id);

    const now = new Date();
    const buckets = {
        ongoing: [] as any[],
        upcoming: [] as any[],
        completed: [] as any[],
    };

    reservations.forEach((reservation: any) => {
        const start = new Date(reservation.startTime);
        const end = new Date(reservation.endTime);
        if (end < now) {
            buckets.completed.push(reservation);
        } else if (start <= now && end >= now) {
            buckets.ongoing.push(reservation);
        } else {
            buckets.upcoming.push(reservation);
        }
    });

    const hasAny = reservations.length > 0;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">My Reservations</h1>

            {!hasAny ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">No reservations found.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {buckets.ongoing.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Ongoing</h2>
                                <span className="text-sm text-muted-foreground">{buckets.ongoing.length} active</span>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {buckets.ongoing.map((reservation: any) => (
                                    <ReservationCard key={reservation._id} reservation={reservation} />
                                ))}
                            </div>
                        </section>
                    )}

                    {buckets.upcoming.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Upcoming</h2>
                                <span className="text-sm text-muted-foreground">{buckets.upcoming.length} scheduled</span>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {buckets.upcoming.map((reservation: any) => (
                                    <ReservationCard key={reservation._id} reservation={reservation} />
                                ))}
                            </div>
                        </section>
                    )}

                    {buckets.completed.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Completed</h2>
                                <span className="text-sm text-muted-foreground">{buckets.completed.length} past</span>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {buckets.completed.map((reservation: any) => (
                                    <ReservationCard key={reservation._id} reservation={reservation} canCancel={false} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
