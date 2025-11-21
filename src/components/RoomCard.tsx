import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Music, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { IRoom } from "@/models/Room";
import { format } from "date-fns";

interface RoomCardProps {
    room: IRoom;
    currentReservation?: {
        bandName: string;
        endTime: string;
    } | null;
}

export function RoomCard({ room, currentReservation }: RoomCardProps) {
    return (
        <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col">
            <div className="h-48 w-full bg-muted/50 flex items-center justify-center relative">
                {/* Placeholder for room image */}
                <Music className="h-16 w-16 text-muted-foreground/50" />
                {currentReservation ? (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4 text-center backdrop-blur-sm">
                        <Clock className="h-8 w-8 mb-2 text-red-400" />
                        <p className="font-bold text-lg">Booked</p>
                        <p className="text-sm opacity-90">by {currentReservation.bandName}</p>
                        <p className="text-xs mt-1 opacity-75">until {format(new Date(currentReservation.endTime), "p")}</p>
                    </div>
                ) : (
                    room.isAvailable && (
                        <div className="absolute top-4 right-4">
                            <Badge className="bg-green-500 hover:bg-green-600">Available Now</Badge>
                        </div>
                    )
                )}
            </div>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{room.name}</CardTitle>
                    <Badge variant={room.isAvailable ? "default" : "secondary"}>
                        {room.isAvailable ? "Available" : "Maintenance"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        Capacity: {room.capacity} people
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Music className="mr-2 h-4 w-4" />
                        Equipment: {room.equipment.join(", ")}
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Link href={`/rooms/${room._id}`} className="w-full">
                    <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        Book Now
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
