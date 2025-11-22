'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Users, UserPlus, ShieldCheck } from 'lucide-react';

interface User {
    _id: string;
    name: string;
    email: string;
    image?: string;
}

interface Band {
    _id: string;
    name: string;
    description: string;
    leader: User;
    members: User[];
    pendingMembers?: User[] | string[];
    status: 'pending' | 'active' | 'rejected';
    createdAt: string;
}

export default function BandDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { data: session } = useSession();
    const router = useRouter();
    const [band, setBand] = useState<Band | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchBandDetails();
    }, [id]);

    const fetchBandDetails = async () => {
        try {
            const res = await fetch(`/api/bands/${id}`);
            if (res.ok) {
                const data = await res.json();
                setBand(data);
            } else {
                toast.error('Failed to load band details');
                router.push('/bands');
            }
        } catch (error) {
            console.error('Error fetching band:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        try {
            const res = await fetch(`/api/bands/${id}/join`, {
                method: 'POST',
            });

            if (res.ok) {
                toast.success('Join request sent successfully');
                fetchBandDetails(); // Refresh to update UI state if needed
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to send join request');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleMemberAction = async (userId: string, action: 'approve' | 'reject' | 'remove' | 'leave') => {
        try {
            const res = await fetch(`/api/bands/${id}/members`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (res.ok) {
                const msg = action === 'leave' ? 'Left band successfully' : `Member ${action}d successfully`;
                toast.success(msg);
                if (action === 'leave') {
                    router.push('/bands');
                } else {
                    fetchBandDetails();
                }
            } else {
                const data = await res.json();
                toast.error(data.error || `Failed to ${action} member`);
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleUpdateBand = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name');
        const description = formData.get('description');

        try {
            const res = await fetch(`/api/bands/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });

            if (res.ok) {
                toast.success('Band updated successfully');
                fetchBandDetails();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update band');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleDeleteBand = async () => {
        if (!confirm('Are you sure you want to delete this band? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/bands/${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('Band deleted successfully');
                router.push('/bands');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to delete band');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!band) return null;

    const isLeader = session?.user?.id === band.leader._id;
    const isMember = band.members.some((m) => m._id === session?.user?.id);
    // We don't have pending status in member list from this API unless we are leader.
    // But for non-leaders, we can't easily know if they are pending unless we check differently.
    // For now, let's rely on the button state or error message.
    // Actually, we can check if the user is in pendingMembers if we are the leader.
    // If we are NOT the leader, the API doesn't return pendingMembers.
    // So a regular user won't know if they are pending just by looking at `band` object from this API.
    // That's a minor UX gap, but acceptable for now. They will get an error if they try to join again.

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{band.name}</h1>
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Leader: {band.leader.name}</span>
                    </div>
                </div>

                {!isMember && !isLeader && !band.pendingMembers?.some(m => (typeof m === 'string' ? m : m._id) === session?.user?.id) && (
                    <Button onClick={handleJoinRequest} size="lg">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join Band
                    </Button>
                )}

                {isMember && !isLeader && (
                    <Badge variant="secondary" className="text-md px-4 py-1">
                        Member
                    </Badge>
                )}

                {!isMember && !isLeader && band.pendingMembers?.some(m => (typeof m === 'string' ? m : m._id) === session?.user?.id) && (
                    <Badge variant="outline" className="text-md px-4 py-1 bg-orange-100 text-orange-800 border-orange-200">
                        Pending Approval
                    </Badge>
                )}
            </div>

            <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members ({band.members.length})</TabsTrigger>
                    {isLeader && (
                        <TabsTrigger value="manage" className="relative">
                            Manage
                            {band.pendingMembers && band.pendingMembers.length > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                    {band.pendingMembers.length}
                                </span>
                            )}
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>About {band.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{band.description}</p>
                            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold">{band.members.length}</div>
                                    <div className="text-xs text-muted-foreground">Members</div>
                                </div>
                                <div className="rounded-lg border p-4 text-center">
                                    <div className="text-2xl font-bold">{new Date(band.createdAt).getFullYear()}</div>
                                    <div className="text-xs text-muted-foreground">Established</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members">
                    <Card>
                        <CardHeader>
                            <CardTitle>Band Members</CardTitle>
                            <CardDescription>People who are part of this band.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {band.members.map((member) => (
                                    <div key={member._id} className="flex items-center gap-4 rounded-lg border p-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={member.image} />
                                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="truncate font-medium">{member.name}</div>
                                            <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                                        </div>
                                        {member._id === band.leader._id ? (
                                            <Badge variant="outline" className="ml-auto">Leader</Badge>
                                        ) : (
                                            <>
                                                {isLeader && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="ml-auto"
                                                        onClick={() => handleMemberAction(member._id, 'remove')}
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                                {isMember && !isLeader && member._id === session?.user?.id && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="ml-auto"
                                                        onClick={() => handleMemberAction(member._id, 'leave')}
                                                    >
                                                        Leave Band
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {isLeader && (
                    <TabsContent value="manage" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pending Requests</CardTitle>
                                <CardDescription>Approve or reject users who want to join your band.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {band.pendingMembers && band.pendingMembers.length > 0 ? (
                                    <div className="space-y-4">
                                        {band.pendingMembers.map((user) => {
                                            if (typeof user === 'string') return null; // Should be populated for leader
                                            return (
                                                <div key={user._id} className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarImage src={user.image} />
                                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium">{user.name}</div>
                                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMemberAction(user._id, 'reject')}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleMemberAction(user._id, 'approve')}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <Users className="mb-4 h-12 w-12 opacity-20" />
                                        <p>No pending join requests.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Band Details</CardTitle>
                                <CardDescription>Update your band's public information.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateBand} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Band Name</label>
                                        <input
                                            name="name"
                                            defaultValue={band.name}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Description</label>
                                        <textarea
                                            name="description"
                                            defaultValue={band.description}
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required
                                        />
                                    </div>
                                    <Button type="submit">Save Changes</Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="border-destructive/50">
                            <CardHeader>
                                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                                <CardDescription>Irreversible actions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" onClick={handleDeleteBand}>
                                    Delete Band
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
