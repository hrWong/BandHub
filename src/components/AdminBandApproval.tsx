'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

interface Band {
    _id: string;
    name: string;
    description: string;
    leader: { name: string; email: string };
    createdAt: string;
}

export default function AdminBandApproval() {
    const [pendingBands, setPendingBands] = useState<Band[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingBands();
    }, []);

    const fetchPendingBands = async () => {
        try {
            const res = await fetch('/api/admin/bands?status=pending');
            if (res.ok) {
                const data = await res.json();
                setPendingBands(data);
            }
        } catch (error) {
            console.error('Error fetching pending bands:', error);
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
                fetchPendingBands();
            } else {
                toast.error(`Failed to ${action} band`);
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    if (loading) return <div>Loading pending bands...</div>;

    if (pendingBands.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Pending Band Approvals</h2>
                <Card className="p-6 text-center text-muted-foreground">
                    No pending band approvals.
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Band Approvals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {pendingBands.map((band) => (
                    <Card key={band._id} className="p-0 gap-0">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="truncate text-lg" title={band.name}>{band.name}</CardTitle>
                            <CardDescription className="truncate" title={`Leader: ${band.leader.name} (${band.leader.email})`}>
                                Leader: {band.leader.name} ({band.leader.email})
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 pb-2 h-24 overflow-y-auto">
                            <p className="text-sm text-muted-foreground">{band.description}</p>
                        </CardContent>
                        <CardFooter className="p-4 pt-2 flex gap-2">
                            <Button
                                onClick={() => handleAction(band._id, 'approve')}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                size="sm"
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => handleAction(band._id, 'reject')}
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
