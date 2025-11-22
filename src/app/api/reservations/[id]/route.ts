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

        // Determine new values (merge body with existing)
        const newBandName = body.bandName ?? reservation.bandName;
        const newPurpose = body.purpose ?? reservation.purpose;
        const newType = body.type ?? reservation.type;
        const newParticipantCount = body.participantCount ?? reservation.participantCount;

        // Handle dates
        let newStartTime = reservation.startTime;
        let newEndTime = reservation.endTime;
        let timeChanged = false;

        if (body.startTime && body.endTime) {
            newStartTime = new Date(body.startTime);
            newEndTime = new Date(body.endTime);
            // Validate times
            if (newEndTime <= newStartTime) {
                return NextResponse.json({
                    success: false,
                    error: 'End time must be after start time'
                }, { status: 400 });
            }

            // Check duration limit (max 5 hours) for non-admins
            if (!isAdmin) {
                const durationHours = (newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60 * 60);
                if (durationHours > 5) {
                    return NextResponse.json({
                        success: false,
                        error: 'Maximum reservation duration is 5 hours'
                    }, { status: 400 });
                }
            }
            timeChanged = true;
        }

        // Check for conflicts if time, type, or participants changed
        if (timeChanged || body.type || body.participantCount) {
            const Room = (await import('@/models/Room')).default;

            // Find overlapping reservations (excluding this one)
            const query = {
                _id: { $ne: id },
                roomId: reservation.roomId,
                status: 'confirmed',
                $or: [
                    { startTime: { $lt: newEndTime, $gte: newStartTime } },
                    { endTime: { $gt: newStartTime, $lte: newEndTime } },
                    { startTime: { $lte: newStartTime }, endTime: { $gte: newEndTime } }
                ]
            };

            const overlappingReservations = await Reservation.find(query);

            if (newType === 'exclusive') {
                if (overlappingReservations.length > 0) {
                    return NextResponse.json({
                        success: false,
                        error: 'Time slot conflicts with another reservation'
                    }, { status: 409 });
                }
            } else {
                // Shared
                const hasExclusiveConflict = overlappingReservations.some(r => r.type === 'exclusive');
                if (hasExclusiveConflict) {
                    return NextResponse.json({
                        success: false,
                        error: 'Cannot update to shared: time slot has an exclusive booking'
                    }, { status: 409 });
                }

                // Check capacity
                const room = await Room.findById(reservation.roomId);
                if (!room) throw new Error('Room not found');

                const currentParticipants = overlappingReservations
                    .filter(r => r.type === 'shared')
                    .reduce((sum, r) => sum + (r.participantCount || 1), 0);

                if (currentParticipants + newParticipantCount > room.capacity) {
                    return NextResponse.json({
                        success: false,
                        error: `Room capacity exceeded. Available: ${room.capacity - currentParticipants}, Requested: ${newParticipantCount}`
                    }, { status: 409 });
                }
            }
        }

        // Apply updates
        reservation.bandName = newBandName;
        reservation.purpose = newPurpose;
        reservation.type = newType;
        reservation.participantCount = newParticipantCount;
        if (timeChanged) {
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
