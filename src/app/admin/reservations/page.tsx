"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface Reservation {
    _id: string;
    roomId: {
        name: string;
    };
    userId: {
        name: string;
        email: string;
    };
    bandName: string;
    startTime: string;
    endTime: string;
    purpose?: string;
    status: string;
}

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const fetchReservations = async () => {
        try {
            const res = await fetch("/api/admin/reservations");
            const data = await res.json();
            if (data.success) {
                setReservations(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch reservations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this reservation?")) return;

        setCancellingId(id);
        try {
            const res = await fetch(`/api/reservations/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to cancel");
            }

            toast.success("Reservation cancelled");
            fetchReservations();
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setCancellingId(null);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Reservation Management</h1>
                <p className="text-muted-foreground">View and manage all reservations</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Reservations ({reservations.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room</TableHead>
                                <TableHead>Band</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Purpose</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reservations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No reservations found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reservations.map((reservation) => (
                                    <TableRow key={reservation._id}>
                                        <TableCell className="font-medium">
                                            {reservation.roomId?.name || "Unknown"}
                                        </TableCell>
                                        <TableCell>{reservation.bandName}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{reservation.userId?.name}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {reservation.userId?.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{format(new Date(reservation.startTime), "PPP")}</div>
                                                <div className="text-muted-foreground">
                                                    {format(new Date(reservation.startTime), "p")} -{" "}
                                                    {format(new Date(reservation.endTime), "p")}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {reservation.purpose ? (
                                                <span className="text-sm italic">{reservation.purpose}</span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    reservation.status === "confirmed" ? "default" : "destructive"
                                                }
                                            >
                                                {reservation.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {reservation.status === "confirmed" && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancel(reservation._id)}
                                                    disabled={cancellingId === reservation._id}
                                                >
                                                    {cancellingId === reservation._id ? "Cancelling..." : "Cancel"}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
