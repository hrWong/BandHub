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

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">My Reservations</h1>

            {reservations.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">No reservations found.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reservations.map((reservation: any) => (
                        <ReservationCard key={reservation._id} reservation={reservation} />
                    ))}
                </div>
            )}
        </div>
    );
}
