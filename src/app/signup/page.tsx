"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api, setToken } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  // Student fields
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [cgpa, setCgpa] = useState("");

  // Company fields
  const [companyName, setCompanyName] = useState("");

  const [error, setError] = useState("");
  const { refreshUser } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const payload: any = { email, password, role };
      if (role === "student") {
        payload.full_name = fullName;
        payload.college = college;
        payload.branch = branch;
        if (cgpa) payload.cgpa = parseFloat(cgpa);
      } else {
        payload.company_name = companyName;
      }

      const result = await api.signup(payload);
      setToken(result.access_token);
      await refreshUser(); // Context will redirect based on role
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && <div className="text-red-500 text-center text-sm">{error}</div>}

          {/* Role selector */}
          <div className="flex justify-center space-x-4 mb-4">
            <Button
              type="button"
              variant={role === "student" ? "default" : "outline"}
              onClick={() => setRole("student")}
            >
              Student
            </Button>
            <Button
              type="button"
              variant={role === "company" ? "default" : "outline"}
              onClick={() => setRole("company")}
            >
              Company
            </Button>
          </div>

          {/* Common fields */}
          <div className="rounded-md shadow-sm space-y-3">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <Input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Student-specific fields */}
            {role === "student" ? (
              <>
                <div>
                  <label htmlFor="fullName" className="sr-only">Full Name</label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="college" className="sr-only">College / University</label>
                  <Input
                    id="college"
                    name="college"
                    type="text"
                    required
                    placeholder="College / University"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="branch" className="sr-only">Branch / Department</label>
                  <Input
                    id="branch"
                    name="branch"
                    type="text"
                    required
                    placeholder="Branch / Department (e.g. CSE, ECE)"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="cgpa" className="sr-only">CGPA</label>
                  <Input
                    id="cgpa"
                    name="cgpa"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="CGPA (0–10)"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="companyName" className="sr-only">Company Name</label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <Button type="submit" className="w-full">
              Sign up
            </Button>
          </div>
        </form>
        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
