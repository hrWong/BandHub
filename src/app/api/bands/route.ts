import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Band from '@/models/Band';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { name, description } = await req.json();

        // Check if band name already exists
        const existingBand = await Band.findOne({ name });
        if (existingBand) {
            return NextResponse.json({ error: 'Band name already exists' }, { status: 400 });
        }

        const band = await Band.create({
            name,
            description,
            leader: session.user.id,
            members: [session.user.id], // Leader is automatically a member
            status: 'pending', // Requires admin approval
        });

        return NextResponse.json(band, { status: 201 });
    } catch (error) {
        console.error('Error creating band:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let query: any = {};

        if (userId) {
            // Find bands where user is a member or leader
            query = {
                $or: [
                    { members: userId },
                    { leader: userId }
                ]
            };
        }

        if (status) {
            query.status = status;
        } else if (!userId) {
            // If listing all bands (e.g. for directory), only show active ones unless admin
            // For now, let's just return active bands for general list
            query.status = 'active';
        }

        const bands = await Band.find(query)
            .populate('leader', 'name email')
            .populate('members', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(bands);
    } catch (error) {
        console.error('Error fetching bands:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
