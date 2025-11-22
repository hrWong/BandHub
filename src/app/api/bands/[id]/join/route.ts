import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Band from '@/models/Band';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const band = await Band.findById(id);
        if (!band) {
            return NextResponse.json({ error: 'Band not found' }, { status: 404 });
        }

        if (band.status !== 'active') {
            return NextResponse.json({ error: 'Band is not active' }, { status: 400 });
        }

        // Check if already a member or pending
        const isMember = band.members.some((memberId: any) => memberId.toString() === session.user.id);
        if (isMember) {
            return NextResponse.json({ error: 'Already a member' }, { status: 400 });
        }

        const isPending = band.pendingMembers.some((memberId: any) => memberId.toString() === session.user.id);
        if (isPending) {
            return NextResponse.json({ error: 'Application already pending' }, { status: 400 });
        }

        band.pendingMembers.push(session.user.id);
        await band.save();

        return NextResponse.json({ message: 'Application submitted' });
    } catch (error) {
        console.error('Error joining band:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
