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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // We'll need a GET endpoint for users, for now let's mock or add it
            // Adding GET to the same route file
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleStatusUpdate = async (userId: string, status: 'active' | 'rejected') => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, status }),
            });

            if (res.ok) {
                toast.success(`User ${status}`);
                fetchUsers();
            } else {
                throw new Error("Failed to update status");
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const handleDeleteAllNonAdmins = async () => {
        if (!confirm("Are you sure you want to delete ALL non-admin users? This action cannot be undone!")) {
            return;
        }

        try {
            const res = await fetch("/api/admin/delete-non-admin-users", {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                fetchUsers();
            } else {
                throw new Error(data.error || "Failed to delete users");
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to delete ${userName}? This will also delete all their reservations. This action cannot be undone!`)) {
            return;
        }

        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                fetchUsers();
            } else {
                throw new Error(data.error || "Failed to delete user");
            }
        } catch (error) {
            toast.error((error as Error).message);
        }
    };

    if (isLoading) return <div>Loading...</div>;

    const nonAdminCount = users.filter(u => u.role !== 'admin').length;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                {nonAdminCount > 0 && (
                    <Button
                        variant="destructive"
                        onClick={handleDeleteAllNonAdmins}
                    >
                        Delete All Non-Admin Users ({nonAdminCount})
                    </Button>
                )}
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        user.status === 'active' ? 'default' :
                                            user.status === 'pending' ? 'secondary' : 'destructive'
                                    }>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{format(new Date(user.createdAt), "PP")}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {user.status === 'pending' && (
                                            <>
                                                <Button size="sm" onClick={() => handleStatusUpdate(user._id, 'active')}>
                                                    Approve
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleStatusUpdate(user._id, 'rejected')}>
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {user.role !== 'admin' && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteUser(user._id, user.name)}
                                            >
                                                Delete
                                            </Button>
                                        )}
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
