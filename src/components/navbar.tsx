// Extracted from the home page so navigation appears site-wide.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";

const applyTheme = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
      const initial = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      setTheme(initial);
      applyTheme(initial);
    }, 0);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // ignore storage errors
    }
  }, [mounted, theme]);

  if (!mounted) {
    return (
      <button
        className="toggle-btn"
        type="button"
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="toggle-btn"
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

type NavItem = {
  id: string;
  label: string;
  href: string;
};

type NavbarProps = {
  items: NavItem[];
  brandHref?: string;
};

const MOBILE_NAV_ID = "primary-mobile-nav";

export default function Navbar({ items, brandHref = "/#hero" }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <Link href={brandHref} className="brand" onClick={handleNavigate}>
          Creature of Habit
        </Link>

        <ul className="nav-links">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="nav-link">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-controls">
          <ThemeToggle />
          <button
            type="button"
            className="menu-btn"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls={MOBILE_NAV_ID}
            onClick={() => setOpen((prev) => !prev)}
          >
            <span className={`burger ${open ? "open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </nav>
      <div className={`mobile-nav ${open ? "open" : ""}`} id={MOBILE_NAV_ID}>
        <ul className="mobile-list">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link href={href} className="mobile-link" onClick={handleNavigate}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
