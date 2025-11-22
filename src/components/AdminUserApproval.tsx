'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface User {
    _id: string;
    name: string;
    email: string;
    status: 'pending' | 'active' | 'rejected';
}

export default function AdminUserApproval() {
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const res = await fetch('/api/admin/users?status=pending');
            if (res.ok) {
                const data = await res.json();
                console.log('Fetched pending users:', data);
                // Handle both formats: direct array or { success, data }
                const usersArray = Array.isArray(data) ? data : (data.success ? data.data : []);
                setPendingUsers(usersArray);
            } else {
                const errorData = await res.json();
                console.error('Failed to fetch pending users:', res.status, errorData);
            }
        } catch (error) {
            console.error('Error fetching pending users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: string, status: 'active' | 'rejected') => {
        try {
            const res = await fetch('/api/activate-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status }),
            });

            if (res.ok) {
                toast.success(`User ${status === 'active' ? 'activated' : 'rejected'} successfully`);
                fetchPendingUsers();
            } else {
                const data = await res.json();
                toast.error(data.error || `Failed to update user`);
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    if (loading) return <div>Loading pending users...</div>;

    if (pendingUsers.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Pending User Approvals</h2>
                <Card className="p-6 text-center text-muted-foreground">
                    No pending users.
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending User Approvals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {pendingUsers.map((user) => (
                    <Card key={user._id} className="p-0 gap-0">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="truncate text-lg">{user.name}</CardTitle>
                            <CardDescription className="truncate">{user.email}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-4 pt-2 flex gap-2">
                            <Button
                                onClick={() => handleAction(user._id, 'active')}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                size="sm"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleAction(user._id, 'rejected')}
                                className="flex-1"
                                size="sm"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
