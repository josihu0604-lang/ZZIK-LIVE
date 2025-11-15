import BottomTabBar from '@/components/navigation/BottomTabBar';
import RouteTracker from '@/components/navigation/RouteTracker';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      {/* Route tracking */}
      <RouteTracker />
      
      {/* Main content with safe area padding */}
      <main className="pt-[env(safe-area-inset-top)]">{children}</main>

      {/* Bottom Navigation */}
      <BottomTabBar />
    </div>
  );
}
