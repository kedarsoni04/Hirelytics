const fs = require('fs');

let content = fs.readFileSync('src/components/layout/TopNavbar.tsx', 'utf8');

// 1. Add adminProfile to import
content = content.replace('studentProfile, companyProfile', 'studentProfile, companyProfile, adminProfile');

// 2. Update interface
content = content.replace('role: "student" | "company";', 'role: "student" | "company" | "admin";');

// 3. Update profile mapping
content = content.replace(
  'const profile = role === "student" ? {',
  `const profile = role === "admin" ? {
    name: adminProfile.name,
    initials: adminProfile.initials,
    email: adminProfile.email,
  } : role === "student" ? {`
);

// 4. Update AI Tools and Notifications rendering (hide AI tools for admin)
content = content.replace(
  '{/* AI Tools */}',
  '{/* AI Tools */}' // keep placeholder
).replace(
  '{role === "student" ? (',
  '{role === "admin" ? null : role === "student" ? ('
);

// Note: The above replace for AI Tools is a bit tricky, let's just do it carefully.
// Original: 
//         {/* AI Tools */}
//         {role === "student" ? (

// Wait, I can just write a more exact replace.
content = content.replace(
  '        {/* AI Tools */}\n        {role === "student" ? (',
  '        {/* AI Tools */}\n        {role === "admin" ? null : role === "student" ? ('
);

fs.writeFileSync('src/components/layout/TopNavbar.tsx', content);
