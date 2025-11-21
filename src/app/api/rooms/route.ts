import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import { auth } from "@/auth";

export async function GET() {
    await dbConnect();
    try {
        const rooms = await Room.find({}).sort({ name: 1 });
        return NextResponse.json({ success: true, data: rooms });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    await dbConnect();
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const room = await Room.create(body);
        return NextResponse.json({ success: true, data: room }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
}

