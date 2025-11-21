import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { auth, signOut } from "@/auth";

export async function Navbar() {
    const session = await auth();

    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="text-2xl font-bold text-primary">
                    BandHub
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/rooms">
                        <Button variant="ghost">Rooms List</Button>
                    </Link>
                    {session ? (
                        <>
                            <Link href="/reservations">
                                <Button variant="ghost">My Reservations</Button>
                            </Link>
                            {session.user?.role === "admin" && (
                                <Link href="/admin">
                                    <Button variant="ghost">Admin Panel</Button>
                                </Link>
                            )}
                            <form action={async () => {
                                "use server";
                                await signOut();
                            }}>
                                <Button variant="outline">Logout ({session.user?.name})</Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost">Login</Button>
                            </Link>
                            <Link href="/register">
                                <Button>Register</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
