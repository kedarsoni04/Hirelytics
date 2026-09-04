"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function dispatchNotificationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("notifications-updated"));
  }
}

export function useUnreadCount(enabled: boolean = true) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !enabled) return;

    const fetchUnread = () => {
      api
        .getUnreadNotificationCount()
        .then((res: any) => setUnreadCount(res.count ?? 0))
        .catch(() => {});
    };

    fetchUnread();
    window.addEventListener("notifications-updated", fetchUnread);
    return () => window.removeEventListener("notifications-updated", fetchUnread);
  }, [user, enabled]);

  return unreadCount;
}
