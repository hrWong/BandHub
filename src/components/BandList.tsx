'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Band {
    _id: string;
    name: string;
    description: string;
    leader: { _id: string; name: string; email: string };
    members: { _id: string; name: string }[];
    pendingMembers?: string[];
    status: 'pending' | 'active' | 'rejected';
    createdAt: string;
}

export default function BandList() {
    const { data: session } = useSession();
    const [bands, setBands] = useState<Band[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBands();
    }, []);

    const fetchBands = async () => {
        try {
            const res = await fetch('/api/bands');
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

    const handleJoin = async (bandId: string) => {
        try {
            const res = await fetch(`/api/bands/${bandId}/join`, {
                method: 'POST',
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Application submitted');
            } else {
                toast.error(data.error || 'Failed to join band');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    if (loading) return <div>Loading bands...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bands.map((band) => (
                <Card key={band._id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle>
                                <Link href={`/bands/${band._id}`} className="hover:underline">
                                    {band.name}
                                </Link>
                            </CardTitle>
                            <Badge variant={band.status === 'active' ? 'default' : 'secondary'}>
                                {band.status}
                            </Badge>
                        </div>
                        <CardDescription>Leader: {band.leader.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{band.description}</p>
                        <div className="text-sm">
                            <span className="font-semibold">Members:</span> {band.members.length}
                        </div>
                    </CardContent>
                    <CardFooter>
                        {session?.user?.id === band.leader._id ? (
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/bands/${band._id}`}>Manage Band</Link>
                            </Button>
                        ) : band.members.some(m => m._id === session?.user?.id) ? (
                            <Button variant="outline" className="w-full" asChild>
                                <Link href={`/bands/${band._id}`}>View Band</Link>
                            </Button>
                        ) : band.pendingMembers?.includes(session?.user?.id) ? (
                            <Button variant="secondary" className="w-full" disabled>
                                Pending Approval
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full">
                                <Button variant="outline" className="flex-1" asChild>
                                    <Link href={`/bands/${band._id}`}>View</Link>
                                </Button>
                                <Button onClick={() => handleJoin(band._id)} className="flex-1">
                                    Join
                                </Button>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
