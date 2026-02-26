import BottomNav from '@/components/layout/BottomNav';
import AuraBackground from '@/components/layout/AuraBackground';
import NotificationManager from '@/components/ui/NotificationManager';
import { MomentumProvider } from '@/contexts/MomentumContext';
import { SyncProvider } from '@/contexts/SyncContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <MomentumProvider>
            <SyncProvider>
                <div className="flex flex-col min-h-screen relative">
                    <AuraBackground />
                    <NotificationManager />
                    <main className="flex-1 pb-32 overflow-x-hidden relative z-10">
                        {children}
                    </main>
                    <BottomNav />
                </div>
            </SyncProvider>
        </MomentumProvider>
    );
}
