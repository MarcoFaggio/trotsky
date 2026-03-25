"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Hotel,
  BarChart3,
  TrendingUp,
  Megaphone,
  Settings,
  LogOut,
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface SidebarProps {
  role: "ANALYST" | "CLIENT";
  collapsed: boolean;
  onToggle: () => void;
  unreadMessages: number;
  upcomingEvents: number;
}

const analystLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/hotels", label: "Manage Hotels", icon: Hotel },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/occupancy", label: "Occupancy", icon: BarChart3 },
  { href: "/pace", label: "Pace / OTB", icon: TrendingUp },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/scrapes", label: "Scrape Admin", icon: Settings },
];

const clientLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/messages", label: "Message Trosky", icon: MessageSquare },
  { href: "/pace", label: "Pace / OTB", icon: TrendingUp },
];

export function Sidebar({
  role,
  collapsed,
  onToggle,
  unreadMessages,
  upcomingEvents,
}: SidebarProps) {
  const pathname = usePathname();
  const links = role === "ANALYST" ? analystLinks : clientLinks;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-slate-50/50 transition-all duration-200",
          collapsed ? "w-16" : "w-[280px]"
        )}
      >
        <div className="flex h-14 items-center border-b px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">
                T
              </span>
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm whitespace-nowrap">
                Trosky
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              pathname.startsWith(link.href + "/");

            const badge =
              link.href === "/messages" && unreadMessages > 0
                ? unreadMessages
                : link.href === "/events" && upcomingEvents > 0
                ? upcomingEvents
                : null;

            const content = (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate">{link.label}</span>
                    {badge !== null && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-bold"
                      >
                        {badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && badge !== null && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {badge}
                  </span>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>{content}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {link.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return content;
          })}
        </nav>

        <div className="border-t p-2 space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-muted-foreground",
              collapsed ? "justify-center px-2" : "justify-start gap-3"
            )}
            onClick={onToggle}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-muted-foreground",
              collapsed ? "justify-center px-2" : "justify-start gap-3"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
