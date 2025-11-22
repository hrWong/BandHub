'use client';

import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface Band {
    _id: string;
    name: string;
    description: string;
    leader: { name: string; email: string };
    status: 'pending' | 'active' | 'rejected';
    createdAt: string;
}

export default function BandManagementTable() {
    const [bands, setBands] = useState<Band[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchBands();
    }, [filter]);

    const fetchBands = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/bands?status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setBands(data);
            }
        } catch (error) {
            console.error('Error fetching bands:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bandId: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch('/api/admin/bands', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bandId, action }),
            });

            if (res.ok) {
                toast.success(`Band ${action}d successfully`);
                fetchBands();
            } else {
                toast.error(`Failed to ${action} band`);
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const [selectedBand, setSelectedBand] = useState<Band | null>(null);
    const [showMembers, setShowMembers] = useState(false);

    const handleDelete = async (bandId: string) => {
        if (!confirm('Are you sure you want to delete this band?')) return;
        try {
            const res = await fetch('/api/admin/bands', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bandId }),
            });

            if (res.ok) {
                toast.success('Band deleted successfully');
                fetchBands();
            } else {
                toast.error('Failed to delete band');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex space-x-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={filter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setFilter('pending')}
                >
                    Pending
                </Button>
                <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilter('active')}
                >
                    Active
                </Button>
                <Button
                    variant={filter === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setFilter('rejected')}
                >
                    Rejected
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Leader</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : bands.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No bands found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bands.map((band) => (
                                <TableRow key={band._id}>
                                    <TableCell className="font-medium">{band.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{band.leader.name}</span>
                                            <span className="text-xs text-muted-foreground">{band.leader.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            band.status === 'active' ? 'default' :
                                                band.status === 'pending' ? 'secondary' : 'destructive'
                                        }>
                                            {band.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(band.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {band.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(band._id, 'approve')}
                                                >
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleAction(band._id, 'reject')}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {band.status === 'rejected' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleAction(band._id, 'approve')}
                                                >
                                                    Re-Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(band._id)}
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                        {band.status === 'active' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedBand(band);
                                                        setShowMembers(true);
                                                    }}
                                                >
                                                    Members
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(band._id)}
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedBand && (
                <Dialog open={showMembers} onOpenChange={setShowMembers}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Members of {selectedBand.name}</DialogTitle>
                            <DialogDescription>
                                Leader: {selectedBand.leader.name} ({selectedBand.leader.email})
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Members:</h4>
                            {/* @ts-ignore */}
                            {selectedBand.members && selectedBand.members.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-1">
                                    {/* @ts-ignore */}
                                    {selectedBand.members.map((member: any) => (
                                        <li key={member._id} className="text-sm">
                                            {member.name} <span className="text-muted-foreground">({member.email})</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground">No members found.</p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
