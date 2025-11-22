import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Reservation from '@/models/Reservation';
import mongoose from 'mongoose';
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

        const reservations = await Reservation.find(query)
            .populate('roomId')
            .populate('userId', 'name email')
            .populate('bandId', 'name');

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

    const sessionDb = await mongoose.startSession();

    try {
        // Read body once before any transaction attempts
        const body = await request.json();
        let result: any;

        // Try to use transaction, fallback to non-transactional if not supported
        try {
            await sessionDb.withTransaction(async () => {
                result = await processReservation(body, session, sessionDb);
            });
        } catch (txError: any) {
            // If transaction not supported (not a replica set), run without transaction
            if (txError.message?.includes('Transaction') || txError.message?.includes('replica set')) {
                console.warn('Transactions not supported, running without transaction');
                result = await processReservation(body, session, null);
            } else {
                throw txError;
            }
        }

        return NextResponse.json({ success: true, data: result }, { status: 201 });

    } catch (error) {
        const msg = (error as Error).message;
        const status = msg.includes('Time slot already booked') || msg.includes('Conflict found') || msg.includes('capacity exceeded') ? 409 : 400;
        return NextResponse.json({ success: false, error: msg }, { status });
    } finally {
        await sessionDb.endSession();
    }
}

async function processReservation(body: any, session: any, sessionDb: any) {
    const { roomId, startTime, endTime, recurringWeeks = 1, bandId } = body;

    // @ts-ignore
    const isAdmin = session.user.role === 'admin';

    // Check if start time is in the past
    const now = new Date();
    const reservationStart = new Date(startTime);

    if (reservationStart < now) {
        throw new Error('Cannot book time slots in the past');
    }

    // 1. Booking Restriction: Non-admins can only book up to 7 days in advance
    if (!isAdmin) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        if (reservationStart > sevenDaysFromNow) {
            throw new Error('Regular users can only book up to 7 days in advance');
        }

        // Check duration limit (max 5 hours)
        const durationHours = (new Date(endTime).getTime() - reservationStart.getTime()) / (1000 * 60 * 60);
        if (durationHours > 5) {
            throw new Error('Maximum reservation duration is 5 hours');
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
    const Room = (await import('@/models/Room')).default;

    for (const slot of slotsToBook) {
        const reservationType = body.type || 'exclusive';
        const participantCount = body.participantCount || 1;

        // Find all overlapping reservations
        const query = {
            roomId,
            status: 'confirmed',
            $or: [
                { startTime: { $lt: slot.end, $gte: slot.start } },
                { endTime: { $gt: slot.start, $lte: slot.end } },
                { startTime: { $lte: slot.start }, endTime: { $gte: slot.end } }
            ]
        };

        const overlappingReservations = sessionDb
            ? await Reservation.find(query).session(sessionDb)
            : await Reservation.find(query);

        // If booking exclusive, ANY overlap is a conflict
        if (reservationType === 'exclusive') {
            if (overlappingReservations.length > 0) {
                throw new Error(weeks > 1
                    ? `Conflict found for date ${slot.start.toLocaleDateString()}. Recurring booking failed.`
                    : 'Time slot already booked');
            }
        }

        // If booking shared, check for exclusive conflicts and capacity
        if (reservationType === 'shared') {
            // Check if any overlapping reservation is exclusive
            const hasExclusiveConflict = overlappingReservations.some(r => r.type === 'exclusive');
            if (hasExclusiveConflict) {
                throw new Error('Cannot book shared reservation: time slot has an exclusive booking');
            }

            // Check room capacity
            const room = sessionDb
                ? await Room.findById(roomId).session(sessionDb)
                : await Room.findById(roomId);

            if (!room) {
                throw new Error('Room not found');
            }

            // Calculate total participants including this new reservation
            const currentParticipants = overlappingReservations
                .filter(r => r.type === 'shared')
                .reduce((sum, r) => sum + (r.participantCount || 1), 0);

            const totalParticipants = currentParticipants + participantCount;

            if (totalParticipants > room.capacity) {
                throw new Error(`Room capacity exceeded. Available: ${room.capacity - currentParticipants}, Requested: ${participantCount}`);
            }
        }
    }

    // 3. Create all reservations
    const createdReservations = [];
    for (const slot of slotsToBook) {
        const reservationData = {
            ...body,
            startTime: slot.start,
            endTime: slot.end,
            // @ts-ignore
            userId: session.user.id,
            bandId: bandId || undefined
        };

        const reservation = sessionDb
            ? (await Reservation.create([reservationData], { session: sessionDb }))[0]
            : await Reservation.create(reservationData);

        createdReservations.push(reservation);
    }

    return createdReservations;
}
