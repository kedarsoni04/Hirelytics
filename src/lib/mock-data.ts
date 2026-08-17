// ─── Mock data for the Student module ───────────────────────────────────────

export const studentProfile = {
  name: "Ananya Krishnan",
  initials: "AK",
  email: "ananya@iitb.ac.in",
  college: "IIT Bombay",
  branch: "B.Tech CSE",
  graduationYear: 2025,
  cgpa: 9.2,
  profileCompletion: 78,
  uid: "HL-2025-00482",
};

// ─── Stat cards ──────────────────────────────────────────────────────────────

export const studentStats = [
  { label: "Applications Sent", value: 12, icon: "send", trend: "+3 this week", trendUp: true },
  { label: "Shortlisted", value: 5, icon: "star", trend: "+2 this week", trendUp: true },
  { label: "Interviews Scheduled", value: 2, icon: "calendar", trend: "Next: Jan 22", trendUp: null },
  { label: "Offers Received", value: 1, icon: "trophy", trend: "🎉 Congratulations!", trendUp: null },
];

// ─── Recommended drives ──────────────────────────────────────────────────────

export const recommendedDrives = [
  {
    id: "drv-001",
    company: "Google",
    companyInitials: "G",
    companyColor: "#4285F4",
    role: "Software Engineer — Intern",
    package: "₹80,000/mo",
    location: "Bangalore, India",
    type: "Internship",
    deadline: "Jan 30, 2026",
    aiMatch: 92,
    eligibility: {
      cgpa: 7.5,
      branches: ["CSE", "ECE", "IT"],
      backlogs: false,
    },
    status: "live" as const,
    applicants: 342,
  },
  {
    id: "drv-002",
    company: "Microsoft",
    companyInitials: "M",
    companyColor: "#00A4EF",
    role: "Product Analyst — FTE",
    package: "₹24 LPA",
    location: "Hyderabad, India",
    type: "Full Time",
    deadline: "Feb 5, 2026",
    aiMatch: 85,
    eligibility: {
      cgpa: 7.0,
      branches: ["CSE", "ECE", "MBA"],
      backlogs: false,
    },
    status: "live" as const,
    applicants: 189,
  },
  {
    id: "drv-003",
    company: "Razorpay",
    companyInitials: "R",
    companyColor: "#2AAAE1",
    role: "Frontend Engineer — Intern",
    package: "₹60,000/mo",
    location: "Bangalore, India (Remote OK)",
    type: "Internship",
    deadline: "Jan 28, 2026",
    aiMatch: 79,
    eligibility: {
      cgpa: 6.5,
      branches: ["CSE", "IT", "IS"],
      backlogs: false,
    },
    status: "live" as const,
    applicants: 218,
  },
  {
    id: "drv-004",
    company: "Swiggy",
    companyInitials: "S",
    companyColor: "#FC8019",
    role: "Data Analyst — FTE",
    package: "₹18 LPA",
    location: "Bangalore, India",
    type: "Full Time",
    deadline: "Feb 12, 2026",
    aiMatch: 71,
    eligibility: {
      cgpa: 7.0,
      branches: ["CSE", "ECE", "Stats"],
      backlogs: true,
    },
    status: "upcoming" as const,
    applicants: 97,
  },
];

// ─── Recent activity ─────────────────────────────────────────────────────────

export const recentActivity = [
  {
    id: "act-1",
    type: "ai_screened",
    message: "Resume screened by AI — Strong match detected",
    company: "Google",
    timestamp: "2 hours ago",
    icon: "sparkles",
    color: "violet",
  },
  {
    id: "act-2",
    type: "shortlisted",
    message: "Shortlisted for Technical Round",
    company: "Microsoft",
    timestamp: "Yesterday, 4:30 PM",
    icon: "star",
    color: "success",
  },
  {
    id: "act-3",
    type: "assessment",
    message: "Online Assessment completed — Score: 87/100",
    company: "Google",
    timestamp: "2 days ago",
    icon: "check",
    color: "success",
  },
  {
    id: "act-4",
    type: "applied",
    message: "Application submitted successfully",
    company: "Razorpay",
    timestamp: "3 days ago",
    icon: "send",
    color: "indigo",
  },
  {
    id: "act-5",
    type: "viewed",
    message: "Profile viewed by recruiter",
    company: "Swiggy",
    timestamp: "4 days ago",
    icon: "eye",
    color: "muted",
  },
];

