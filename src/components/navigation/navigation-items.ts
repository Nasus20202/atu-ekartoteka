import {
  Building2,
  Cog,
  Home,
  type LucideIcon,
  ReceiptText,
  Upload,
  Users,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type NavbarMode = 'dashboard' | 'admin';

const adminNavigation: NavItem[] = [
  { name: 'Panel klienta', href: '/dashboard', icon: Home },
  { name: 'Mieszkania', href: '/admin/apartments', icon: Building2 },
  { name: 'Import', href: '/admin/import', icon: Upload },
  { name: 'Użytkownicy', href: '/admin/users', icon: Users },
];

const tenantNavigation: NavItem[] = [
  { name: 'Rozliczenia', href: '/dashboard/settlements', icon: ReceiptText },
];

const adminPanelLink: NavItem = {
  name: 'Panel administratora',
  href: '/admin',
  icon: Cog,
};

export function getNavigationItems(
  mode: NavbarMode,
  isAdmin: boolean
): NavItem[] {
  if (mode === 'admin') return adminNavigation;
  return isAdmin ? [...tenantNavigation, adminPanelLink] : tenantNavigation;
}

/** Whether the path is the linked page or one nested in it. */
export const isCurrentPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
