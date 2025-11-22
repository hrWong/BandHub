import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Verify admin
        const currentUser = await User.findById(session.user.id);
        if (currentUser?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query: any = {};
        if (status) {
            query.status = status;
        }

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
