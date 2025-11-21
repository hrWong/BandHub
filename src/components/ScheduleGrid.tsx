"use client";

import { useState, Fragment, useEffect } from "react";
import { IRoom } from "@/models/Room";
import { IReservation } from "@/models/Reservation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ReservationDetailDialog } from "@/components/ReservationDetailDialog";

interface ScheduleGridProps {
    rooms: IRoom[];
    reservations: IReservation[];
    date: Date;
    currentUserId?: string;
    onUpdate?: () => void;
}

export function ScheduleGrid({ rooms, reservations, date, currentUserId, onUpdate }: ScheduleGridProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(date));
    const [selectedReservation, setSelectedReservation] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [hoveredReservationId, setHoveredReservationId] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?._id ? String(rooms[0]._id) : "");
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Get the selected room
    const selectedRoom = rooms.find(r => String(r._id) === selectedRoomId);

    // Hours to display (e.g., 9 AM to 10 PM)
    const startHour = 9;
    const endHour = 22;
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            router.push(`/?date=${format(date, "yyyy-MM-dd")}`);
        }
    };

    const handlePrevDay = () => {
        const newDate = addDays(selectedDate, -1);
        handleDateSelect(newDate);
    };

    const handleNextDay = () => {
        const newDate = addDays(selectedDate, 1);
        handleDateSelect(newDate);
    };

    // Helper to check if a slot is booked
    const getReservation = (roomId: string, hour: number) => {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(hour, 0, 0, 0);

        return reservations.find(r => {
            const rStart = new Date(r.startTime);
            const rEnd = new Date(r.endTime);
            // Handle both populated object and string ID
            // @ts-ignore
            const reservationRoomId = typeof r.roomId === 'object' ? r.roomId._id : r.roomId;
            return String(reservationRoomId) === String(roomId) &&
                rStart.getTime() <= slotStart.getTime() &&
                rEnd.getTime() > slotStart.getTime();
        });
    };

    return (
        <div className="space-y-6">
            {/* Date Controls */}
                <div className="flex items-center gap-3 overflow-x-auto rounded-lg bg-muted/30 p-4 md:justify-between">
                    <Button variant="outline" size="icon" onClick={handlePrevDay} className="flex-shrink-0">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {isMounted ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className={cn("flex-1 min-w-[180px] justify-center text-left font-medium md:w-[240px]")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    <span className="sm:hidden">{format(selectedDate, "MMM d")}</span>
                                    <span className="hidden sm:inline">{format(selectedDate, "PPP")}</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    ) : (
                        <Button variant="outline" className={cn("flex-1 min-w-[180px] justify-center text-left font-medium md:w-[240px]")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="sm:hidden">{format(selectedDate, "MMM d")}</span>
                            <span className="hidden sm:inline">{format(selectedDate, "PPP")}</span>
                        </Button>
                    )}

                    <Button variant="outline" size="icon" onClick={handleNextDay} className="flex-shrink-0">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

            {/* Room Tabs */}
            <div className="border rounded-lg p-2 bg-muted/30">
                <div className="flex gap-2 overflow-x-auto">
                    {rooms.map(room => (
                        <Button
                            key={String(room._id)}
                            variant={selectedRoomId === String(room._id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedRoomId(String(room._id))}
                            className="whitespace-nowrap"
                        >
                            {room.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Selected Room Info */}
            {selectedRoom && (
                <div className="border rounded-lg p-4 bg-card">
                    <h2 className="text-xl font-semibold mb-2">{selectedRoom.name}</h2>
                    {selectedRoom.capacity && (
                        <p className="text-sm text-muted-foreground">Capacity: {selectedRoom.capacity} people</p>
                    )}
                </div>
            )}

            {/* Time Schedule - Responsive Layout */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-4 border-b">
                    <h3 className="font-medium">Schedule for {format(selectedDate, "PPPP")}</h3>
                </div>

                {/* Mobile: Timeline List */}
                <div className="md:hidden bg-muted/5">
                    {hours.map((hour, index) => {
                        const reservation = selectedRoom ? getReservation(String(selectedRoom._id), hour) : null;
                        const isStartOfReservation = reservation && new Date(reservation.startTime).getHours() === hour;

                        // @ts-ignore
                        const isMyReservation = reservation && currentUserId && reservation.userId === currentUserId;
                        const isPastReservation = reservation && new Date(reservation.endTime) < new Date();
                        const reservationId = reservation?._id?.toString();
                        const isHovered = hoveredReservationId === reservationId;

                        // Calculate duration for mobile view
                        const reservationStart = reservation ? new Date(reservation.startTime).getHours() : 0;
                        const reservationEnd = reservation ? new Date(reservation.endTime).getHours() : 0;
                        const duration = reservation ? reservationEnd - reservationStart : 0;

                        // Only show start of multi-hour reservation
                        if (reservation && !isStartOfReservation) {
                            return null;
                        }

                        // Check status for empty slots
                        const slotTime = new Date(selectedDate);
                        slotTime.setHours(hour, 0, 0, 0);
                        const isPast = slotTime < new Date();

                        // @ts-ignore
                        const isAdmin = session?.user?.role === 'admin';
                        const sevenDaysFromNow = new Date();
                        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                        sevenDaysFromNow.setHours(23, 59, 59, 999);
                        const isTooFarAhead = !isAdmin && slotTime > sevenDaysFromNow;

                        return (
                            <div
                                key={hour}
                                className="relative pl-16 py-2 pr-4 min-h-[80px]"
                            >
                                {/* Timeline Line */}
                                <div className="absolute left-[3.75rem] top-0 bottom-0 w-px bg-border/50" />

                                {/* Time Indicator */}
                                <div className="absolute left-2 top-3 text-xs font-medium text-muted-foreground w-10 text-right">
                                    {format(new Date().setHours(hour, 0, 0, 0), "h:00")}
                                    <span className="text-[10px] text-muted-foreground/60 ml-0.5">
                                        {format(new Date().setHours(hour, 0, 0, 0), "a")}
                                    </span>
                                </div>

                                {/* Timeline Dot */}
                                <div className={cn(
                                    "absolute left-[3.55rem] top-4 w-2.5 h-2.5 rounded-full border-2 z-10",
                                    reservation
                                        ? (isMyReservation ? "bg-blue-600 border-blue-600" : "bg-primary border-primary")
                                        : (selectedRoom?.isAvailable && !isPast && !isTooFarAhead
                                            ? "bg-background border-primary/50"
                                            : "bg-muted border-muted-foreground/30")
                                )} />

                                {/* Content Card */}
                                <div className="ml-2">
                                    {reservation ? (
                                        <div
                                            className={cn(
                                                "rounded-xl border px-4 py-3 shadow-sm transition-all active:scale-[0.98] flex flex-col gap-2",
                                                isPastReservation
                                                    ? "bg-gray-100 dark:bg-gray-900/40 border-gray-300 dark:border-gray-700 opacity-70"
                                                    : isMyReservation
                                                        ? "bg-blue-50 border-blue-600 dark:bg-blue-950/40 dark:border-blue-800"
                                                        : "bg-card border-primary/40"
                                            )}
                                            onClick={() => {
                                                setSelectedReservation(reservation);
                                                setIsDialogOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <span className="font-semibold text-foreground">
                                                    Reserved
                                                </span>
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                    {duration}h
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm text-balance">
                                                    {reservation.bandName ?? "Band"}
                                                </span>
                                                {isMyReservation && (
                                                    <span className="text-[10px] rounded-full bg-blue-600 text-white px-2 py-0.5">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                                                <span>{format(new Date(reservation.startTime), "EEE, MMM d")}</span>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                <span>
                                                    {format(new Date(reservation.startTime), "h:mm a")} – {format(new Date(reservation.endTime), "h:mm a")}
                                                </span>
                                            </div>
                                            {/* @ts-ignore */}
                                            {reservation.purpose && (
                                                <p className="text-xs text-muted-foreground/90 leading-tight italic border-l-2 border-primary/30 pl-2">
                                                    {reservation.purpose}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        selectedRoom?.isAvailable ? (
                                            isPast ? (
                                                <div className="h-full flex items-center">
                                                    <span className="text-xs text-muted-foreground/40 font-medium px-3 py-1.5 rounded-full bg-muted/30 border border-transparent">
                                                        Expired
                                                    </span>
                                                </div>
                                            ) : isTooFarAhead ? (
                                                <div className="h-full flex items-center">
                                                    <span className="text-xs text-muted-foreground/40 font-medium px-3 py-1.5 rounded-full bg-muted/30 border border-transparent flex items-center gap-1.5">
                                                        Locked
                                                    </span>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start h-auto py-3 px-4 border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 bg-transparent"
                                                    onClick={() => {
                                                        router.push(`/rooms/${String(selectedRoom?._id)}?date=${format(selectedDate, "yyyy-MM-dd")}&time=${hour}:00`);
                                                    }}
                                                >
                                                    <span className="text-sm font-medium">Book Slot</span>
                                                </Button>
                                            )
                                        ) : (
                                            <div className="h-full flex items-center">
                                                <span className="text-xs text-destructive/60 font-medium px-3 py-1.5 rounded-full bg-destructive/5 border border-destructive/10">
                                                    Maintenance
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* PC: Professional Timeline View (CSS Grid) */}
                <div className="hidden md:grid grid-cols-[100px_1fr] gap-x-6 gap-y-0 p-6 bg-background/50">
                    {hours.map((hour, index) => {
                        const reservation = selectedRoom ? getReservation(String(selectedRoom._id), hour) : null;
                        const isStartOfReservation = reservation && new Date(reservation.startTime).getHours() === hour;

                        // @ts-ignore
                        const isMyReservation = reservation && currentUserId && reservation.userId === currentUserId;
                        const isPastReservation = reservation && new Date(reservation.endTime) < new Date();
                        const reservationId = reservation?._id?.toString();
                        const isHovered = hoveredReservationId === reservationId;

                        // Calculate duration
                        const reservationStart = reservation ? new Date(reservation.startTime).getHours() : 0;
                        const reservationEnd = reservation ? new Date(reservation.endTime).getHours() : 0;
                        const duration = reservation ? reservationEnd - reservationStart : 0;

                        // Check if slot is in the past
                        const slotTime = new Date(selectedDate);
                        slotTime.setHours(hour, 0, 0, 0);
                        const isPast = slotTime < new Date();

                        // Check if slot is too far in the future (7 days) for non-admins
                        // @ts-ignore
                        const isAdmin = session?.user?.role === 'admin';
                        const sevenDaysFromNow = new Date();
                        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                        sevenDaysFromNow.setHours(23, 59, 59, 999);
                        const isTooFarAhead = !isAdmin && slotTime > sevenDaysFromNow;

                        // Determine grid row placement
                        // Grid rows are 1-indexed. Each hour is one row.
                        const currentRow = index + 1;

                        return (
                            <Fragment key={hour}>
                                {/* Time Label - Always render for every hour */}
                                <div
                                    className="text-right pt-4 pr-4 border-r border-border/50 h-24"
                                    style={{ gridRow: currentRow, gridColumn: 1 }}
                                    key={`time-${hour}`}
                                >
                                    <div className="text-2xl font-bold text-foreground/80">
                                        {format(new Date().setHours(hour, 0, 0, 0), "h")}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">
                                            {format(new Date().setHours(hour, 0, 0, 0), "a")}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Slot */}
                                {reservation ? (
                                    // If it's the start of a reservation, render the card spanning multiple rows
                                    isStartOfReservation ? (
                                        <div
                                            key={`res-${hour}`}
                                            className="py-1 pl-2 relative z-10"
                                            style={{
                                                gridRow: `${currentRow} / span ${duration}`,
                                                gridColumn: 2
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    "w-full h-full rounded-xl p-5 cursor-pointer transition-all shadow-sm hover:shadow-md border-l-[6px]",
                                                    isPastReservation
                                                        ? "bg-gray-100 border-gray-400 dark:bg-gray-900/30 opacity-60"
                                                        : isMyReservation
                                                            ? "bg-blue-50 border-blue-600 dark:bg-blue-950/40"
                                                            : "bg-card border-primary",
                                                    isHovered && "scale-[1.01] shadow-lg ring-1 ring-primary/20"
                                                )}
                                                onMouseEnter={() => reservation && reservationId && setHoveredReservationId(reservationId)}
                                                onMouseLeave={() => setHoveredReservationId(null)}
                                                onClick={() => {
                                                    setSelectedReservation(reservation);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <div className="flex justify-between items-start h-full">
                                                    <div className="flex flex-col justify-center h-full">
                                                        <h4 className={cn(
                                                            "text-xl font-bold mb-2",
                                                            isPastReservation
                                                                ? "text-gray-600 dark:text-gray-400"
                                                                : isMyReservation
                                                                    ? "text-blue-700 dark:text-blue-400"
                                                                    : "text-foreground"
                                                        )}>
                                                            {reservation.bandName}
                                                            {isMyReservation && <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300 align-middle">You</span>}
                                                        </h4>
                                                        <div className="flex items-center text-sm text-muted-foreground space-x-6">
                                                            <span className="flex items-center bg-background/50 px-2 py-1 rounded">
                                                                <CalendarIcon className="w-4 h-4 mr-2" />
                                                                {format(new Date(reservation.startTime), "h:mm a")} - {format(new Date(reservation.endTime), "h:mm a")}
                                                                <span className="ml-2 font-medium text-foreground/70">({duration}h)</span>
                                                            </span>
                                                            {reservation.purpose && (
                                                                <span className="flex items-center italic opacity-90 border-l-2 border-primary/30 pl-3 text-foreground/80 font-medium">
                                                                    "{reservation.purpose}"
                                                                </span>
                                                            )}
                                                        </div>

                                                    </div>
                                                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null // Don't render anything for continuation hours in the content column
                                ) : (

                                    // Empty slot - Render for every available hour
                                    <div
                                        key={`empty-${hour}`}
                                        className="py-1 pl-2"
                                        style={{ gridRow: currentRow, gridColumn: 2 }}
                                    >
                                        <div
                                            className={cn(
                                                "h-full border-2 border-dashed rounded-xl flex items-center justify-between px-8 transition-all group/slot",
                                                selectedRoom?.isAvailable && !isPast && !isTooFarAhead
                                                    ? "border-muted/60 hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
                                                    : "border-muted/30 bg-muted/10 cursor-not-allowed"
                                            )}
                                            onClick={() => {
                                                if (selectedRoom?.isAvailable && !isPast && !isTooFarAhead) {
                                                    router.push(`/rooms/${String(selectedRoom?._id)}?date=${format(selectedDate, "yyyy-MM-dd")}&time=${hour}:00`);
                                                }
                                            }}
                                        >
                                            <span className={cn(
                                                "font-medium transition-colors",
                                                selectedRoom?.isAvailable && !isPast && !isTooFarAhead
                                                    ? "text-muted-foreground/60 group-hover/slot:text-foreground"
                                                    : "text-muted-foreground/40"
                                            )}>
                                                {selectedRoom?.isAvailable
                                                    ? (isPast ? "Past" : (isTooFarAhead ? "Locked" : "Available"))
                                                    : "Maintenance"}
                                            </span>
                                            {selectedRoom?.isAvailable && !isPast && !isTooFarAhead ? (
                                                <Button className="opacity-0 group-hover/slot:opacity-100 transition-opacity" variant="secondary">
                                                    Book Now
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" disabled className="text-muted-foreground/40 opacity-50">
                                                    {selectedRoom?.isAvailable ? (isPast ? "Expired" : (isTooFarAhead ? "Locked" : "Unavailable")) : "Unavailable"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Fragment>
                        );
                    })}
                </div>
            </div>

            <ReservationDetailDialog
                reservation={selectedReservation}
                isOpen={isDialogOpen}
                onClose={() => {
                    setIsDialogOpen(false);
                    setSelectedReservation(null);
                }}
                onUpdate={() => {
                    onUpdate?.();
                    router.refresh();
                }}
                canEdit={selectedReservation && currentUserId && (
                    // @ts-ignore
                    selectedReservation.userId === currentUserId
                )}
            />
        </div >
    );
}
