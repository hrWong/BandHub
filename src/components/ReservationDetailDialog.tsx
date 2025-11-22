"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReservationDetailDialogProps {
    reservation: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    canEdit: boolean;
}

export function ReservationDetailDialog({
    reservation,
    isOpen,
    onClose,
    onUpdate,
    canEdit
}: ReservationDetailDialogProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [bandName, setBandName] = useState(reservation?.bandName || "");
    const [purpose, setPurpose] = useState(reservation?.purpose || "");
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [reservationType, setReservationType] = useState<'exclusive' | 'shared'>(reservation?.type || 'exclusive');
    const [participantCount, setParticipantCount] = useState(reservation?.participantCount || 1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form values when reservation changes
    useEffect(() => {
        if (reservation) {
            setBandName(reservation.bandName || "");
            setPurpose(reservation.purpose || "");
            setReservationType(reservation.type || 'exclusive');
            setParticipantCount(reservation.participantCount || 1);
            const start = new Date(reservation.startTime);
            const end = new Date(reservation.endTime);
            setStartDate(format(start, "yyyy-MM-dd"));
            setStartTime(format(start, "HH:mm"));
            setEndTime(format(end, "HH:mm"));
        }
    }, [reservation]); // Dependency array ensures this runs when reservation prop changes

    if (!reservation) return null;

    const isPastReservation = new Date(reservation.endTime) < new Date();

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            // Combine date and time
            const newStartTime = new Date(`${startDate}T${startTime}`);
            const newEndTime = new Date(`${startDate}T${endTime}`);

            // Validate
            if (newEndTime <= newStartTime) {
                throw new Error("End time must be after start time");
            }

            const res = await fetch(`/api/reservations/${reservation._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bandName,
                    purpose,
                    startTime: newStartTime.toISOString(),
                    endTime: newEndTime.toISOString(),
                    type: reservationType,
                    participantCount: reservationType === 'shared' ? participantCount : 1,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update");
            }

            toast.success("Reservation updated");
            setIsEditing(false);
            onUpdate();
            onClose();
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this reservation?")) return;

        try {
            const res = await fetch(`/api/reservations/${reservation._id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to cancel");
            }

            toast.success("Reservation cancelled");
            onUpdate();
            onClose();
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const roomName = typeof reservation.roomId === 'object'
        ? reservation.roomId?.name
        : reservation.roomId;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reservation Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label className="text-muted-foreground">Room</Label>
                        <p className="font-medium">{roomName || "Unknown"}</p>
                    </div>

                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        disabled
                                        className="bg-muted"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="duration">Duration</Label>
                                    <select
                                        id="duration"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={(() => {
                                            const start = new Date(`2000-01-01T${startTime}`);
                                            const end = new Date(`2000-01-01T${endTime}`);
                                            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                            return Math.round(diffHours).toString();
                                        })()}
                                        onChange={(e) => {
                                            const duration = parseInt(e.target.value);
                                            const start = new Date(`2000-01-01T${startTime}`);
                                            const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
                                            setEndTime(format(end, "HH:mm"));
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5].map((hours) => (
                                            <option key={hours} value={hours}>
                                                {hours} hour{hours > 1 ? 's' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>
                            <Label className="text-muted-foreground">Date & Time</Label>
                            <p className="font-medium">
                                {format(new Date(reservation.startTime), "PPP")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(reservation.startTime), "p")} - {format(new Date(reservation.endTime), "p")}
                            </p>
                        </div>
                    )}

                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="bandName">
                                    {reservation.bandId ? "Band Name" : "Reservation Name"}
                                </Label>
                                <Input
                                    id="bandName"
                                    value={bandName}
                                    onChange={(e) => setBandName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="purpose">Purpose</Label>
                                <Textarea
                                    id="purpose"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Optional"
                                />
                            </div>

                            {/* Reservation Type */}
                            <div className="space-y-2">
                                <Label>Reservation Type</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reservationType"
                                            value="exclusive"
                                            checked={reservationType === 'exclusive'}
                                            onChange={(e) => setReservationType('exclusive')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Exclusive Booking</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="reservationType"
                                            value="shared"
                                            checked={reservationType === 'shared'}
                                            onChange={(e) => setReservationType('shared')}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Shared Practice</span>
                                    </label>
                                </div>
                            </div>

                            {/* Participant Count (only for shared) */}
                            {reservationType === 'shared' && (
                                <div className="space-y-2">
                                    <Label htmlFor="participantCount">Number of Participants</Label>
                                    <Input
                                        id="participantCount"
                                        type="number"
                                        min="1"
                                        value={participantCount}
                                        onChange={(e) => setParticipantCount(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div>
                                <Label className="text-muted-foreground">
                                    {reservation.bandId ? "Band Name" : "Reservation Name"}
                                </Label>
                                <p className="font-medium">
                                    {reservation.bandName}
                                    {/* @ts-ignore */}
                                    {reservation.userId?.name && <span className="text-sm font-normal text-muted-foreground ml-2">(Booked by: {reservation.userId.name})</span>}
                                </p>
                            </div>
                            {reservation.purpose && (
                                <div>
                                    <Label className="text-muted-foreground">Purpose</Label>
                                    <p className="italic">{reservation.purpose}</p>
                                </div>
                            )}

                            {/* Display Reservation Type */}
                            <div>
                                <Label className="text-muted-foreground">Reservation Type</Label>
                                <p className="font-medium capitalize">
                                    {reservation.type || 'exclusive'}
                                    {reservation.type === 'shared' && reservation.participantCount && (
                                        <span className="text-sm font-normal text-muted-foreground ml-2">
                                            ({reservation.participantCount} participants)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </>
                    )}

                    <div className="flex gap-2 pt-4">
                        {canEdit && !isPastReservation && (
                            <>
                                {isEditing ? (
                                    <>
                                        <Button onClick={handleSave} disabled={isSubmitting}>
                                            {isSubmitting ? "Saving..." : "Save"}
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button onClick={() => setIsEditing(true)}>
                                            Edit
                                        </Button>
                                        <Button variant="destructive" onClick={handleCancel}>
                                            Cancel Reservation
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                        {isPastReservation && (
                            <div className="w-full text-center text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                                This reservation has ended and cannot be modified.
                            </div>
                        )}
                        {!canEdit && !isPastReservation && (
                            <Button variant="outline" onClick={onClose} className="w-full">
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
