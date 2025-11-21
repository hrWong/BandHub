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
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form values when reservation changes
    useEffect(() => {
        if (reservation) {
            setBandName(reservation.bandName || "");
            setPurpose(reservation.purpose || "");
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
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
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
                                <Label htmlFor="bandName">Band Name</Label>
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
                        </>
                    ) : (
                        <>
                            <div>
                                <Label className="text-muted-foreground">Band Name</Label>
                                <p className="font-medium">{reservation.bandName}</p>
                            </div>
                            {reservation.purpose && (
                                <div>
                                    <Label className="text-muted-foreground">Purpose</Label>
                                    <p className="italic">{reservation.purpose}</p>
                                </div>
                            )}
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
