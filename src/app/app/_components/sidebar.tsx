"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Building2,
  Handshake,
  CheckSquare,
  BarChart2,
  Settings,
} from "lucide-react";

const routes = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/contacts", label: "Contacts", icon: Users },
  { href: "/app/companies", label: "Companies", icon: Building2 },
  { href: "/app/deals", label: "Deals", icon: Handshake },
  { href: "/app/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/app/reports", label: "Reports", icon: BarChart2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <nav className="space-y-1 p-4">
        {routes.map((route) => {
          const Icon = route.icon;
          const active = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {route.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
