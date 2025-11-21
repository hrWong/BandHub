import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)]">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-muted/30 p-6 hidden md:block">
                <h2 className="font-semibold mb-6 px-4">Admin Panel</h2>
                <nav className="space-y-2">
                    <Link href="/admin">
                        <Button variant="ghost" className="w-full justify-start">
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button variant="ghost" className="w-full justify-start">
                            Users
                        </Button>
                    </Link>
                    <Link href="/admin/rooms">
                        <Button variant="ghost" className="w-full justify-start">
                            Rooms
                        </Button>
                    </Link>
                    <Link href="/admin/reservations">
                        <Button variant="ghost" className="w-full justify-start">
                            Reservations
                        </Button>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    );
}
