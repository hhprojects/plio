"use client";

import { useState } from "react";
import { Sidebar } from "@/components/admin/sidebar";
import { Header } from "@/components/admin/header";
import { MobileNav } from "@/components/admin/mobile-nav";
import type { BusinessType, UserRole } from "@plio/db";

interface AdminShellProps {
  children: React.ReactNode;
  userRole: UserRole;
  businessType: BusinessType;
}

export function AdminShell({ children, userRole, businessType }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar userRole={userRole} businessType={businessType} />

      {/* Mobile nav (Sheet) */}
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} userRole={userRole} businessType={businessType} />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMobileMenuOpen={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
