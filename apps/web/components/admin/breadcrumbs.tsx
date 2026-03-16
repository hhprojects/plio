"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const labelMap: Record<string, string> = {
  admin: "Dashboard",
  calendar: "Calendar",
  students: "Students",
  tutors: "Tutors",
  rooms: "Rooms",
  courses: "Courses",
  schedules: "Schedules",
  settings: "Settings",
};

function getLabel(segment: string): string {
  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumbs on the admin root
  if (segments.length <= 1) {
    return null;
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = getLabel(segment);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
