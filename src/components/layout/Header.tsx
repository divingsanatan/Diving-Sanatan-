"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  House,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ShoppingBag,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import styles from "./Header.module.css";

type SessionUser = {
  name?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  /** Extra path prefixes that should also light up this item. */
  matches?: string[];
};

const STAFF_ROLES = ["admin", "super_admin", "guru", "subadmin"];

// Edit the site's top-level navigation here.
const NAV: NavItem[] = [
  { label: "Home", href: "/", icon: House },
  {
    label: "Services",
    href: "/services",
    icon: Sparkles,
    matches: ["/explore-services", "/search", "/booking", "/checkout"],
  },
  { label: "Gurus", href: "/gurus", icon: Users },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "About", href: "/about", icon: Info },
  { label: "Blog", href: "/blog", icon: BookOpen },
];

// Shown only inside the mobile menu.
const MORE: NavItem[] = [
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Contact", href: "/contact", icon: Mail },
];

const isActive = (item: NavItem, pathname: string) => {
  if (item.href === "/") return pathname === "/";
  return [item.href, ...(item.matches ?? [])].some(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
};

function Avatar({ user, className }: { user: SessionUser; className: string }) {
  const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : "U";
  return (
    <span className={className}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
      <span className={styles.onlineDot} aria-hidden="true" />
    </span>
  );
}

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastRaw = useRef({ session: "", selections: "" });

  // Keep user + selection count in sync with browser storage.
  useEffect(() => {
    const read = () => {
      let sessionRaw = "";
      let selectionsRaw = "";
      try {
        sessionRaw = window.localStorage.getItem("divingsanatan_user_session") || "";
        selectionsRaw = window.localStorage.getItem("divingsanatan_selections") || "";
      } catch {
        /* storage unavailable (private mode etc.) */
      }

      if (selectionsRaw !== lastRaw.current.selections) {
        lastRaw.current.selections = selectionsRaw;
        let count = 0;
        try {
          const parsed = JSON.parse(selectionsRaw);
          count = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
          count = 0;
        }
        setSelectionCount(count);
      }

      if (sessionRaw !== lastRaw.current.session) {
        lastRaw.current.session = sessionRaw;
        let parsed: SessionUser | null = null;
        try {
          const value = sessionRaw ? JSON.parse(sessionRaw) : null;
          parsed = value && typeof value === "object" ? value : null;
        } catch {
          parsed = null;
        }
        setUser(parsed);
      }
    };

    read();
    // Same-tab changes don't fire "storage", so poll lightly as well.
    const interval = window.setInterval(read, 1000);
    window.addEventListener("storage", read);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", read);
    };
  }, []);

  // Subtle elevation once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  // Lock page scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Escape closes anything open; clicking outside closes the user menu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    };
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, []);

  // If the window grows to desktop width, drop the mobile menu.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setMobileOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem("divingsanatan_user_session");
      window.sessionStorage.removeItem("divingsanatan_admin_auth");
      window.sessionStorage.removeItem("divingsanatan_admin_user");
    } catch {
      /* ignore */
    }
    setUser(null);
    setMenuOpen(false);
    setMobileOpen(false);
    // Clear the server-side login cookie too, then go home
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => window.location.assign("/"));
  }, []);

  const isStaff = !!user?.role && STAFF_ROLES.includes(user.role);
  const displayName = user?.name || "Account";

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.bar}>
          <Link href="/" className={styles.brand} aria-label="Diving Sanatan home">
            <Logo size={34} />
            <span className={styles.brandText}>DIVING SANATAN</span>
          </Link>

          <nav className={styles.nav} aria-label="Primary">
            {NAV.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.link} ${active ? styles.active : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.actions}>
            {selectionCount > 0 && (
              <Link
                href="/checkout"
                className={styles.iconBtn}
                aria-label={`${selectionCount} selected ${
                  selectionCount === 1 ? "service" : "services"
                }, go to checkout`}
                title="Your selected services"
              >
                <ShoppingBag size={19} aria-hidden="true" />
                <span className={styles.badge}>{selectionCount}</span>
              </Link>
            )}

            <Link href="/explore-services" className={styles.cta}>
              Book a session
            </Link>

            {user ? (
              <div className={styles.userWrap} ref={menuRef}>
                <button
                  type="button"
                  className={styles.userBtn}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <Avatar user={user} className={styles.avatar} />
                  <span className={styles.userName}>{displayName}</span>
                  <ChevronDown
                    size={15}
                    aria-hidden="true"
                    className={`${styles.chevron} ${menuOpen ? styles.chevronOpen : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div className={styles.menu} role="menu">
                    <div className={styles.menuHead}>
                      <strong>{displayName}</strong>
                      {user.email && <span>{user.email}</span>}
                    </div>
                    <Link href="/profile" className={styles.menuItem} role="menuitem">
                      <UserRound size={17} aria-hidden="true" /> My profile
                    </Link>
                    {isStaff && (
                      <Link href="/admin" className={styles.menuItem} role="menuitem">
                        <LayoutDashboard size={17} aria-hidden="true" /> Dashboard
                      </Link>
                    )}
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.menuDanger}`}
                      role="menuitem"
                      onClick={signOut}
                    >
                      <LogOut size={17} aria-hidden="true" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/profile" className={styles.signIn}>
                Sign in
              </Link>
            )}

            <button
              type="button"
              className={styles.burger}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu lives outside <header> so the header's blur doesn't trap it. */}
      <div
        className={`${styles.backdrop} ${mobileOpen ? styles.backdropOpen : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="mobile-nav"
        className={`${styles.drawer} ${mobileOpen ? styles.drawerOpen : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        {user ? (
          <Link href="/profile" className={styles.drawerUser}>
            <Avatar user={user} className={styles.avatarLg} />
            <span className={styles.drawerUserText}>
              <strong>{displayName}</strong>
              <span>{user.email || "View your profile"}</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : (
          <div className={styles.drawerGuest}>
            <p>Begin your healing journey</p>
            <span>Sign in to view your bookings and soul report.</span>
            <Link href="/profile" className={styles.drawerSignIn}>
              Sign in
            </Link>
          </div>
        )}

        <nav className={styles.drawerNav} aria-label="Mobile primary">
          {[...NAV, ...MORE].map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.drawerLink} ${active ? styles.drawerActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={20} aria-hidden={true} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.drawerFoot}>
          <Link href="/explore-services" className={styles.drawerCta}>
            Book a session <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {user && (
            <button type="button" className={styles.drawerOut} onClick={signOut}>
              <LogOut size={17} aria-hidden="true" /> Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Reserves the header's height so page content starts below it. */}
      <div className={styles.spacer} />
    </>
  );
};
