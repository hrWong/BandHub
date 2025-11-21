import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';
import { auth } from "@/auth";

export async function GET() {
    const session = await auth();

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    try {
        const reservations = await Reservation.find({})
            .populate('roomId')
            .populate('userId', 'name email')
            .sort({ startTime: -1 })
            .lean();

        return NextResponse.json({ success: true, data: reservations });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
