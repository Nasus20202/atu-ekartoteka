import {
  Building2,
  Cog,
  Home,
  type LucideIcon,
  ReceiptText,
  Upload,
  Users,
  Vote,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavbarMode = 'dashboard' | 'admin';

const adminNavigation: NavItem[] = [
  { name: 'Panel klienta', href: '/dashboard', icon: Home },
  { name: 'Mieszkania', href: '/admin/apartments', icon: Building2 },
  { name: 'Import', href: '/admin/import', icon: Upload },
  { name: 'Użytkownicy', href: '/admin/users', icon: Users },
  { name: 'Głosowania', href: '/admin/votings', icon: Vote },
];

const tenantNavigation: NavItem[] = [
  { name: 'Rozliczenia', href: '/dashboard/settlements', icon: ReceiptText },
];

const votingsLink: NavItem = {
  name: 'Głosowania',
  href: '/dashboard/votings',
  icon: Vote,
};

const adminPanelLink: NavItem = {
  name: 'Panel administratora',
  href: '/admin',
  icon: Cog,
};

export function getNavigationItems(
  mode: NavbarMode,
  isAdmin: boolean,
  /** Votings waiting for the user's vote; undefined hides the votings link. */
  pendingVotings?: number
): NavItem[] {
  if (mode === 'admin') return adminNavigation;
  const votings =
    pendingVotings === undefined
      ? []
      : [{ ...votingsLink, badge: pendingVotings }];
  const links = [...tenantNavigation, ...votings];
  return isAdmin ? [...links, adminPanelLink] : links;
}

/** Whether the path is the linked page or one nested in it. */
export const isCurrentPath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
