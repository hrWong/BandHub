'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Crown, Users, Clock } from 'lucide-react';

interface Band {
    _id: string;
    name: string;
    status: 'pending' | 'active' | 'rejected';
}

interface UserBands {
    leading: Band[];
    member: Band[];
    pending: Band[];
}

export default function UserBandDashboard() {
    const [bands, setBands] = useState<UserBands | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserBands = async () => {
            try {
                const res = await fetch('/api/user/bands');
                if (res.ok) {
                    const data = await res.json();
                    setBands(data);
                }
            } catch (error) {
                console.error('Error fetching user bands:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserBands();
    }, []);

    if (loading) return null; // Don't show loader to avoid flickering if it loads fast, or show a skeleton if preferred.
    if (!bands || (bands.leading.length === 0 && bands.member.length === 0 && bands.pending.length === 0)) return null;

    return (
        <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">My Band Dashboard</h2>

            <div className="grid gap-4 md:grid-cols-3">
                {/* Leading Bands */}
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                            <Crown className="mr-2 h-5 w-5 text-yellow-500" />
                            Leading
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bands.leading.length > 0 ? (
                            <ul className="space-y-2">
                                {bands.leading.map(band => (
                                    <li key={band._id} className="flex items-center justify-between">
                                        <Link href={`/bands/${band._id}`} className="font-medium hover:underline truncate max-w-[150px]">
                                            {band.name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={band.status === 'active' ? 'default' : 'secondary'}>
                                                {band.status}
                                            </Badge>
                                            <Button variant="ghost" size="sm" asChild className="h-6 px-2">
                                                <Link href={`/bands/${band._id}`}>View</Link>
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">You don't lead any bands.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Member Bands */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                            <Users className="mr-2 h-5 w-5 text-blue-500" />
                            Member Of
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bands.member.length > 0 ? (
                            <ul className="space-y-2">
                                {bands.member.map(band => (
                                    <li key={band._id} className="flex items-center justify-between">
                                        <Link href={`/bands/${band._id}`} className="font-medium hover:underline truncate max-w-[150px]">
                                            {band.name}
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">Active</Badge>
                                            <Button variant="ghost" size="sm" asChild className="h-6 px-2">
                                                <Link href={`/bands/${band._id}`}>View</Link>
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">You are not a member of any bands.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Applications */}
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                            <Clock className="mr-2 h-5 w-5 text-orange-500" />
                            Pending Applications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {bands.pending.length > 0 ? (
                            <ul className="space-y-2">
                                {bands.pending.map(band => (
                                    <li key={band._id} className="flex items-center justify-between">
                                        <span className="font-medium truncate max-w-[150px] text-muted-foreground">
                                            {band.name}
                                        </span>
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                                            Pending
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground">No pending applications.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
