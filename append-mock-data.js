const fs = require('fs');

const adminData = `
// ─── Super Admin Mock Data ──────────────────────────────────────────────────

export const adminProfile = {
  name: "System Administrator",
  initials: "SA",
  email: "admin@hirelytics.com",
};

export const platformStats = [
  { label: "Total Companies", value: 142, icon: "building", trend: "+12 this month", trendUp: true },
  { label: "Registered Students", value: 18450, icon: "users", trend: "+840 this month", trendUp: true },
  { label: "Active Drives", value: 45, icon: "briefcase", trend: "+5 this week", trendUp: true },
  { label: "Total Placements", value: 1250, icon: "award", trend: "This month", trendUp: null },
];

export const platformActivity = [
  { id: "pa1", text: "New company registered: TechCorp", time: "1 hour ago", ai: false, type: "success" },
  { id: "pa2", text: "Drive published by InnovateX (SWE Intern)", time: "3 hours ago", ai: false, type: "default" },
  { id: "pa3", text: "AI flagged 3 suspicious assessment attempts during Google drive", time: "5 hours ago", ai: true, type: "warning" },
  { id: "pa4", text: "Company verification requested by Stellar Startups", time: "Yesterday", ai: false, type: "default" },
];

export const adminCompanies = [
  { id: "cmp1", name: "Google", industry: "Technology", status: "Verified", activeDrives: 2, joined: "Jan 2024", logo: "G" },
  { id: "cmp2", name: "Microsoft", industry: "Technology", status: "Verified", activeDrives: 1, joined: "Feb 2024", logo: "M" },
  { id: "cmp3", name: "Razorpay", industry: "FinTech", status: "Verified", activeDrives: 1, joined: "Mar 2024", logo: "R" },
  { id: "cmp4", name: "TechCorp", industry: "Software", status: "Pending", activeDrives: 0, joined: "Today", logo: "T" },
  { id: "cmp5", name: "Stellar Startups", industry: "Technology", status: "Pending", activeDrives: 0, joined: "Yesterday", logo: "S" },
  { id: "cmp6", name: "Swiggy", industry: "FoodTech", status: "Verified", activeDrives: 1, joined: "Apr 2024", logo: "S" },
  { id: "cmp7", name: "Global Consulting", industry: "Consulting", status: "Suspended", activeDrives: 0, joined: "Dec 2023", logo: "G" },
  { id: "cmp8", name: "Flipkart", industry: "E-Commerce", status: "Verified", activeDrives: 0, joined: "Jan 2024", logo: "F" },
];

export const adminStudents = [
  { id: "stu1", name: "Ananya Krishnan", college: "IIT Bombay", branch: "CSE", cgpa: 9.2, status: "Active", applications: 12 },
  { id: "stu2", name: "Rohan Mehta", college: "IIT Delhi", branch: "ECE", cgpa: 8.9, status: "Active", applications: 5 },
  { id: "stu3", name: "John Doe", college: "NIT Surathkal", branch: "Mechanical", cgpa: 7.1, status: "Flagged", applications: 14 },
  { id: "stu4", name: "Vikram Nair", college: "IIT Madras", branch: "CSE", cgpa: 8.7, status: "Active", applications: 8 },
  { id: "stu5", name: "Jane Smith", college: "Unknown College", branch: "CS", cgpa: 5.5, status: "Suspended", applications: 2 },
  { id: "stu6", name: "Preethi Suresh", college: "BITS Pilani", branch: "CS", cgpa: 9.5, status: "Active", applications: 3 },
  { id: "stu7", name: "Divya Menon", college: "VIT Vellore", branch: "CSE", cgpa: 8.4, status: "Active", applications: 7 },
  { id: "stu8", name: "Arjun Pillai", college: "IIT Kharagpur", branch: "ECE", cgpa: 8.2, status: "Flagged", applications: 18 },
];

export const platformLogs = [
  { id: "log1", timestamp: "2026-08-18 10:14:02", action: "Company Verified: Swiggy", user: "Admin (SA)", status: "Success" },
  { id: "log2", timestamp: "2026-08-18 09:30:15", action: "System Backup Initiated", user: "System", status: "In Progress" },
  { id: "log3", timestamp: "2026-08-17 18:45:00", action: "Flagged Student Account: John Doe", user: "AI Moderator", status: "Warning" },
  { id: "log4", timestamp: "2026-08-17 14:20:11", action: "Failed Login Attempt", user: "Unknown IP", status: "Failed" },
  { id: "log5", timestamp: "2026-08-16 11:10:05", action: "Suspended Company: Global Consulting", user: "Admin (SA)", status: "Success" },
];

export const platformAnalyticsData = {
  growth: [
    { month: "Jan", students: 12000, companies: 90 },
    { month: "Feb", students: 13500, companies: 105 },
    { month: "Mar", students: 15000, companies: 118 },
    { month: "Apr", students: 16200, companies: 125 },
    { month: "May", students: 17800, companies: 135 },
    { month: "Jun", students: 18450, companies: 142 },
  ],
  topCompanies: [
    { name: "Google", offers: 45 },
    { name: "Microsoft", offers: 38 },
    { name: "Amazon", offers: 32 },
    { name: "Goldman Sachs", offers: 28 },
    { name: "Razorpay", offers: 22 },
  ],
  stats: [
    { label: "Platform Placement Rate", value: "78%", icon: "trending-up" },
    { label: "Avg AI Match Accuracy", value: "94.2%", icon: "sparkles" },
    { label: "Total Assessments", value: "45,210", icon: "file-text" },
    { label: "AI Interviews Analyzed", value: "12,850", icon: "video" },
  ]
};
`;

fs.appendFileSync('src/lib/mock-data.ts', adminData);
