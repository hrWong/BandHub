import { AdminStatsBoard } from "@/components/AdminStatsBoard";
import { RoomStatusBoard } from "@/components/RoomStatusBoard";
import AdminBandApproval from "@/components/AdminBandApproval";
import AdminUserApproval from "@/components/AdminUserApproval";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            </div>

            <AdminStatsBoard />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <AdminBandApproval />
                </div>
                <div className="col-span-3">
                    <AdminUserApproval />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Live Room Status</h2>
                    <p className="text-sm text-muted-foreground">Updates every 15 seconds</p>
                </div>
                <RoomStatusBoard />
            </div>
        </div>
    );
}
