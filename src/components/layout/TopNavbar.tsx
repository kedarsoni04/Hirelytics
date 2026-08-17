"use client";

import Link from "next/link";
import { Search, Sparkles, Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { studentProfile, companyProfile, adminProfile } from "@/lib/mock-data";

interface TopNavbarProps {
  role: "student" | "company" | "admin";
  title?: string;
}

export default function TopNavbar({ role, title }: TopNavbarProps) {
  const profile = role === "admin" ? {
    name: adminProfile.name,
    initials: adminProfile.initials,
    email: adminProfile.email,
  } : role === "student" ? {
    name: studentProfile.name,
    initials: studentProfile.initials,
    email: studentProfile.email,
  } : {
    name: companyProfile.recruiterName,
    initials: companyProfile.recruiterInitials,
    email: "recruiter@google.com",
  };

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-5 gap-4 sticky top-0 z-20 shrink-0">
      
      {/* Student: Page Title */}
      {role === "student" && title && (
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
      )}

      {/* Company: Left-aligned Search (Takes up flex space) */}
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

      {/* Student: Center-aligned search (Optional based on layout) */}
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
        {role === "admin" ? null : role === "student" ? (
          <Link href="/ai-prep">
            <button className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white ai-gradient ai-glow hover:opacity-90 transition-opacity">
              <Sparkles className="size-3.5" />
              AI Tools
            </button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" className="gap-2 text-xs h-8 text-[#5B21B6] border-violet-200 bg-[#EDE9FE] hover:bg-[#DDD6FE] hover:text-[#4C1D95]">
            <Sparkles className="size-3.5" />
            AI Tools
          </Button>
        )}

        {/* Notifications */}
        {role === "student" ? (
          <Button variant="ghost" size="icon" className="size-8 relative">
            <Bell className="size-4" />
            <span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500 border-2 border-white" />
          </Button>
        ) : (
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#F43F5E]" />
          </button>
        )}

        {/* User Profile */}
        {role === "student" ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-lg hover:bg-accent transition-colors group cursor-pointer">
              <Avatar className="size-6">
                <AvatarFallback className="text-xs tracking-tight font-bold brand-gradient text-white">
                  {profile.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground hidden sm:block">{profile.name.split(" ")[0]}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {profile.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs gap-2">
                <User className="size-3.5" /> My Profile
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
        ) : role === "admin" ? (
          <Avatar className="size-7">
            <AvatarFallback className="text-xs tracking-tight font-bold bg-admin-slate text-white">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="size-7">
            <AvatarFallback className="text-xs tracking-tight font-bold brand-gradient text-white">
              {profile.initials}
            </AvatarFallback>
          </Avatar>
        )}

      </div>
    </header>
  );
}
