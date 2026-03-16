"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { UserNav } from "@/components/admin/user-nav";

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export function Header({ onMobileMenuOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      {/* Left side: hamburger + breadcrumbs */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
        <Breadcrumbs />
      </div>

      {/* Right side: notification bell + user nav */}
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          <Badge className="absolute -top-1 -right-1 size-5 items-center justify-center p-0 text-[10px]">
            3
          </Badge>
        </Button>
        <UserNav />
      </div>
    </header>
  );
}
