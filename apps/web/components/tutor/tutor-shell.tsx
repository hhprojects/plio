"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LogOut, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Schedule", href: "/tutor/schedule", icon: CalendarDays },
  { label: "Scan", href: "/tutor/scan", icon: ScanLine },
];

interface TutorShellProps {
  children: React.ReactNode;
  tutorName: string;
}

export function TutorShell({ children, tutorName }: TutorShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/tutor/schedule" className="text-lg font-bold text-indigo-600">
            Plio
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors outline-none">
              {tutorName}
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
      <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl items-center justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/") ||
              (item.href === "/tutor/schedule" && pathname.startsWith("/tutor/classes"));
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
