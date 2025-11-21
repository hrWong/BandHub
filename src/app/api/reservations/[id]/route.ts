import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';
import { auth } from "@/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
        }

        // Check if user owns the reservation or is an admin
        // @ts-ignore
        const isAdmin = session.user.role === 'admin';

        if (!isAdmin) {
            // @ts-ignore
            const reservationUserId = reservation.userId?._id?.toString() || reservation.userId?.toString();
            // @ts-ignore
            const isOwner = reservationUserId === session.user.id;

            if (!isOwner) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }
        }

        // Update only allowed fields
        if (body.bandName) reservation.bandName = body.bandName;
        if (body.purpose !== undefined) reservation.purpose = body.purpose;

        // Update times if provided
        if (body.startTime && body.endTime) {
            const newStartTime = new Date(body.startTime);
            const newEndTime = new Date(body.endTime);

            // Validate times
            if (newEndTime <= newStartTime) {
                return NextResponse.json({
                    success: false,
                    error: 'End time must be after start time'
                }, { status: 400 });
            }

            // Check for overlaps with other reservations (excluding this one)
            const overlap = await Reservation.findOne({
                _id: { $ne: id },
                roomId: reservation.roomId,
                status: 'confirmed',
                $or: [
                    { startTime: { $lt: newEndTime, $gte: newStartTime } },
                    { endTime: { $gt: newStartTime, $lte: newEndTime } },
                    { startTime: { $lte: newStartTime }, endTime: { $gte: newEndTime } }
                ]
            });

            if (overlap) {
                return NextResponse.json({
                    success: false,
                    error: 'Time slot conflicts with another reservation'
                }, { status: 409 });
            }

            reservation.startTime = newStartTime;
            reservation.endTime = newEndTime;
        }

        await reservation.save();
        return NextResponse.json({ success: true, data: reservation });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return NextResponse.json({ success: false, error: 'Reservation not found' }, { status: 404 });
        }

        // Check if user owns the reservation or is an admin
        // @ts-ignore
        const isAdmin = session.user.role === 'admin';

        // Only check ownership if not admin
        if (!isAdmin) {
            // @ts-ignore
            const reservationUserId = reservation.userId?._id?.toString() || reservation.userId?.toString();
            // @ts-ignore
            const isOwner = reservationUserId === session.user.id;

            if (!isOwner) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
            }
        }

        await Reservation.findByIdAndDelete(id);
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}
