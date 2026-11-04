import packageJson from '@/../package.json';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar mode="admin" />
      <main>{children}</main>
      <div className="fixed bottom-4 left-4 z-10">
        <p className="text-xs text-muted-foreground/60">
          v{packageJson.version}
        </p>
      </div>
    </div>
  );
}
