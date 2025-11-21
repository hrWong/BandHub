import { RoomCard } from "@/components/RoomCard";
import dbConnect from "@/lib/db";
import Room from "@/models/Room";

async function getRooms() {
    await dbConnect();
    const rooms = await Room.find({}).lean();
    return JSON.parse(JSON.stringify(rooms));
}

export default async function RoomsPage() {
    const rooms = await getRooms();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight">All Rehearsal Rooms</h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.length > 0 ? (
                    rooms.map((room: any) => (
                        <RoomCard key={room._id} room={room} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">No rooms found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
