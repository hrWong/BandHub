import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Band from '@/models/Band';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const band = await Band.findById(id)
            .populate('leader', 'name email')
            .populate('members', 'name email');

        if (!band) {
            return NextResponse.json({ error: 'Band not found' }, { status: 404 });
        }

        // Check if the requester is the leader
        const isLeader = band.leader._id.toString() === session.user.id;
        console.log(`[BandAPI] Fetching band ${id}. User: ${session.user.id}. Leader: ${band.leader._id}. IsLeader: ${isLeader}`);

        // If leader, populate pendingMembers
        if (isLeader) {
            await band.populate('pendingMembers', 'name email image');
            console.log(`[BandAPI] Populated pendingMembers: ${band.pendingMembers.length}`);
        }

        return NextResponse.json(band);

    } catch (error) {
        console.error('Error fetching band details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const { name, description } = await req.json();

        const band = await Band.findById(id);
        if (!band) {
            return NextResponse.json({ error: 'Band not found' }, { status: 404 });
        }

        if (band.leader.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        band.name = name || band.name;
        band.description = description || band.description;
        await band.save();

        return NextResponse.json(band);

    } catch (error) {
        console.error('Error updating band:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

        if (band.leader.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Band.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Band deleted successfully' });

    } catch (error) {
        console.error('Error deleting band:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
