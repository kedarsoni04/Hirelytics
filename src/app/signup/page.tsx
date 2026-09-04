"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, setToken } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, GraduationCap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "company">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Student fields
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (role === "student") {
      if (!fullName.trim()) {
        setError("Full Name is required");
        return;
      }
      if (!college.trim()) {
        setError("College / University is required");
        return;
      }
      if (!branch.trim()) {
        setError("Branch / Department is required");
        return;
      }
      if (cgpa && (parseFloat(cgpa) < 0 || parseFloat(cgpa) > 10)) {
        setError("CGPA must be between 0 and 10");
        return;
      }
    } else {
      if (!companyName.trim()) {
        setError("Company Name is required");
        return;
      }
      if (!industry.trim()) {
        setError("Industry is required");
        return;
      }
    }

    try {
      setLoading(true);
      const payload: any = {
        email: trimmedEmail,
        password,
        role,
      };

      if (role === "student") {
        payload.full_name = fullName.trim();
        payload.college = college.trim();
        payload.branch = branch.trim();
        if (cgpa) payload.cgpa = parseFloat(cgpa);
      } else {
        payload.company_name = companyName.trim();
        payload.industry = industry.trim();
      }

      const result = await api.signup(payload);
      setToken(result.access_token);
      await refreshUser(); // Context will redirect based on role
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Join Hirelytics to streamline your campus recruitment journey
          </p>
        </div>

        {/* Role toggle */}
        <div className="grid grid-cols-2 p-1 bg-muted rounded-xl gap-1">
          <button
            type="button"
            onClick={() => {
              setRole("student");
              setError("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
              role === "student"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GraduationCap className="size-4" /> Student
          </button>
          <button
            type="button"
            onClick={() => {
              setRole("company");
              setError("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all",
              role === "company"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="size-4" /> Company
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Common fields */}
          <div className="space-y-3.5">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-foreground mb-1">
                {role === "company" ? "Work Email Address" : "Email Address"} <span className="text-rose-500">*</span>
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder={role === "company" ? "recruiter@company.com" : "student@university.edu"}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-foreground mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>

            {/* Student-specific fields */}
            {role === "student" && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-foreground mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="college" className="block text-xs font-semibold text-foreground mb-1">
                      College / University <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="college"
                      name="college"
                      type="text"
                      required
                      placeholder="e.g. Stanford University"
                      value={college}
                      onChange={(e) => {
                        setCollege(e.target.value);
                        if (error) setError("");
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="branch" className="block text-xs font-semibold text-foreground mb-1">
                      Branch / Major <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="branch"
                      name="branch"
                      type="text"
                      required
                      placeholder="e.g. Computer Science"
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value);
                        if (error) setError("");
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cgpa" className="block text-xs font-semibold text-foreground mb-1">
                    CGPA / GPA (out of 10)
                  </label>
                  <Input
                    id="cgpa"
                    name="cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.75"
                    value={cgpa}
                    onChange={(e) => {
                      setCgpa(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>
              </>
            )}

            {/* Company-specific fields */}
            {role === "company" && (
              <>
                <div>
                  <label htmlFor="companyName" className="block text-xs font-semibold text-foreground mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="industry" className="block text-xs font-semibold text-foreground mb-1">
                    Industry / Domain <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="industry"
                    name="industry"
                    type="text"
                    required
                    placeholder="e.g. Software & Technology, Fintech, Healthcare"
                    value={industry}
                    onChange={(e) => {
                      setIndustry(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full brand-gradient text-white font-semibold h-10">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Creating Account…
                </>
              ) : (
                `Sign up as ${role === "student" ? "Student" : "Company"}`
              )}
            </Button>
          </div>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