// ─── Drive detail (Google SWE Intern) ────────────────────────────────────────

export const driveDetail = {
  id: "drv-001",
  company: "Google",
  companyInitials: "G",
  companyColor: "#4285F4",
  companyTagline: "Organizing the world's information, universally accessible.",
  role: "Software Engineer — Intern",
  package: "₹80,000/mo",
  location: "Bangalore, India",
  type: "Internship",
  duration: "6 months",
  deadline: "January 30, 2026",
  openings: 25,
  applicants: 342,
  aiMatch: 92,
  status: "live" as const,

  eligibility: {
    cgpa: 7.5,
    branches: ["Computer Science", "Electronics & Communication", "Information Technology"],
    graduation: ["2025", "2026"],
    backlogs: false,
    skills: ["Data Structures", "Algorithms", "One of: Python / Java / C++"],
  },

  description: `
## About the Role

Google's Engineering Internship program gives you an opportunity to work on real products that impact billions of users. As a Software Engineer Intern, you will be embedded in one of our product teams and work alongside experienced engineers on meaningful, production-level projects.

## What You'll Do

- Design and implement new product features end-to-end
- Write high-quality, well-tested, well-documented code
- Participate in code reviews and contribute to engineering best practices
- Collaborate closely with product managers, designers, and other engineers
- Present your work to the team at the end of your internship

## What We Look For

- Strong fundamentals in Data Structures and Algorithms
- Excellent problem-solving skills
- Curiosity, humility, and a collaborative mindset
- Experience with large codebases is a plus
- Prior internship or open-source contributions are a plus
  `,

  selectionProcess: [
    { step: 1, label: "Resume Screening", sublabel: "AI-powered shortlisting", status: "completed" },
    { step: 2, label: "Online Assessment", sublabel: "90-min DSA test on HackerEarth", status: "completed" },
    { step: 3, label: "Technical Round 1", sublabel: "Data Structures & Algorithms", status: "active" },
    { step: 4, label: "Technical Round 2", sublabel: "System Design & Problem Solving", status: "upcoming" },
    { step: 5, label: "HR Round", sublabel: "Culture fit & compensation", status: "upcoming" },
    { step: 6, label: "Offer", sublabel: "Decision & onboarding", status: "upcoming" },
  ],

  perks: ["Pre-placement Offer (PPO) possible", "MacBook Pro provided", "Housing allowance", "Google campus access", "Mentorship by senior engineers"],
};

// ─── Applications ─────────────────────────────────────────────────────────────

export type AppStage =
  | "applied"
  | "ai_screened"
  | "assessment"
  | "interview"
  | "shortlisted"
  | "offer"
  | "rejected"
  | "withdrawn";

