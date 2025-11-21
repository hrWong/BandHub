import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import Reservation from '@/models/Reservation';

export async function GET() {
    await dbConnect();

    try {
        // Clear existing data
        await Room.deleteMany({});
        await Reservation.deleteMany({});

        const rooms = [
            {
                name: "Studio A - The Big Stage",
                capacity: 10,
                equipment: ["Drum Kit", "PA System", "3 Amps", "Keyboard", "Microphones"],
                isAvailable: true,
            },
            {
                name: "Studio B - Cozy Corner",
                capacity: 5,
                equipment: ["Drum Kit", "PA System", "2 Amps"],
                isAvailable: true,
            },
            {
                name: "Studio C - Recording Booth",
                capacity: 4,
                equipment: ["Recording Console", "Vocal Booth", "Monitors"],
                isAvailable: true,
            },
            {
                name: "Studio D - Practice Room",
                capacity: 3,
                equipment: ["Piano", "Music Stands"],
                isAvailable: false, // Maintenance
            }
        ];

        await Room.insertMany(rooms);

        return NextResponse.json({ success: true, message: "Database seeded successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
