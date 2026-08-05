"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const NAV_ITEMS = [
  { key: "about", label: "About", href: "/about" },
  { key: "work", label: "Work", href: "/" },
  { key: "extras", label: "Extras", href: null },
] as const;

function getActiveKey(pathname: string) {
  if (pathname === "/about") return "about";
  if (pathname === "/") return "work";
  return null;
}

export function Nav() {
  const pathname = usePathname();
  const active = getActiveKey(pathname);

  return (
    <nav
      style={{ viewTransitionName: "site-nav" }}
      className="fixed top-20 right-16 z-50 flex items-center gap-4 rounded border border-foreground/10 bg-background p-2"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        const label = (
          <span className="relative block rounded px-2 py-1 text-[14px] leading-[1.4]">
            {isActive && (
              <motion.span
                layoutId="nav-active-pill"
                className="absolute inset-0 rounded bg-[#E4DDD0]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span
              className={`relative z-10 text-foreground/70 ${isActive ? "font-medium" : "font-normal"}`}
            >
              {item.label}
            </span>
          </span>
        );

        if (!item.href) {
          return <span key={item.key}>{label}</span>;
        }

        return (
          <Link key={item.key} href={item.href}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