export const applications = [
  {
    id: "app-001",
    driveId: "drv-001",
    company: "Google",
    companyInitials: "G",
    companyColor: "#4285F4",
    role: "Software Engineer — Intern",
    type: "Internship",
    appliedDate: "Jan 15, 2026",
    stage: "interview" as AppStage,
    nextAction: "Technical Round 1 — Jan 22, 10:00 AM",
    aiScore: 92,
    package: "₹80,000/mo",
  },
  {
    id: "app-002",
    driveId: "drv-002",
    company: "Microsoft",
    companyInitials: "M",
    companyColor: "#00A4EF",
    role: "Product Analyst — FTE",
    type: "Full Time",
    appliedDate: "Jan 12, 2026",
    stage: "shortlisted" as AppStage,
    nextAction: "Awaiting interview schedule",
    aiScore: 85,
    package: "₹24 LPA",
  },
  {
    id: "app-003",
    driveId: "drv-003",
    company: "Razorpay",
    companyInitials: "R",
    companyColor: "#2AAAE1",
    role: "Frontend Engineer — Intern",
    type: "Internship",
    appliedDate: "Jan 10, 2026",
    stage: "assessment" as AppStage,
    nextAction: "Complete online test by Jan 25",
    aiScore: 79,
    package: "₹60,000/mo",
  },
  {
    id: "app-004",
    driveId: "drv-special",
    company: "Stripe",
    companyInitials: "S",
    companyColor: "#635BFF",
    role: "Backend Engineer — Intern",
    type: "Internship",
    appliedDate: "Jan 8, 2026",
    stage: "offer" as AppStage,
    nextAction: "Accept or decline by Jan 30",
    aiScore: 94,
    package: "₹1,20,000/mo",
  },
  {
    id: "app-005",
    driveId: "drv-005",
    company: "Swiggy",
    companyInitials: "S",
    companyColor: "#FC8019",
    role: "Data Analyst — FTE",
    type: "Full Time",
    appliedDate: "Jan 5, 2026",
    stage: "ai_screened" as AppStage,
    nextAction: "Waiting for assessment link",
    aiScore: 71,
    package: "₹18 LPA",
  },
  {
    id: "app-006",
    driveId: "drv-006",
    company: "Flipkart",
    companyInitials: "F",
    companyColor: "#2874F0",
    role: "SDE-1 — FTE",
    type: "Full Time",
    appliedDate: "Dec 28, 2025",
    stage: "rejected" as AppStage,
    nextAction: null,
    aiScore: 68,
    package: "₹20 LPA",
  },
  {
    id: "app-007",
    driveId: "drv-007",
    company: "Ola",
    companyInitials: "O",
    companyColor: "#0FD467",
    role: "ML Engineer — Intern",
    type: "Internship",
    appliedDate: "Dec 20, 2025",
    stage: "applied" as AppStage,
    nextAction: "Application under review",
    aiScore: 76,
    package: "₹50,000/mo",
  },
  {
    id: "app-008",
    driveId: "drv-008",
    company: "PhonePe",
    companyInitials: "P",
    companyColor: "#5F259F",
    role: "Android Developer — Intern",
    type: "Internship",
    appliedDate: "Dec 15, 2025",
    stage: "withdrawn" as AppStage,
    nextAction: null,
    aiScore: 62,
    package: "₹55,000/mo",
  },
];

// ─── Online Assessment ────────────────────────────────────────────────────────

export type QuestionStatus = "answered" | "unanswered" | "flagged";

export const assessmentMeta = {
  id: "asmt-001",
  company: "Google",
  role: "Software Engineer — Intern",
  totalQuestions: 20,
  durationMinutes: 90,
  currentQuestion: 4,
  initialSecondsRemaining: 1452, // 24:12
};

export type MCQOption = { id: string; text: string };

export const sampleQuestion = {
  id: "q4",
  number: 4,
  section: "Data Structures",
  difficulty: "Medium" as const,
  text: "Given a binary tree, write an algorithm to find the maximum depth (height) of the tree. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.\n\nFor example, given the following tree:\n\n    3\n   / \\\n  9  20\n    /  \\\n   15   7\n\nThe maximum depth is 3.",
  options: [
    { id: "a", text: "Use DFS recursion: return 1 + max(maxDepth(left), maxDepth(right)), base case returns 0 for null nodes." },
    { id: "b", text: "Use BFS with a queue, count levels as you process each level until the queue is empty." },
    { id: "c", text: "Both A and B are correct approaches with O(n) time complexity and different space complexities." },
    { id: "d", text: "Use a stack-based iterative DFS, tracking depth at each node and returning the global maximum." },
  ] as MCQOption[],
  correctOption: "c",
};

// Palette: which question numbers are answered, unanswered, or current
export const questionPalette: Record<number, QuestionStatus> = {
  1: "answered", 2: "answered", 3: "answered", 5: "answered",
  6: "answered", 7: "unanswered", 8: "answered", 9: "unanswered",
  10: "unanswered", 11: "answered", 12: "answered", 13: "flagged",
  14: "unanswered", 15: "answered", 16: "unanswered", 17: "answered",
  18: "unanswered", 19: "unanswered", 20: "unanswered",
};

// ─── AI Video Interview ───────────────────────────────────────────────────────

export const interviewMeta = {
  id: "intv-001",
  company: "Google",
  role: "Software Engineer — Intern",
  totalQuestions: 5,
  currentQuestion: 3,
  answerTimeMinutes: 2,
};

