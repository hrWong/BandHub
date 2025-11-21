import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import Reservation from "@/models/Reservation";
import { BookingForm } from "@/components/BookingForm";
import { RoomSchedule } from "@/components/RoomSchedule";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Users, Music } from "lucide-react";

async function getRoomData(id: string) {
    await dbConnect();
    try {
        const room = await Room.findById(id).lean();
        if (!room) return { room: null, reservations: [] };

        const reservations = await Reservation.find({
            roomId: id,
            endTime: { $gt: new Date() } // Get all bookings that haven't ended yet
        }).lean();

        return {
            room: JSON.parse(JSON.stringify(room)),
            reservations: JSON.parse(JSON.stringify(reservations))
        };
    } catch (error) {
        return { room: null, reservations: [] };
    }
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { room, reservations } = await getRoomData(id);

    if (!room) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-balance">{room.name}</h1>
                    <Badge
                        variant={room.isAvailable ? "default" : "secondary"}
                        className="w-full justify-center text-lg px-4 py-1 sm:w-auto"
                    >
                        {room.isAvailable ? "Available" : "Maintenance"}
                    </Badge>
                </div>

                <div className="flex flex-col gap-3 text-muted-foreground sm:flex-row sm:flex-wrap">
                    <div className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        <span>Capacity: {room.capacity}</span>
                    </div>
                    <div className="flex items-center">
                        <Music className="mr-2 h-5 w-5" />
                        <span>Equipment: {room.equipment.join(", ")}</span>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
                <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">Book a Session</h2>
                    <BookingForm roomId={room._id} roomName={room.name} />
                </div>
                <div className="space-y-6">
                    <RoomSchedule reservations={reservations} />
                </div>
            </div>
        </div>
    );
}
