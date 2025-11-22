import dbConnect from "@/lib/db";
import Room from "@/models/Room";
import Reservation from "@/models/Reservation";
import { ScheduleGrid } from "@/components/ScheduleGrid";
import { format } from "date-fns";

async function getData(dateStr?: string) {
  await dbConnect();

  const date = dateStr ? new Date(dateStr) : new Date();
  // Set to start of day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const rooms = await Room.find({}).sort({ name: 1 }).lean();

  const reservations = await Reservation.find({
    startTime: { $gte: startOfDay, $lte: endOfDay },
    status: 'confirmed'
  }).populate('roomId').populate('userId', 'name role').lean();

  return {
    rooms: JSON.parse(JSON.stringify(rooms)),
    reservations: JSON.parse(JSON.stringify(reservations)),
    currentDate: date
  };
}

import { auth } from "@/auth";

// ... imports ...

// ... getData function ...

export default async function Home({ searchParams }: { searchParams: { date?: string } }) {
  const session = await auth();
  // Await searchParams before accessing its properties
  const resolvedSearchParams = await searchParams;
  const { rooms, reservations, currentDate } = await getData(resolvedSearchParams?.date);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">BandHub Schedule</h1>
        <p className="text-muted-foreground">
          View availability for all rooms on {format(currentDate, "PPPP")}
        </p>
      </div>

      <ScheduleGrid
        rooms={rooms}
        reservations={reservations}
        date={currentDate}
        // @ts-ignore
        currentUserId={session?.user?.id}
      />
    </div>
  );
}