export const interviewQuestions = [
  {
    id: "iq1",
    number: 1,
    text: "Tell me about yourself and what excites you about this Software Engineer Intern role at Google.",
    category: "Introduction",
    tip: "Keep it to 90 seconds. Focus on your technical journey and one specific project.",
    answered: true,
  },
  {
    id: "iq2",
    number: 2,
    text: "Describe a challenging technical problem you solved during your previous internship or a project. What was your approach?",
    category: "Behavioral",
    tip: "Use the STAR method: Situation, Task, Action, Result.",
    answered: true,
  },
  {
    id: "iq3",
    number: 3,
    text: "How would you design a URL shortening service like bit.ly? Walk me through your high-level system design.",
    category: "System Design",
    tip: "Start with requirements, then discuss components: API, database, hashing, caching.",
    answered: false,
  },
  {
    id: "iq4",
    number: 4,
    text: "What is your experience with distributed systems, and how have you handled data consistency challenges?",
    category: "Technical",
    tip: "Mention CAP theorem, eventual consistency, or any relevant experience.",
    answered: false,
  },
  {
    id: "iq5",
    number: 5,
    text: "Where do you see yourself in 5 years, and how does this internship align with your career goals?",
    category: "Career",
    tip: "Be specific about your interest in large-scale systems or ML infrastructure.",
    answered: false,
  },
];

// ─── Resume Builder ──────────────────────────────────────────────────────────

