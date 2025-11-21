import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/auth";
import { Menu } from "lucide-react";

export async function Navbar() {
    const session = await auth();

    const navLinks = (
        <>
            <Link href="/rooms">
                <Button variant="ghost" className="w-full justify-start md:w-auto">
                    Rooms List
                </Button>
            </Link>
            {session ? (
                <>
                    <Link href="/reservations">
                        <Button variant="ghost" className="w-full justify-start md:w-auto">
                            My Reservations
                        </Button>
                    </Link>
                    {session.user?.role === "admin" && (
                        <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start md:w-auto">
                                Admin Panel
                            </Button>
                        </Link>
                    )}
                    <form
                        action={async () => {
                            "use server";
                            await signOut();
                        }}
                        className="w-full"
                    >
                        <Button variant="outline" className="w-full justify-start md:w-auto">
                            Logout ({session.user?.name})
                        </Button>
                    </form>
                </>
            ) : (
                <>
                    <Link href="/login">
                        <Button variant="ghost" className="w-full justify-start md:w-auto">
                            Login
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button className="w-full justify-start md:w-auto">Register</Button>
                    </Link>
                </>
            )}
        </>
    );

    return (
        <nav className="border-b bg-background">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="text-2xl font-bold text-primary">
                    BandHub
                </Link>
                <div className="hidden items-center gap-4 md:flex">{navLinks}</div>
                <div className="relative md:hidden">
                    <details className="relative">
                        <summary
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border bg-background text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground [&::-webkit-details-marker]:hidden"
                            aria-label="Toggle navigation menu"
                        >
                            <Menu className="h-5 w-5" />
                        </summary>
                        <div className="absolute right-0 mt-2 flex w-56 flex-col gap-2 rounded-lg border bg-background p-3 shadow-lg z-50">
                            {navLinks}
                        </div>
                    </details>
                </div>
            </div>
        </nav>
    );
}
