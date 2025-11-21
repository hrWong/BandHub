import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        if (user.role === 'admin') {
            return NextResponse.json({ success: false, error: 'Cannot delete admin user' }, { status: 403 });
        }

        await User.deleteOne({ email });

        return NextResponse.json({
            success: true,
            message: `User ${email} deleted successfully`
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
