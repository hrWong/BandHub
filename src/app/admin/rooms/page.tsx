"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Room {
    _id: string;
    name: string;
    capacity: number;
    equipment: string[];
    imageUrl?: string;
    isAvailable: boolean;
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);

    const fetchRooms = async () => {
        try {
            const res = await fetch("/api/rooms");
            const data = await res.json();
            if (data.success) {
                setRooms(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch rooms");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const roomData = {
            name: formData.get("name"),
            capacity: Number(formData.get("capacity")),
            equipment: (formData.get("equipment") as string).split(",").map(s => s.trim()),
            imageUrl: formData.get("imageUrl") as string,
            isAvailable: formData.get("isAvailable") === "on",
        };

        try {
            const url = editingRoom ? `/api/rooms/${editingRoom._id}` : "/api/rooms";
            const method = editingRoom ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(roomData),
            });

            if (res.ok) {
                toast.success(editingRoom ? "Room updated" : "Room created");
                setIsDialogOpen(false);
                setEditingRoom(null);
                fetchRooms();
            } else {
                throw new Error("Failed to save room");
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete all reservations for this room.")) return;

        try {
            const res = await fetch(`/api/rooms/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Room deleted");
                fetchRooms();
            } else {
                throw new Error("Failed to delete room");
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingRoom(null)}>
                            <Plus className="mr-2 h-4 w-4" /> Add Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Room Name</Label>
                                <Input id="name" name="name" defaultValue={editingRoom?.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacity</Label>
                                <Input id="capacity" name="capacity" type="number" defaultValue={editingRoom?.capacity} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="equipment">Equipment (comma separated)</Label>
                                <Textarea
                                    id="equipment"
                                    name="equipment"
                                    defaultValue={editingRoom?.equipment.join(", ")}
                                    placeholder="Drum kit, Guitar amp, Mic..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL</Label>
                                <Input
                                    id="imageUrl"
                                    name="imageUrl"
                                    type="url"
                                    defaultValue={editingRoom?.imageUrl}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {editingRoom?.imageUrl && (
                                    <div className="mt-2">
                                        <img
                                            src={editingRoom.imageUrl}
                                            alt={editingRoom.name}
                                            className="w-full h-32 object-cover rounded-md"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isAvailable"
                                    name="isAvailable"
                                    defaultChecked={editingRoom ? editingRoom.isAvailable : true}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="isAvailable">Available for Booking</Label>
                            </div>
                            <Button type="submit" className="w-full">Save</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Capacity</TableHead>
                            <TableHead>Equipment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rooms.map((room) => (
                            <TableRow key={room._id}>
                                <TableCell className="font-medium">{room.name}</TableCell>
                                <TableCell>{room.capacity} people</TableCell>
                                <TableCell className="max-w-md truncate">
                                    {room.equipment.join(", ")}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        }`}>
                                        {room.isAvailable ? "Available" : "Maintenance"}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => {
                                            setEditingRoom(room);
                                            setIsDialogOpen(true);
                                        }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(room._id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
