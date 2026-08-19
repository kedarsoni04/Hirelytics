"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, getToken, clearToken } from "./api";

// ── Types ──────────────────────────────────────────────────────────────────────

type StudentProfile = {
  id?: string;
  full_name?: string;
  college?: string;
  branch?: string;
  cgpa?: number;
  skills?: string[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
};

type CompanyProfile = {
  id?: string;
  company_name?: string;
  industry?: string;
};

/** Flat User type — profile fields hoisted to top level for convenience */
export type User = {
  id: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at: string;
  // Student fields (hoisted from student_profile)
  full_name?: string;
  college?: string;
  branch?: string;
  cgpa?: number;
  skills?: string[];
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  // Company fields (hoisted from company_profile)
  company_name?: string;
  industry?: string;
  // Raw nested objects still available if needed
  student_profile?: StudentProfile;
  company_profile?: CompanyProfile;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** Merge partial updates into the current user object immediately */
  updateUser: (partial: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helper: normalise the raw API response ─────────────────────────────────────

function normaliseUser(raw: any): User {
  const sp: StudentProfile = raw.student_profile ?? {};
  const cp: CompanyProfile = raw.company_profile ?? {};

  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    is_active: raw.is_active,
    created_at: raw.created_at,
    // Hoist student profile fields
    full_name: raw.full_name ?? sp.full_name,
    college: raw.college ?? sp.college,
    branch: raw.branch ?? sp.branch,
    cgpa: raw.cgpa ?? sp.cgpa,
    skills: raw.skills ?? sp.skills ?? [],
    linkedin_url: raw.linkedin_url ?? sp.linkedin_url,
    github_url: raw.github_url ?? sp.github_url,
    portfolio_url: raw.portfolio_url ?? sp.portfolio_url,
    resume_url: raw.resume_url ?? sp.resume_url,
    // Hoist company profile fields
    company_name: raw.company_name ?? cp.company_name,
    industry: raw.industry ?? cp.industry,
    // Keep raw nested objects
    student_profile: sp,
    company_profile: cp,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const token = getToken();
      if (token) {
        const raw = await api.getMe();
        setUser(normaliseUser(raw));
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn("Auth check failed:", error instanceof Error ? error.message : "Invalid token");
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay fetchUser by one microtask to avoid "synchronous setState in effect" warnings
    Promise.resolve().then(() => fetchUser());
  }, []);

  useEffect(() => {
    if (loading) return;

    const isStudentRoute = ["/dashboard", "/applications", "/resume", "/progress", "/resources", "/drives", "/profile", "/notifications", "/settings"].some(
      (route) => pathname?.startsWith(route)
    );
    const isCompanyRoute = pathname?.startsWith("/company");
    const isAdminRoute = pathname?.startsWith("/admin");
    const isAuthRoute = pathname === "/login" || pathname === "/signup";
    const isPublicRoute = pathname === "/" || isAuthRoute || pathname === "/design-system";

    if (!user && !isPublicRoute) {
      router.push("/login");
    } else if (user) {
      if (user.role === "student" && (isCompanyRoute || isAdminRoute)) {
        router.push("/dashboard");
      } else if (user.role === "company" && (isStudentRoute || isAdminRoute)) {
        router.push("/company/dashboard");
      } else if (user.role === "admin" && (isStudentRoute || isCompanyRoute)) {
        router.push("/admin/dashboard");
      } else if (isAuthRoute || pathname === "/") {
        router.push(
          user.role === "student" 
            ? "/dashboard" 
            : user.role === "company" 
            ? "/company/dashboard" 
            : "/admin/dashboard"
        );
      }
    }
  }, [user, loading, pathname, router]);

  const logout = () => {
    clearToken();
    setUser(null);
    router.push("/login");
  };

  const updateUser = (partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser: fetchUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
