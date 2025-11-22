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
        _id: string;
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
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [roomFilter, setRoomFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [rooms, setRooms] = useState<Array<{ _id: string; name: string }>>([]);

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

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            const data = await res.json();
            if (data.success) {
                setRooms(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch rooms");
        }
    };

    useEffect(() => {
        fetchReservations();
        fetchRooms();
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

    // Filter reservations based on date and status
    const getFilteredReservations = () => {
        let filtered = [...reservations];

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(r => r.status === statusFilter);
        }

        // Room filter
        if (roomFilter !== 'all') {
            filtered = filtered.filter(r => r.roomId?._id === roomFilter);
        }

        // Date filter
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filtered = filtered.filter(r => {
                const start = new Date(r.startTime);
                return start >= today && start < tomorrow;
            });
        } else if (dateFilter === 'week') {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            filtered = filtered.filter(r => {
                const start = new Date(r.startTime);
                return start >= weekStart && start < weekEnd;
            });
        } else if (dateFilter === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            filtered = filtered.filter(r => {
                const start = new Date(r.startTime);
                return start >= monthStart && start < monthEnd;
            });
        } else if (dateFilter === 'custom' && startDate && endDate) {
            const customStart = new Date(startDate);
            const customEnd = new Date(endDate);
            customEnd.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => {
                const start = new Date(r.startTime);
                return start >= customStart && start <= customEnd;
            });
        }

        return filtered;
    };

    const filteredReservations = getFilteredReservations();

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Reservation Management</h1>
                <p className="text-muted-foreground">View and manage all reservations</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Date Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Date Range</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'all', label: 'All Time' },
                                { value: 'today', label: 'Today' },
                                { value: 'week', label: 'This Week' },
                                { value: 'month', label: 'This Month' },
                                { value: 'custom', label: 'Custom' }
                            ].map((option) => (
                                <Button
                                    key={option.value}
                                    variant={dateFilter === option.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDateFilter(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1 block">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Status</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'all', label: 'All' },
                                { value: 'confirmed', label: 'Confirmed' },
                                { value: 'cancelled', label: 'Cancelled' }
                            ].map((option) => (
                                <Button
                                    key={option.value}
                                    variant={statusFilter === option.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(option.value)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Room Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Room</label>
                        <select
                            value={roomFilter}
                            onChange={(e) => setRoomFilter(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="all">All Rooms</option>
                            {rooms.map((room) => (
                                <option key={room._id} value={room._id}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Reservations ({filteredReservations.length})</CardTitle>
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
                            {filteredReservations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                                        No reservations found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredReservations.map((reservation) => (
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
