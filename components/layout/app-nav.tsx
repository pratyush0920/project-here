"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Settings, SunMedium } from "lucide-react";

const items = [
  { href: "/app/today", label: "Today", icon: SunMedium },
  { href: "/app/memories", label: "Memories", icon: BookOpen },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-[560px] items-stretch justify-around">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${
                  active ? "text-foreground" : "text-muted"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
