import { AppFooter } from '@/components/layout/app-footer';
import { ScrollToTop } from '@/components/layout/scroll-to-top';
import { DashboardNavbar } from '@/components/navigation/dashboard-navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ScrollToTop />
      <DashboardNavbar mode="admin" />
      <main className="flex flex-1 flex-col">{children}</main>
      <AppFooter />
    </div>
  );
}
