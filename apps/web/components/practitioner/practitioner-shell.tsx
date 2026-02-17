"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Schedule", href: "/practitioner/schedule", icon: CalendarDays },
  { label: "Availability", href: "/practitioner/availability", icon: Clock },
];

interface PractitionerShellProps {
  children: React.ReactNode;
  practitionerName: string;
}

export function PractitionerShell({ children, practitionerName }: PractitionerShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/practitioner/schedule" className="text-lg font-bold text-indigo-600">
            Plio
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors outline-none">
              {practitionerName}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <form action={signOut}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full cursor-pointer">
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-white safe-area-bottom">
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/") ||
              (item.href === "/practitioner/schedule" && pathname.startsWith("/practitioner/appointments"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  isActive
                    ? "text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
