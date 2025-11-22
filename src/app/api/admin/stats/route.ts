import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Room from "@/models/Room";
import Reservation from "@/models/Reservation";
import Band from "@/models/Band";

export async function GET() {
    await dbConnect();
    const userCount = await User.countDocuments();
    const pendingUsers = await User.countDocuments({ status: "pending" });
    const roomCount = await Room.countDocuments();
    const reservationCount = await Reservation.countDocuments();
    const bandCount = await Band.countDocuments();
    const pendingBands = await Band.countDocuments({ status: "pending" });

    return NextResponse.json({
        success: true,
        data: { userCount, pendingUsers, roomCount, reservationCount, bandCount, pendingBands },
    });
}
