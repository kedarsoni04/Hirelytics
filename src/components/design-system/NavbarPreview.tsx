"use client";

import { Bell, Search, ChevronDown, Sparkles, Settings, LogOut, User, LayoutDashboard } from "lucide-react";
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
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Dashboard", active: true },
  { label: "Drives", active: false },
  { label: "Applicants", active: false },
  { label: "Reports", active: false },
];

export default function NavbarPreview() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Navbar</h2>
      <div className="rounded-xl border border-border overflow-hidden card-shadow">
        <nav className="h-14 bg-white border-b border-border flex items-center px-5 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="size-7 rounded-lg brand-gradient flex items-center justify-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="text-sm font-bold text-foreground tracking-tight">Hirelytics</span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              className="h-8 w-52 pl-8 pr-3 rounded-lg bg-accent border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring"
              placeholder="Search drives, applicants…"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs tracking-tight text-muted-foreground font-mono">
              ⌘K
            </kbd>
          </div>

          {/* AI button */}
          <button className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white ai-gradient ai-glow hover:opacity-90 transition-opacity shrink-0">
            <Sparkles className="size-3.5" />
            AI Tools
          </button>

          {/* Notification bell */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="size-8 relative">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500 border-2 border-white" />
            </Button>
          </div>

          {/* User avatar + dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-accent transition-colors group cursor-pointer">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs tracking-tight font-bold brand-gradient text-white">
                  RA
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground hidden sm:block">Ravi Anand</span>
              <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs">My Account</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2">
                <User className="size-3.5" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2">
                <LayoutDashboard className="size-3.5" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs gap-2">
                <Settings className="size-3.5" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2 text-rose-500 focus:text-rose-500">
                <LogOut className="size-3.5" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </nav>

        {/* Preview label */}
        <div className="bg-muted/40 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Company/Recruiter view — Navbar</p>
          <span className="text-xs text-muted-foreground font-mono">h-14</span>
        </div>
      </div>
    </section>
  );
}
