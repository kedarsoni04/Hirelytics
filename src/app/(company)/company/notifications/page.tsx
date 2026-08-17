"use client";

import { useState } from "react";
import {
  Bell,
  Sparkles,
  Calendar,
  Send,
  Trophy,
  Settings,
  CheckCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { companyNotifications } from "@/lib/mock-data";

// ── Icon + color config per notification type ─────────────────────────────────

const notifConfig: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  ai_result: {
    icon: Sparkles,
    bg: "#EDE9FE",
    color: "#5B21B6",
    label: "AI Update",
  },
  interview: {
    icon: Calendar,
    bg: "#DBEAFE",
    color: "#1E40AF",
    label: "Interview",
  },
  application: {
    icon: Send,
    bg: "#EEF2FF",
    color: "#3730A3",
    label: "Applications",
  },
  offer: {
    icon: Trophy,
    bg: "#D1FAE5",
    color: "#065F46",
    label: "Offer",
  },
  system: {
    icon: Settings,
    bg: "#F1F5F9",
    color: "#475569",
    label: "System",
  },
};

export default function CompanyNotificationsPage() {
  const [items, setItems] = useState(companyNotifications);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const dismiss = (id: string) =>
    setItems((prev) => prev.filter((n) => n.id !== id));

  const groups = ["Today", "Earlier"] as const;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            className="gap-2 text-xs"
          >
            <CheckCheck className="size-3.5" /> Mark all as read
          </Button>
        )}
      </div>

      {/* Groups */}
      {groups.map((group) => {
        const groupItems = items.filter((n) => n.group === group);
        if (groupItems.length === 0) return null;

        return (
          <section key={group} className="space-y-2">
            <p className="text-xs tracking-tight font-bold uppercase tracking-widest text-muted-foreground px-1">
              {group}
            </p>

            <Card className="card-shadow border-border/60 overflow-hidden">
              <CardContent className="p-0">
                {groupItems.map((notif, i) => {
                  const cfg = notifConfig[notif.type] || notifConfig.system;
                  const Icon = cfg.icon;

                  return (
                    <div key={notif.id}>
                      {i > 0 && <Separator />}
                      <div
                        className={`flex items-start gap-4 px-5 py-4 transition-colors group relative ${
                          !notif.read
                            ? "bg-[#EEF2FF]/50 hover:bg-[#EEF2FF]/80"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        {/* Unread dot */}
                        {!notif.read && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 size-1.5 rounded-full bg-[#4F46E5]" />
                        )}

                        {/* Icon */}
                        <div
                          className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: cfg.bg }}
                        >
                          <Icon
                            className="size-4"
                            style={{ color: cfg.color }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm leading-snug ${
                                !notif.read
                                  ? "font-semibold text-foreground"
                                  : "font-medium text-foreground"
                              }`}
                            >
                              {notif.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs tracking-tight text-muted-foreground whitespace-nowrap">
                                {notif.timestamp}
                              </span>
                              <button
                                onClick={() => dismiss(notif.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {notif.body}
                          </p>
                          {/* Type badge */}
                          <span
                            className="inline-flex items-center gap-1 mt-2 px-1.5 py-0.5 rounded text-xs tracking-tight font-medium"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}
                          >
                            <Icon className="size-2.5" />
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </section>
        );
      })}

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bell className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No notifications</p>
          <p className="text-xs text-muted-foreground mt-1">
            You're all caught up.
          </p>
        </div>
      )}
    </div>
  );
}
