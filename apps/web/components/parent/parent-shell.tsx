"use client";

import { ParentHeader } from "./parent-header";
import { BottomNav } from "./bottom-nav";

interface ParentShellProps {
  tenantName: string;
  children: React.ReactNode;
}

export function ParentShell({
  tenantName,
  children,
}: ParentShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ParentHeader tenantName={tenantName} />
      <main className="flex-1 px-4 pb-24 pt-4 text-base">{children}</main>
      <BottomNav />
    </div>
  );
}
