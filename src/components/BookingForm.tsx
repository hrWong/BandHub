"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Lock } from "lucide-react";

interface BookingFormProps {
    roomId: string;
    roomName: string;
}

export function BookingForm({ roomId, roomName }: BookingFormProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialDate = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();
    const initialTime = searchParams.get("time") || "10:00";

    const [date, setDate] = useState<Date | undefined>(initialDate);
    const [startTime, setStartTime] = useState(initialTime);
    const [duration, setDuration] = useState("1");
    const [bandName, setBandName] = useState(session?.user?.name || "");
    const [purpose, setPurpose] = useState("");
    const [recurringWeeks, setRecurringWeeks] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!session) {
        return (
            <Card>
                <CardContent className="pt-6 text-center space-y-4">
                    <p>You must be logged in to book a room.</p>
                    <div className="flex justify-center gap-4">
                        <Link href="/login"><Button>Login</Button></Link>
                        <Link href="/register"><Button variant="outline">Register</Button></Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !bandName) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsSubmitting(true);

        // Calculate start and end Date objects
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDateTime = new Date(date);
        startDateTime.setHours(hours, minutes, 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + parseInt(duration));

        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId,
                    bandName,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    purpose: purpose || undefined,
                    recurringWeeks: recurringWeeks > 1 ? recurringWeeks : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to book");
            }

            toast.success("Room booked successfully!");
            setBandName("");
            window.location.href = "/reservations";
            // Optional: Redirect or refresh
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        disabled={(date) => {
                            const now = new Date();
                            const today = new Date(now.setHours(0, 0, 0, 0));

                            // Disable past dates
                            if (date < today) return true;

                            // @ts-ignore
                            const isAdmin = session?.user?.role === 'admin';

                            // If not admin, disable dates more than 7 days in the future
                            if (!isAdmin) {
                                const sevenDaysFromNow = new Date(today);
                                sevenDaysFromNow.setDate(today.getDate() + 7);
                                if (date > sevenDaysFromNow) return true;
                            }

                            return false;
                        }}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bandName">Band Name</Label>
                            <Input
                                id="bandName"
                                placeholder="The Rockers"
                                value={bandName}
                                onChange={(e) => setBandName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <div className="relative">
                                    <Input
                                        id="startTime"
                                        value={startTime}
                                        readOnly
                                        className="bg-muted text-muted-foreground pr-10 cursor-not-allowed"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Hours)</Label>
                                <select
                                    id="duration"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                >
                                    <option value="1">1 Hour</option>
                                    <option value="2">2 Hours</option>
                                    <option value="3">3 Hours</option>
                                </select>
                            </div>
                        </div>

                        {/* @ts-ignore */}
                        {session?.user?.role === 'admin' && (
                            <div className="space-y-2 border-t pt-4 mt-4">
                                <Label htmlFor="recurring">Recurring Reservation (Admin Only)</Label>
                                <select
                                    id="recurring"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={recurringWeeks}
                                    onChange={(e) => setRecurringWeeks(parseInt(e.target.value))}
                                >
                                    <option value="1">Does not repeat</option>
                                    <option value="4">Repeat for 4 weeks</option>
                                    <option value="8">Repeat for 8 weeks</option>
                                    <option value="12">Repeat for 12 weeks (Semester)</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    This will book the same time slot for the selected number of weeks.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose (Optional)</Label>
                            <textarea
                                id="purpose"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="e.g., Album recording, Practice session, Live stream..."
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Booking..." : `Book ${roomName}`}
                            </Button>
                        </div>
                        {date && (
                            <p className="text-sm text-muted-foreground text-center">
                                Booking for {format(date, "PPP")} at {startTime}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
