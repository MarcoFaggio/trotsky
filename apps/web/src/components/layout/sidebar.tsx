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
  Inbox,
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
  { href: "/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/scrapes", label: "Scrape Admin", icon: Settings },
];

const clientLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/inquiries", label: "Inquiries", icon: Inbox },
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
          "fixed inset-x-0 bottom-0 z-40 flex h-16 w-full flex-row border-t bg-card/95 shadow-2xl shadow-black/10 backdrop-blur-xl transition-all duration-200 dark:border-white/10 lg:relative lg:inset-auto lg:h-screen lg:flex-col lg:border-r lg:border-t-0 lg:bg-card/70 lg:shadow-none",
          collapsed ? "lg:w-16" : "lg:w-[280px]"
        )}
      >
        <div className="hidden h-16 items-center border-b px-3 lg:flex">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25">
              <span className="text-sm font-bold text-primary-foreground">
                T
              </span>
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold whitespace-nowrap">
                Trosky
              </span>
            )}
          </Link>
        </div>

        <nav className="flex flex-1 gap-1 overflow-x-auto overflow-y-hidden p-2 lg:block lg:space-y-1 lg:overflow-y-auto">
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
                  "relative flex min-h-11 min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 lg:min-w-11 lg:flex-row lg:gap-3 lg:justify-start",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 lg:bg-primary/10 lg:text-primary lg:shadow-none"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span className="max-w-16 truncate text-[10px] leading-none lg:hidden">
                  {link.label.replace("Manage ", "").replace("Message ", "")}
                </span>
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

        <div className="hidden space-y-1 border-t p-2 lg:block">
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
