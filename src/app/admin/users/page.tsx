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
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') {
                params.append('status', statusFilter);
            }

            const url = `/api/admin/users${params.toString() ? '?' + params.toString() : ''}`;
            const res = await fetch(url);
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
    }, [statusFilter]);

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

    // Filter users by search query
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchQuery === '' ||
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    {nonAdminCount > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAllNonAdmins}
                            className="w-full md:w-auto"
                        >
                            Delete All Non-Admin Users ({nonAdminCount})
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* Status Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'active', 'pending', 'rejected'].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                                className="capitalize whitespace-nowrap"
                            >
                                {status}
                            </Button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex-1 md:max-w-sm">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="space-y-4 md:hidden">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No users found
                    </div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user._id} className="rounded-lg border bg-background p-4 shadow-sm">
                            <div className="flex flex-col gap-2">
                                <div>
                                    <p className="text-lg font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground break-all">{user.email}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                    <Badge variant={
                                        user.status === 'active' ? 'default' :
                                            user.status === 'pending' ? 'secondary' : 'destructive'
                                    }>
                                        {user.status}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                        Joined {format(new Date(user.createdAt), "PP")}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {user.status === 'pending' && (
                                        <>
                                            <Button size="sm" onClick={() => handleStatusUpdate(user._id, 'active')}>
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleStatusUpdate(user._id, 'rejected')}
                                            >
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
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="hidden rounded-lg border md:block">
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
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
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
                            )))}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
