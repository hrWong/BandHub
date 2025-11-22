import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Band from '@/models/Band';
import User from '@/models/User';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Verify admin
        const user = await User.findById(session.user.id);
        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const bands = await Band.find(query)
            .populate('leader', 'name email')
            .populate('members', 'name email')
            .sort({ createdAt: -1 });

        return NextResponse.json(bands);
    } catch (error) {
        console.error('Error fetching pending bands:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Verify admin
        const user = await User.findById(session.user.id);
        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { bandId, action } = await req.json(); // action: 'approve' | 'reject'

        const band = await Band.findById(bandId);
        if (!band) {
            return NextResponse.json({ error: 'Band not found' }, { status: 404 });
        }

        if (action === 'approve') {
            band.status = 'active';
            await band.save();
            return NextResponse.json({ message: 'Band approved' });
        } else if (action === 'reject') {
            band.status = 'rejected';
            await band.save();
            return NextResponse.json({ message: 'Band rejected' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error managing band:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Verify admin
        const user = await User.findById(session.user.id);
        if (user?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { bandId } = await req.json();

        const band = await Band.findByIdAndDelete(bandId);
        if (!band) {
            return NextResponse.json({ error: 'Band not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Band deleted successfully' });

    } catch (error) {
        console.error('Error deleting band:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