export const resumeData = {
  personal: {
    name: "Ananya Krishnan",
    title: "Software Engineer",
    email: "ananya@iitb.ac.in",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/ananyakrishnan",
    github: "github.com/ananya-k",
    location: "Mumbai, Maharashtra",
    summary:
      "Final year B.Tech Computer Science student at IIT Bombay with a CGPA of 9.2/10. Experienced in full-stack development and machine learning. Passionate about building scalable systems and contributing to open source.",
  },
  education: [
    {
      institution: "Indian Institute of Technology Bombay",
      degree: "B.Tech — Computer Science & Engineering",
      period: "Aug 2021 – May 2025",
      score: "CGPA: 9.2 / 10",
    },
    {
      institution: "Delhi Public School, New Delhi",
      degree: "Higher Secondary (XII) — Science (PCM+CS)",
      period: "2019 – 2021",
      score: "95.4%",
    },
  ],
  experience: [
    {
      company: "Razorpay",
      role: "Software Engineer Intern",
      period: "May 2024 – Jul 2024",
      location: "Bangalore, India",
      bullets: [
        "Built a real-time payment analytics dashboard using React and WebSockets, reducing report load time by 40%.",
        "Refactored the payment retry logic in Go, improving success rate by 12% for high-failure merchants.",
        "Wrote comprehensive unit and integration tests achieving 90% code coverage for the billing module.",
      ],
    },
  ],
  skills: {
    languages: ["Python", "Java", "TypeScript", "Go", "SQL", "C++"],
    frameworks: ["React", "Next.js", "Node.js", "FastAPI", "PyTorch"],
    tools: ["Git", "Docker", "Kubernetes", "PostgreSQL", "Redis", "AWS"],
  },
  projects: [
    {
      name: "CollegeConnect",
      tech: "Next.js · FastAPI · PostgreSQL · Redis",
      period: "Jan 2024 – Present",
      link: "github.com/ananya-k/collegeconnect",
      bullets: [
        "Built a campus social platform with 2,000+ active users across IIT Bombay with real-time chat via WebSockets.",
        "Implemented Redis-based session caching reducing auth latency from 200ms to 18ms.",
      ],
    },
    {
      name: "SmartResume AI",
      tech: "Python · LangChain · React · OpenAI API",
      period: "Sep 2023 – Dec 2023",
      link: "github.com/ananya-k/smartresume",
      bullets: [
        "Fine-tuned GPT-3.5 to parse and score resumes against job descriptions with 87% accuracy.",
        "Deployed as a Vercel app used by 500+ students during campus placements.",
      ],
    },
  ],
  achievements: [
    "Winner — HackIITB 2024 (Best FinTech Hack, 400+ participants)",
    "Google Summer of Code 2024 — Contributor at TensorFlow",
    "AIR 342 — IIT JEE Advanced 2021",
    "Open source contributions: 3 merged PRs in Next.js repository",
  ],
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotifType = "application" | "ai_result" | "interview" | "offer" | "system";

export const notifications = [
  // Today group
  {
    id: "n1",
    type: "offer" as NotifType,
    title: "🎉 Offer Received from Stripe",
    body: "Congratulations! Stripe has extended an offer for the Backend Engineer Intern role. Accept or decline by Jan 30.",
    timestamp: "2 hours ago",
    read: false,
    group: "Today",
  },
  {
    id: "n2",
    type: "interview" as NotifType,
    title: "Interview Reminder — Google",
    body: "Your Technical Round 1 for Google SWE Intern is scheduled for tomorrow, Jan 22 at 10:00 AM. Join link sent to your email.",
    timestamp: "4 hours ago",
    read: false,
    group: "Today",
  },
  {
    id: "n3",
    type: "ai_result" as NotifType,
    title: "AI Resume Analysis Complete ✦",
    body: "Your resume has been analyzed for the Google drive. AI Match Score: 92%. View detailed feedback and suggested improvements.",
    timestamp: "6 hours ago",
    read: false,
    group: "Today",
  },
  {
    id: "n4",
    type: "application" as NotifType,
    title: "Application Shortlisted — Microsoft",
    body: "Great news! Your application for Product Analyst (FTE) at Microsoft has been shortlisted. Interview scheduling in progress.",
    timestamp: "9 hours ago",
    read: true,
    group: "Today",
  },
  // Earlier group
  {
    id: "n5",
    type: "application" as NotifType,
    title: "Application Submitted — Razorpay",
    body: "Your application for Frontend Engineer Intern at Razorpay was submitted successfully. You will hear back within 5 business days.",
    timestamp: "Jan 15, 2026",
    read: true,
    group: "Earlier",
  },
  {
    id: "n6",
    type: "ai_result" as NotifType,
    title: "Assessment Score Ready — Google ✦",
    body: "Your online assessment for Google has been evaluated. Score: 87/100 (Top 20%). You have been moved to the next round.",
    timestamp: "Jan 14, 2026",
    read: true,
    group: "Earlier",
  },
  {
    id: "n7",
    type: "system" as NotifType,
    title: "Profile Completion Reminder",
    body: "Your profile is 78% complete. Adding a Projects section could increase your AI match score by up to 8 points.",
    timestamp: "Jan 13, 2026",
    read: true,
    group: "Earlier",
  },
  {
    id: "n8",
    type: "application" as NotifType,
    title: "Application Rejected — Flipkart",
    body: "After careful review, Flipkart has decided not to move forward with your SDE-1 application at this time. Best of luck!",
    timestamp: "Jan 10, 2026",
    read: true,
    group: "Earlier",
  },
];

// ─── Profile (extended) ────────────────────────────────────────────────────────

export const studentProfileExtended = {
  name: "Ananya Krishnan",
  initials: "AK",
  email: "ananya@iitb.ac.in",
  phone: "+91 98765 43210",
  college: "Indian Institute of Technology Bombay",
  branch: "B.Tech Computer Science & Engineering",
  graduationYear: "May 2025",
  cgpa: 9.2,
  uid: "HL-2025-00482",
  bio: "Final year CSE student at IIT Bombay. Passionate about scalable systems, full-stack development and open source. Currently exploring opportunities in software engineering and product roles.",
  location: "Mumbai, Maharashtra",

  links: {
    linkedin: "linkedin.com/in/ananyakrishnan",
    github: "github.com/ananya-k",
    portfolio: "ananyakrishnan.dev",
  },

  education: [
    {
      institution: "IIT Bombay",
      degree: "B.Tech — Computer Science & Engineering",
      period: "Aug 2021 – May 2025",
      score: "CGPA: 9.2 / 10",
    },
    {
      institution: "Delhi Public School, New Delhi",
      degree: "Higher Secondary (XII) — Science",
      period: "2019 – 2021",
      score: "95.4%",
    },
  ],

  skills: [
    "Python", "TypeScript", "Java", "Go", "C++",
    "React", "Next.js", "Node.js", "FastAPI",
    "PostgreSQL", "Redis", "Docker", "AWS",
    "Data Structures", "System Design", "Machine Learning",
  ],

  resume: {
    fileName: "Ananya_Krishnan_Resume_2025.pdf",
    uploadedAt: "Jan 12, 2026",
    aiScore: 82,
    status: "verified" as const,
  },
};

// ─── Company / Recruiter Mock Data ────────────────────────────────────────────

export const companyProfile = {
  name: "Google",
  initials: "G",
  color: "#4285F4",
  tagline: "Organizing the world's information",
  recruiterName: "Priya Sharma",
  recruiterRole: "Campus Recruiter",
  recruiterInitials: "PS",
  email: "priya.sharma@google.com",
};

export type DriveStatus = "draft" | "live" | "closed";

export const companyDrives = [
  { id: "drv-001", role: "Software Engineer — Intern", type: "Internship", package: "₹80,000/mo", location: "Bangalore", status: "live" as DriveStatus, deadline: "Jan 30, 2026", openings: 25, applicants: 342, shortlisted: 48, assessmentCompleted: 210, postedOn: "Jan 5, 2026" },
  { id: "drv-002", role: "Product Analyst — FTE", type: "Full Time", package: "₹24 LPA", location: "Hyderabad", status: "live" as DriveStatus, deadline: "Feb 5, 2026", openings: 10, applicants: 189, shortlisted: 22, assessmentCompleted: 130, postedOn: "Jan 8, 2026" },
  { id: "drv-003", role: "UX Designer — Intern", type: "Internship", package: "₹60,000/mo", location: "Bangalore", status: "draft" as DriveStatus, deadline: "Feb 15, 2026", openings: 5, applicants: 0, shortlisted: 0, assessmentCompleted: 0, postedOn: "Jan 18, 2026" },
  { id: "drv-004", role: "Data Scientist — FTE", type: "Full Time", package: "₹28 LPA", location: "Bangalore", status: "closed" as DriveStatus, deadline: "Dec 31, 2025", openings: 8, applicants: 423, shortlisted: 30, assessmentCompleted: 310, postedOn: "Nov 10, 2025" },
];

export const companyStats = [
  { label: "Active Drives", value: 2, icon: "briefcase", trend: "+1 this month", trendUp: true },
  { label: "Total Applicants", value: 954, icon: "users", trend: "+312 this week", trendUp: true },
  { label: "AI Shortlisted", value: 100, icon: "sparkles", trend: "10.5% accept rate", trendUp: null },
  { label: "Offers Extended", value: 3, icon: "handshake", trend: "Across 2 drives", trendUp: null },
];

export const companyActivity = [
  { id: "a1", text: "AI shortlisted 48 candidates for Software Engineer Intern", time: "2 hours ago", ai: true },
  { id: "a2", text: "210 students completed the online assessment for SWE Intern", time: "3 hours ago", ai: false },
  { id: "a3", text: "AI ranked candidates for Product Analyst drive — 22 shortlisted", time: "Yesterday", ai: true },
  { id: "a4", text: "Drive \"UX Designer — Intern\" saved as draft", time: "Yesterday", ai: false },
  { id: "a5", text: "AI flagged 3 candidates with anomalous assessment behavior", time: "2 days ago", ai: true },
  { id: "a6", text: "130 students started Product Analyst assessment", time: "2 days ago", ai: false },
];

export type CandidateStage = "applied" | "ai_screened" | "assessment" | "interview" | "shortlisted" | "offer" | "rejected";

export const candidates = [
  { id: "c1", name: "Ananya Krishnan", initials: "AK", college: "IIT Bombay", branch: "CSE", cgpa: 9.2, aiScore: 94, stage: "interview" as CandidateStage, appliedDate: "Jan 15" },
  { id: "c2", name: "Rohan Mehta", initials: "RM", college: "IIT Delhi", branch: "ECE", cgpa: 8.9, aiScore: 91, stage: "shortlisted" as CandidateStage, appliedDate: "Jan 14" },
  { id: "c3", name: "Preethi Suresh", initials: "PS", college: "BITS Pilani", branch: "CS", cgpa: 9.5, aiScore: 89, stage: "assessment" as CandidateStage, appliedDate: "Jan 13" },
  { id: "c4", name: "Vikram Nair", initials: "VN", college: "IIT Madras", branch: "CSE", cgpa: 8.7, aiScore: 87, stage: "interview" as CandidateStage, appliedDate: "Jan 12" },
  { id: "c5", name: "Shreya Gupta", initials: "SG", college: "NIT Trichy", branch: "IT", cgpa: 8.6, aiScore: 83, stage: "shortlisted" as CandidateStage, appliedDate: "Jan 12" },
  { id: "c6", name: "Karthik Raman", initials: "KR", college: "IIIT Hyderabad", branch: "CSE", cgpa: 9.1, aiScore: 80, stage: "ai_screened" as CandidateStage, appliedDate: "Jan 11" },
  { id: "c7", name: "Divya Menon", initials: "DM", college: "VIT Vellore", branch: "CSE", cgpa: 8.4, aiScore: 76, stage: "ai_screened" as CandidateStage, appliedDate: "Jan 11" },
  { id: "c8", name: "Arjun Pillai", initials: "AP", college: "IIT Kharagpur", branch: "ECE", cgpa: 8.2, aiScore: 72, stage: "applied" as CandidateStage, appliedDate: "Jan 10" },
  { id: "c9", name: "Sneha Joshi", initials: "SJ", college: "DTU Delhi", branch: "CS", cgpa: 7.9, aiScore: 68, stage: "rejected" as CandidateStage, appliedDate: "Jan 10" },
  { id: "c10", name: "Nikhil Bhat", initials: "NB", college: "Manipal University", branch: "IT", cgpa: 7.6, aiScore: 61, stage: "applied" as CandidateStage, appliedDate: "Jan 9" },
];

// ─── Company Notifications ──────────────────────────────────────────────────

export const companyNotifications = [
  {
    id: "cn1",
    type: "ai_result",
    title: "AI Analysis Complete ✦",
    body: "AI has finished evaluating 45 new applications for the Software Engineer Intern role. 12 candidates were shortlisted.",
    timestamp: "1 hour ago",
    read: false,
    group: "Today",
  },
  {
    id: "cn2",
    type: "interview",
    title: "Interview Reminder",
    body: "You have a scheduled Technical HR Round with Ananya Krishnan in 1 hour.",
    timestamp: "2 hours ago",
    read: false,
    group: "Today",
  },
  {
    id: "cn3",
    type: "application",
    title: "New Applicants",
    body: "You have received 25 new applications for the Product Analyst (FTE) role since yesterday.",
    timestamp: "5 hours ago",
    read: false,
    group: "Today",
  },
  {
    id: "cn4",
    type: "offer",
    title: "Offer Accepted",
    body: "Rohan Mehta has accepted your offer for the Software Engineer Intern role. Onboarding process initiated.",
    timestamp: "Yesterday",
    read: true,
    group: "Earlier",
  },
  {
    id: "cn5",
    type: "system",
    title: "Drive Expiring Soon",
    body: "Your active drive 'UX Designer — Intern' will automatically close in 2 days. Extend the deadline if needed.",
    timestamp: "Jan 15, 2026",
    read: true,
    group: "Earlier",
  },
  {
    id: "cn6",
    type: "ai_result",
    title: "AI Video Insights Ready ✦",
    body: "AI has generated behavioral insights from the video interviews of 8 shortlisted candidates.",
    timestamp: "Jan 14, 2026",
    read: true,
    group: "Earlier",
  },
];

// ─── Analytics Mock Data ────────────────────────────────────────────────────

export const analyticsData = {
  applicantsPerDrive: [
    { name: "SWE Intern", applicants: 342 },
    { name: "Product Analyst", applicants: 189 },
    { name: "Data Scientist", applicants: 423 },
    { name: "UX Intern", applicants: 5 },
  ],
  funnelData: [
    { stage: "Applied", count: 954 },
    { stage: "AI Screened", count: 820 },
    { stage: "Assessed", count: 650 },
    { stage: "Shortlisted", count: 100 },
    { stage: "Interviewed", count: 45 },
    { stage: "Offered", count: 3 },
  ]
};

// ─── Offer Pipeline Initial State ───────────────────────────────────────────

export const initialPipeline = {
  shortlisted: [
    { id: "c2", name: "Rohan Mehta", initials: "RM", role: "SWE Intern", aiScore: 91 },
    { id: "c5", name: "Shreya Gupta", initials: "SG", role: "Product Analyst", aiScore: 83 },
    { id: "c7", name: "Divya Menon", initials: "DM", role: "Data Scientist", aiScore: 76 },
  ],
  interviewed: [
    { id: "c1", name: "Ananya Krishnan", initials: "AK", role: "SWE Intern", aiScore: 94 },
    { id: "c4", name: "Vikram Nair", initials: "VN", role: "SWE Intern", aiScore: 87 },
  ],
  offered: [
    { id: "c3", name: "Preethi Suresh", initials: "PS", role: "Product Analyst", aiScore: 89 },
  ],
  hired: [
    { id: "c12", name: "Amit Kumar", initials: "AK", role: "Data Scientist", aiScore: 92 },
  ]
};

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
