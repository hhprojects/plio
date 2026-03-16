"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/parent/dashboard", icon: Home },
  { label: "Schedule", href: "/parent/schedule", icon: Calendar },
  { label: "Fees", href: "/parent/fees", icon: CreditCard },
  { label: "Profile", href: "/parent/profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive
                  ? "text-indigo-600"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              <item.icon
                className={cn("size-5", isActive && "stroke-[2.5]")}
              />
              <span className={cn(isActive && "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
