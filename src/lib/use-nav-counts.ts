"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export interface NavCounts {
  drivesCount?: number;
  applicationsCount?: number;
  companyDrivesCount?: number;
  companyApplicantsCount?: number;
}

export function dispatchDrivesUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("drives-updated"));
  }
}

export function dispatchApplicationsUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("applications-updated"));
  }
}

export function useNavCounts(role: "student" | "company" | "admin"): NavCounts {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NavCounts>({});

  useEffect(() => {
    if (!user || role === "admin") return;

    let isMounted = true;

    const fetchCounts = async () => {
      try {
        if (role === "student") {
          const [drivesRes, appsRes] = await Promise.allSettled([
            api.getDrives(),
            api.getMyApplications(),
          ]);

          if (!isMounted) return;

          const drives =
            drivesRes.status === "fulfilled" && Array.isArray(drivesRes.value)
              ? drivesRes.value.length
              : 0;
          const apps =
            appsRes.status === "fulfilled" && Array.isArray(appsRes.value)
              ? appsRes.value.length
              : 0;

          setCounts({
            drivesCount: drives,
            applicationsCount: apps,
          });
        } else if (role === "company") {
          const [drivesRes, analyticsRes] = await Promise.allSettled([
            api.getMyCompanyDrives(),
            api.getCompanyAnalytics(),
          ]);

          if (!isMounted) return;

          const companyDrives =
            drivesRes.status === "fulfilled" && Array.isArray(drivesRes.value)
              ? drivesRes.value.length
              : 0;
          const analytics =
            analyticsRes.status === "fulfilled" ? analyticsRes.value : null;

          setCounts({
            companyDrivesCount: companyDrives,
            companyApplicantsCount: analytics?.total_applicants ?? 0,
          });
        }
      } catch {
        // Silent fallback for network or auth transitions
      }
    };

    fetchCounts();

    const handleUpdate = () => {
      fetchCounts();
    };

    window.addEventListener("notifications-updated", handleUpdate);
    window.addEventListener("drives-updated", handleUpdate);
    window.addEventListener("applications-updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("notifications-updated", handleUpdate);
      window.removeEventListener("drives-updated", handleUpdate);
      window.removeEventListener("applications-updated", handleUpdate);
    };
  }, [user, role]);

  return counts;
}
