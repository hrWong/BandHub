import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';
import { auth } from "@/auth";

export async function GET(request: Request) {
    await dbConnect();
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const my = searchParams.get('my');

    try {
        let query: any = {};
        if (roomId) query.roomId = roomId;
        if (my === 'true' && session?.user) {
            // @ts-ignore
            query.userId = session.user.id;
        }

        const reservations = await Reservation.find(query).populate('roomId');
        return NextResponse.json({ success: true, data: reservations });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {

        const body = await request.json();
        const { roomId, startTime, endTime, recurringWeeks = 1 } = body;

        // @ts-ignore
        const isAdmin = session.user.role === 'admin';

        // Check if start time is in the past
        const now = new Date();
        const reservationStart = new Date(startTime);

        if (reservationStart < now) {
            return NextResponse.json({
                success: false,
                error: 'Cannot book time slots in the past'
            }, { status: 400 });
        }

        // 1. Booking Restriction: Non-admins can only book up to 7 days in advance
        if (!isAdmin) {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

            if (reservationStart > sevenDaysFromNow) {
                return NextResponse.json({
                    success: false,
                    error: 'Regular users can only book up to 7 days in advance'
                }, { status: 400 });
            }
        }

        // Prepare all slots to book
        const slotsToBook = [];
        const weeks = (isAdmin && recurringWeeks > 1) ? recurringWeeks : 1;

        for (let i = 0; i < weeks; i++) {
            const start = new Date(startTime);
            start.setDate(start.getDate() + (i * 7));

            const end = new Date(endTime);
            end.setDate(end.getDate() + (i * 7));

            slotsToBook.push({ start, end });
        }

        // 2. Check availability for ALL slots first
        for (const slot of slotsToBook) {
            const overlap = await Reservation.findOne({
                roomId,
                status: 'confirmed',
                $or: [
                    { startTime: { $lt: slot.end, $gte: slot.start } },
                    { endTime: { $gt: slot.start, $lte: slot.end } },
                    { startTime: { $lte: slot.start }, endTime: { $gte: slot.end } }
                ]
            });

            if (overlap) {
                return NextResponse.json({
                    success: false,
                    error: weeks > 1
                        ? `Conflict found for date ${slot.start.toLocaleDateString()}. Recurring booking failed.`
                        : 'Time slot already booked'
                }, { status: 409 });
            }
        }

        // 3. Create all reservations
        const createdReservations = [];
        for (const slot of slotsToBook) {
            const reservation = await Reservation.create({
                ...body,
                startTime: slot.start,
                endTime: slot.end,
                // @ts-ignore
                userId: session.user.id
            });
            createdReservations.push(reservation);
        }

        return NextResponse.json({ success: true, data: createdReservations }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

