import { AppFooter } from '@/components/layout/app-footer';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardNavbar mode="admin" />
      <main className="flex flex-1 flex-col">{children}</main>
      <AppFooter />
    </div>
  );
}
