import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Band from '@/models/Band';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const userId = session.user.id;

        // Fetch all bands where user is involved
        const bands = await Band.find({
            $or: [
                { leader: userId },
                { members: userId },
                { pendingMembers: userId }
            ]
        })
            .populate('leader', 'name email')
            .sort({ createdAt: -1 });

        const leading: any[] = [];
        const member: any[] = [];
        const pending: any[] = [];

        bands.forEach(band => {
            if (band.leader._id.toString() === userId) {
                leading.push(band);
            } else if (band.members.includes(userId)) {
                member.push(band);
            } else if (band.pendingMembers.some((id: any) => id.toString() === userId)) {
                pending.push(band);
            }
        });

        return NextResponse.json({
            leading,
            member,
            pending
        });

    } catch (error) {
        console.error('Error fetching user bands:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
