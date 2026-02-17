"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Users,
  GraduationCap,
  DoorOpen,
  BookOpen,
  Clock,
  ScanLine,
  FileText,
  Settings,
  UserPlus,
  Shield,
  Scissors,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { BusinessType, UserRole } from "@plio/db";

const educationNavItems = [
  { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Tutors", href: "/admin/tutors", icon: GraduationCap },
  { label: "Rooms", href: "/admin/rooms", icon: DoorOpen },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Schedules", href: "/admin/schedules", icon: Clock },
  { label: "Scan", href: "/admin/scan", icon: ScanLine },
  { label: "Team", href: "/admin/team", icon: UserPlus },
  { label: "Invoices", href: "/admin/invoices", icon: FileText },
];

const wellnessNavItems = [
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Services", href: "/admin/services", icon: Scissors },
  { label: "Practitioners", href: "/admin/practitioners", icon: UserCheck },
  { label: "Rooms", href: "/admin/rooms", icon: DoorOpen },
  { label: "Team", href: "/admin/team", icon: UserPlus },
  { label: "Invoices", href: "/admin/invoices", icon: FileText },
];

const platformNavItems = [
  { label: "Waitlist", href: "/admin/platform/waitlist", icon: Shield },
];

const bottomNavItems = [
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface SidebarProps {
  userRole: UserRole;
  businessType: BusinessType;
}

export function Sidebar({ userRole, businessType }: SidebarProps) {
  const pathname = usePathname();
  const navItems = businessType === 'wellness' ? wellnessNavItems : educationNavItems;

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-bold text-sidebar-primary-foreground">
            Plio
          </span>
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          {/* Platform section (super admin only) */}
          {userRole === "super_admin" && (
            <div className="mt-4">
              <Separator className="bg-sidebar-border mb-3" />
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                Platform
              </p>
              {platformNavItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </ScrollArea>

      {/* Bottom nav */}
      <div className="px-3 py-4">
        <Separator className="bg-sidebar-border mb-4" />
        <nav className="flex flex-col gap-1">
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-2 flex gap-2 px-3 text-xs text-sidebar-foreground/40">
          <a href="/privacy" className="hover:text-sidebar-foreground/60">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:text-sidebar-foreground/60">Terms</a>
        </div>
      </div>
    </aside>
  );
}
