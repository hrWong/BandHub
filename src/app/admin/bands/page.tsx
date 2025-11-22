import BandManagementTable from '@/components/BandManagementTable';

export default function AdminBandsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Band Management</h1>
            </div>
            <BandManagementTable />
        </div>
    );
}
