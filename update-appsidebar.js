const fs = require('fs');

let content = fs.readFileSync('src/components/layout/AppSidebar.tsx', 'utf8');

// 1. Add new icons to import
content = content.replace('Calendar,', 'Calendar,\n  ShieldCheck,\n  Building2,\n  GraduationCap,\n  Activity,\n  Settings2,');

// 2. Add adminProfile to mock-data import
content = content.replace('studentProfile, companyProfile', 'studentProfile, companyProfile, adminProfile');

// 3. Add adminNavItems array
const adminNavItemsStr = `
const adminNavItems: NavGroup[] = [
  {
    group: "Platform",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Building2, label: "Manage Companies", href: "/admin/companies" },
      { icon: GraduationCap, label: "Manage Students", href: "/admin/students" },
      { icon: Activity, label: "Platform Analytics", href: "/admin/analytics" },
    ],
  },
  {
    group: "System",
    items: [
      { icon: Settings2, label: "Settings & Logs", href: "/admin/settings" },
    ],
  },
];
`;
content = content.replace('interface AppSidebarProps', adminNavItemsStr + '\ninterface AppSidebarProps');

// 4. Update AppSidebarProps
content = content.replace('role: "student" | "company";', 'role: "student" | "company" | "admin";');

// 5. Update navItems logic
content = content.replace(
  'const navItems = role === "student" ? studentNavItems : companyNavItems;',
  'const navItems = role === "admin" ? adminNavItems : role === "student" ? studentNavItems : companyNavItems;'
);

// 6. Update profile logic
content = content.replace(
  'const profile = role === "student" ? {',
  `const profile = role === "admin" ? {
    name: adminProfile.name,
    roleOrBranch: "Super Admin",
    initials: adminProfile.initials,
  } : role === "student" ? {`
);

// 7. Update brand logic for admin (use a shield or special color)
content = content.replace(
  'const brand = role === "company" ? {',
  `const brand = role === "admin" ? {
    name: "Hirelytics Admin",
    initials: "HA",
    color: "#111827", // dark slate for admin
  } : role === "company" ? {`
);

// 8. Ensure admin uses the "company" style rendering (text-sidebar-foreground, etc.)
// Anywhere `role === "company"` or `role === "student"`, we need to adapt for `admin`.
// "role === "student"" checks are fine (meaning admin gets the company-like sidebar styles)
// But for the specific company AI badge, hide it for admin:
content = content.replace(
  '{/* AI Badge for Company */}',
  '{/* AI Badge for Company */}'
).replace(
  '{role === "company" && !collapsed && (',
  '{role === "company" && !collapsed && (' // Already good, admin won't show it
);

fs.writeFileSync('src/components/layout/AppSidebar.tsx', content);
