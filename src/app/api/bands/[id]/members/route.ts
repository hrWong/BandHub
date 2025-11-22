import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Band from '@/models/Band';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const { userId, action } = await req.json(); // action: 'approve' | 'reject'

        const band = await Band.findById(id);
        if (!band) {
            return NextResponse.json({ error: 'Band not found' }, { status: 404 });
        }

        // Only leader can approve/reject/remove members. 
        // 'leave' action can be called by any member.
        if (action !== 'leave' && band.leader.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (action === 'approve') {
            if (!band.pendingMembers.includes(userId)) {
                return NextResponse.json({ error: 'User not in pending list' }, { status: 400 });
            }

            // Remove from pending, add to members
            band.pendingMembers = band.pendingMembers.filter((id: any) => id.toString() !== userId);
            band.members.push(userId);
            await band.save();
            return NextResponse.json({ message: 'Member approved' });

        } else if (action === 'reject') {
            if (!band.pendingMembers.includes(userId)) {
                return NextResponse.json({ error: 'User not in pending list' }, { status: 400 });
            }

            // Remove from pending
            band.pendingMembers = band.pendingMembers.filter((id: any) => id.toString() !== userId);
            await band.save();
            return NextResponse.json({ message: 'Member rejected' });

        } else if (action === 'remove') {
            // Leader removing a member
            if (band.leader.toString() !== session.user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (userId === band.leader.toString()) {
                return NextResponse.json({ error: 'Cannot remove leader' }, { status: 400 });
            }

            band.members = band.members.filter((id: any) => id.toString() !== userId);
            await band.save();
            return NextResponse.json({ message: 'Member removed' });

        } else if (action === 'leave') {
            // Member leaving
            if (band.leader.toString() === session.user.id) {
                return NextResponse.json({ error: 'Leader cannot leave band. Delete band instead.' }, { status: 400 });
            }

            // Check if user is actually a member
            const isMember = band.members.some((id: any) => id.toString() === session.user.id);
            if (!isMember) {
                return NextResponse.json({ error: 'Not a member' }, { status: 400 });
            }

            band.members = band.members.filter((id: any) => id.toString() !== session.user.id);
            await band.save();
            return NextResponse.json({ message: 'Left band successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error managing members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
