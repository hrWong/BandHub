import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from "@/auth";

export async function DELETE() {
    const session = await auth();

    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    try {
        // Find all non-admin users first
        const nonAdminUsers = await User.find({ role: { $ne: 'admin' } });

        // Delete all non-admin users
        const result = await User.deleteMany({ role: { $ne: 'admin' } });

        return NextResponse.json({
            success: true,
            message: `Deleted ${result.deletedCount} non-admin user(s)`,
            deletedUsers: nonAdminUsers.map(u => ({ name: u.name, email: u.email }))
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
