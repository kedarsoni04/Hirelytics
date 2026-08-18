"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Sparkles, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { studentProfile, companyProfile, adminProfile } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";

interface TopNavbarProps {
  role: "student" | "company" | "admin";
  title?: string;
}

const adminPageTitles: Record<string, string> = {
  "/admin/dashboard": "Admin Dashboard",
  "/admin/companies": "Manage Companies",
  "/admin/students": "Manage Students",
  "/admin/analytics": "Platform Analytics",
  "/admin/settings": "Settings & Logs",
};

export default function TopNavbar({ role, title }: TopNavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  let profile = { name: "Guest", initials: "G", email: "" };
  if (user) {
    if (user.role === "admin") {
      profile = { name: user.full_name || "Admin", initials: "AD", email: user.email };
    } else if (user.role === "student") {
      const name = user.full_name || "Student";
      profile = { name, initials: name.substring(0, 2).toUpperCase(), email: user.email };
    } else {
      const name = user.company_name || user.full_name || "Company";
      profile = { name, initials: name.substring(0, 2).toUpperCase(), email: user.email };
    }
  }

  const displayTitle = title || (role === "admin" ? adminPageTitles[pathname] || "Admin Portal" : undefined);

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-5 gap-4 sticky top-0 z-20 shrink-0">
      {/* Student & Admin: Page Title */}
      {(role === "student" || role === "admin") && displayTitle && (
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-foreground">{displayTitle}</p>
        </div>
      )}

      {/* Company: Left-aligned Search */}
      {role === "company" && (
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search candidates, drives…"
            className="pl-9 h-8 text-xs bg-muted border-0 focus-visible:bg-white focus-visible:border focus-visible:border-border"
          />
        </div>
      )}

      <div className="flex-1" />

      {/* Student: Center-aligned search */}
      {role === "student" && (
        <div className="hidden md:flex relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            className="h-8 w-52 pl-8 pr-3 rounded-lg bg-muted border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring transition-all"
            placeholder="Search drives, companies…"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs tracking-tight text-muted-foreground font-mono pointer-events-none">
            ⌘K
          </kbd>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* AI Tools */}
        {role === "student" ? (
          <Link href="/applications">
            <button className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white ai-gradient ai-glow hover:opacity-90 transition-opacity">
              <Sparkles className="size-3.5" />
              AI Tools
            </button>
          </Link>
        ) : role === "company" ? (
          <Link href="/company/pipeline">
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-xs h-8 text-[#5B21B6] border-violet-200 bg-[#EDE9FE] hover:bg-[#DDD6FE] hover:text-[#4C1D95]"
            >
              <Sparkles className="size-3.5" />
              AI Tools
            </Button>
          </Link>
        ) : null}

        {/* Notifications */}
        <Link
          href={
            role === "student"
              ? "/notifications"
              : role === "company"
              ? "/company/notifications"
              : "/admin/dashboard"
          }
        >
          <Button variant="ghost" size="icon" className="size-8 relative" title="Notifications">
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 border-2 border-white" />
          </Button>
        </Link>

        {/* Standardized User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-accent transition-colors group cursor-pointer outline-none">
            <Avatar className="size-6">
              <AvatarFallback
                className={`text-xs tracking-tight font-bold ${
                  role === "admin" ? "bg-admin-slate text-white" : "brand-gradient text-white"
                }`}
              >
                {profile.initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground hidden sm:block">
              {profile.name.split(" ")[0]}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground truncate">
                {profile.email}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {role === "student" && (
              <>
                <Link href="/profile">
                  <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                    <User className="size-3.5" /> My Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                    <Settings className="size-3.5" /> Settings
                  </DropdownMenuItem>
                </Link>
              </>
            )}
            {role === "company" && (
              <>
                <Link href="/company/settings">
                  <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                    <User className="size-3.5" /> Company Profile
                  </DropdownMenuItem>
                </Link>
                <Link href="/company/settings">
                  <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                    <Settings className="size-3.5" /> Settings
                  </DropdownMenuItem>
                </Link>
              </>
            )}
            {role === "admin" && (
              <>
                <Link href="/admin/settings">
                  <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                    <User className="size-3.5" /> Admin Team
                  </DropdownMenuItem>
                </Link>
                <Link href="/admin/settings">
                  <DropdownMenuItem className="text-xs gap-2 cursor-pointer">
                    <Settings className="size-3.5" /> System Settings
                  </DropdownMenuItem>
                </Link>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-xs gap-2 text-rose-500 focus:text-rose-500 cursor-pointer">
              <LogOut className="size-3.5" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
