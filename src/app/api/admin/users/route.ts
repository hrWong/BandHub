import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from "@/auth";

export async function GET(request: Request) {
    await dbConnect();
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

export async function PATCH(request: Request) {
    await dbConnect();
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userId, status } = await request.json();

        if (!['active', 'rejected'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
        }

        const user = await User.findByIdAndUpdate(userId, { status }, { new: true });

        return NextResponse.json({ success: true, data: user });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    await dbConnect();
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }

        // Check if user exists and is not an admin
        const userToDelete = await User.findById(userId);

        if (!userToDelete) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (userToDelete.role === 'admin') {
            return NextResponse.json({ success: false, error: 'Cannot delete admin users' }, { status: 403 });
        }

        // Delete user's reservations first
        const Reservation = (await import('@/models/Reservation')).default;
        await Reservation.deleteMany({ userId: userId });

        // Delete the user
        await User.findByIdAndDelete(userId);

        return NextResponse.json({
            success: true,
            message: `User ${userToDelete.name} and their reservations have been deleted`
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

