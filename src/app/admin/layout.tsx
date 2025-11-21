import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
        redirect("/");
    }

    const navItems = [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/rooms", label: "Rooms" },
        { href: "/admin/reservations", label: "Reservations" },
    ];

    return (
        <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
            {/* Mobile Nav */}
            <div className="w-full border-b bg-muted/30 md:hidden">
                <details>
                    <summary className="flex items-center justify-between px-4 py-3 font-semibold cursor-pointer">
                        <span>Admin Panel</span>
                        <Menu className="h-5 w-5" />
                    </summary>
                    <div className="flex flex-col gap-2 px-4 pb-4">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <Button variant="ghost" className="w-full justify-start">
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </div>
                </details>
            </div>

            {/* Sidebar */}
            <aside className="hidden w-64 border-r bg-muted/30 p-6 md:block">
                <h2 className="mb-6 px-4 font-semibold">Admin Panel</h2>
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button variant="ghost" className="w-full justify-start">
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6">
                {children}
            </main>
        </div>
    );
}
