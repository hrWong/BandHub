import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { auth } from '@/auth';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Verify admin role
        // @ts-ignore
        if (session.user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { userId, status } = await request.json();

        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
        }

        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        user.status = status || 'active';
        await user.save();

        return NextResponse.json({
            success: true,
            message: `User ${user.email} ${status === 'active' ? 'activated' : 'rejected'} successfully`,
            user: {
                name: user.name,
                email: user.email,
                status: user.status
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
