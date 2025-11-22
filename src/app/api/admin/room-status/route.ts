import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import Reservation from "@/models/Reservation";

export async function GET() {
    await dbConnect();

    const now = new Date();
    const activeReservations = await Reservation.find({
        startTime: { $lte: now },
        endTime: { $gt: now },
        status: "confirmed",
    }).populate("roomId");

    const activeMap = new Map<string, any>();
    activeReservations.forEach((res: any) => {
        const roomId = String(res.roomId?._id || res.roomId);
        const existing = activeMap.get(roomId);

        // If no existing reservation for this room, or the new one ends later, update it
        if (!existing || new Date(res.endTime) > new Date(existing.endTime)) {
            activeMap.set(roomId, res);
        }
    });

    const rooms = await Room.find({}).lean();

    const payload = rooms.map((room: any) => {
        const active = activeMap.get(String(room._id));
        return {
            _id: room._id,
            name: room.name,
            isAvailable: room.isAvailable,
            capacity: room.capacity,
            imageUrl: room.imageUrl || null,
            equipment: room.equipment || [],
            status: active ? "occupied" : room.isAvailable ? "available" : "maintenance",
            currentReservation: active
                ? {
                    bandName: active.bandName,
                    endTime: active.endTime,
                }
                : null,
        };
    });

    return NextResponse.json({ success: true, data: payload });
}
