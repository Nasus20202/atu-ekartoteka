// The admin bar has more items, so it collapses into the menu on wider screens
export const NAVBAR_BREAKPOINT_CLASSES = {
  dashboard: {
    links: 'hidden md:flex md:gap-4',
    actions: 'hidden items-center gap-4 md:flex',
    toggle: 'md:hidden',
    menu: 'md:hidden',
  },
  admin: {
    links: 'hidden lg:flex lg:gap-4',
    actions: 'hidden items-center gap-4 lg:flex',
    toggle: 'lg:hidden',
    menu: 'lg:hidden',
  },
} as const;
