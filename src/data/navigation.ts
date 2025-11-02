export type NavItem = {
  id: string;
  label: string;
  href: string;
};

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { id: "hero", label: "Home", href: "/#hero" },
  { id: "music", label: "Music", href: "/#music" },
  { id: "gallery", label: "Gallery", href: "/#gallery" },
  { id: "videos", label: "Videos", href: "/#videos" },
  { id: "about", label: "About", href: "/#about" },
  { id: "contact", label: "Contact", href: "/#contact" },
];
