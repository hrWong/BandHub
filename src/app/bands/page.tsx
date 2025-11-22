import BandList from '@/components/BandList';
import CreateBandDialog from '@/components/CreateBandDialog';
import UserBandDashboard from '@/components/UserBandDashboard';

export default function BandsPage() {
    return (
        <div className="container mx-auto py-8">
            <UserBandDashboard />
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">All Bands</h1>
                <CreateBandDialog />
            </div>
            <BandList />
        </div>
    );
}
