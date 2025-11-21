import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { email, status } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        user.status = status || 'active';
        await user.save();

        return NextResponse.json({
            success: true,
            message: `User ${email} activated successfully`,
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
