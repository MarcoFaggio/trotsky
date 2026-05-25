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
import { TroskyMark } from "@/components/brand/trosky-logo";

interface SidebarProps {
  role: "ANALYST" | "CLIENT";
  collapsed: boolean;
  onToggle: () => void;
  unreadMessages: number;
  upcomingEvents: number;
}

const analystLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase, tour: "nav-portfolio" },
  { href: "/hotels", label: "Manage Hotels", icon: Hotel },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/occupancy", label: "Occupancy", icon: BarChart3 },
  { href: "/pace", label: "Pace / OTB", icon: TrendingUp },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/inquiries", label: "Inquiries", icon: Inbox, tour: "nav-inquiries" },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/scrapes", label: "Scrape Admin", icon: Settings },
];

const clientLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tour: "nav-dashboard" },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/inquiries", label: "Inquiries", icon: Inbox, tour: "nav-inquiries" },
  { href: "/messages", label: "Message Trosky", icon: MessageSquare, tour: "nav-messages" },
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
          "fixed inset-x-0 bottom-0 z-40 flex h-16 w-full flex-row border-t border-trosky-border bg-white/95 shadow-lg shadow-trosky-ink/5 backdrop-blur-xl transition-all duration-200 dark:border-white/10 dark:bg-card/95 lg:relative lg:inset-auto lg:h-screen lg:flex-col lg:border-r lg:border-t-0 lg:bg-white lg:shadow-none dark:lg:bg-card",
          collapsed ? "lg:w-16" : "lg:w-[280px]"
        )}
      >
        <div className="hidden h-16 items-center border-b border-trosky-border px-3 lg:flex dark:border-white/10">
          <Link
            href="/dashboard"
            aria-label="Trosky dashboard"
            className="flex items-center gap-2 overflow-hidden"
          >
            <TroskyMark className="h-9 w-9 shrink-0" />
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-tight text-trosky-ink dark:text-foreground">
                Trosky
              </span>
            )}
          </Link>
        </div>

        <nav
          data-tour="sidebar"
          className="flex flex-1 gap-1 overflow-x-auto overflow-y-hidden p-2 lg:block lg:space-y-1 lg:overflow-y-auto"
        >
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
                data-tour={link.tour}
                className={cn(
                  "relative flex min-h-11 min-w-[4.75rem] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-sm font-medium transition-[background-color,color,transform] duration-200 lg:min-w-11 lg:flex-row lg:gap-3 lg:justify-start",
                  collapsed && "lg:justify-center lg:px-2",
                  isActive
                    ? "bg-trosky-red text-white shadow-sm shadow-trosky-red/20 lg:bg-trosky-soft lg:text-trosky-ink lg:shadow-none lg:before:absolute lg:before:left-0 lg:before:top-1/2 lg:before:h-7 lg:before:w-1 lg:before:-translate-y-1/2 lg:before:rounded-r-full lg:before:bg-trosky-red lg:before:content-[''] dark:lg:bg-trosky-red/15 dark:lg:text-foreground"
                    : "text-trosky-muted hover:bg-trosky-soft hover:text-trosky-ink dark:hover:bg-accent"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span className="max-w-[4.5rem] truncate text-[10px] leading-tight lg:hidden">
                  {link.label.replace("Manage ", "").replace("Message ", "")}
                </span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                    {badge !== null && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 min-w-[20px] shrink-0 border-0 bg-trosky-red px-1.5 text-[10px] font-bold text-white"
                      >
                        {badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && badge !== null && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-trosky-red px-1 text-[9px] font-bold text-white">
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

        <div className="hidden space-y-1 border-t border-trosky-border p-2 lg:block dark:border-white/10">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full rounded-xl text-trosky-muted hover:bg-trosky-soft hover:text-trosky-ink",
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
              "w-full rounded-xl text-trosky-muted hover:bg-trosky-soft hover:text-trosky-ink",
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
