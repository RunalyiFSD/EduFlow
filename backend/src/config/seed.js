const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedDatabase = async () => {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  console.log('Seeding MongoDB with default data...');

  // ── Users ────────────────────────────────────────────────────────
  const [admin, instructor, student] = await User.create([
    {
      name: 'System Administrator',
      email: 'admin@eduflow.com',
      password: await bcrypt.hash('password', 10),
      role: 'admin',
      isApproved: true
    },
    {
      name: 'Jane Doe',
      email: 'instructor@eduflow.com',
      password: await bcrypt.hash('password', 10),
      role: 'instructor',
      isApproved: true
    },
    {
      name: 'Alex Smith',
      email: 'student@eduflow.com',
      password: await bcrypt.hash('password', 10),
      role: 'student',
      isApproved: true
    }
  ]);

  // ── Courses ──────────────────────────────────────────────────────
  // Each course gets a pre-generated ObjectId so it's deterministic
  const courseIds = Array.from({ length: 8 }, () => new mongoose.Types.ObjectId());

  const courses = await Course.create([
    {
      _id: courseIds[0],
      title: 'React Fundamentals',
      description: 'Learn the core concepts of React from scratch — components, state, props, hooks, context, and client-side routing. Perfect for beginners ready to build modern UIs.',
      category: 'Development',
      level: 'Beginner',
      price: 0,
      coverImageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      modules: [
        { title: 'Introduction to React',     type: 'video',    content: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', durationMinutes: 10 },
        { title: 'JSX and Components',         type: 'document', content: 'JSX is a syntax extension to JavaScript that lets you write HTML-like markup inside a JavaScript file.', durationMinutes: 15 },
        { title: 'Props and State',            type: 'video',    content: 'https://www.youtube.com/watch?v=Ke90Tje7VS0', durationMinutes: 20 },
        { title: 'Handling Events',            type: 'document', content: 'React events are named using camelCase and handled via JSX attributes rather than HTML attributes.', durationMinutes: 12 },
        { title: 'React Hooks Deep Dive',      type: 'video',    content: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', durationMinutes: 25 },
        { title: 'React Router & Navigation',  type: 'document', content: 'React Router enables client-side navigation in single-page applications without full page reloads.', durationMinutes: 18 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[1],
      title: 'Advanced CSS Grid & Flexbox',
      description: 'Master modern CSS layout techniques. Build pixel-perfect responsive designs using CSS Grid, Flexbox, custom properties, and animations used by top-tier design teams.',
      category: 'Design',
      level: 'Intermediate',
      price: 999,
      coverImageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800',
      modules: [
        { title: 'Flexbox vs Grid: When to Use Each',  type: 'video',    content: 'https://www.youtube.com/watch?v=hs3piaN4b5I', durationMinutes: 15 },
        { title: 'CSS Grid Deep Dive',                  type: 'document', content: 'CSS Grid is a two-dimensional layout system that lets you control rows and columns simultaneously.', durationMinutes: 25 },
        { title: 'Responsive Design Patterns',          type: 'video',    content: 'https://www.youtube.com/watch?v=srvUrASNj0s', durationMinutes: 20 },
        { title: 'CSS Animations & Transitions',        type: 'document', content: 'CSS transitions and keyframe animations can bring interfaces to life without JavaScript.', durationMinutes: 18 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[2],
      title: 'Business Analytics 101',
      description: 'Understand data-driven decision making, KPI frameworks, dashboarding with real tools, and how analytics teams operate inside modern businesses.',
      category: 'Business',
      level: 'Beginner',
      price: 1499,
      coverImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      modules: [
        { title: 'What is Business Analytics?',      type: 'video',    content: 'https://www.youtube.com/watch?v=y8Yv4_t1_Gk', durationMinutes: 18 },
        { title: 'Key Metrics & KPIs',               type: 'document', content: 'KPIs (Key Performance Indicators) are quantifiable measurements that reflect the critical success factors of an organization.', durationMinutes: 20 },
        { title: 'Dashboards with Google Looker',    type: 'video',    content: 'https://www.youtube.com/watch?v=6FTUpceqWnc', durationMinutes: 30 },
        { title: 'Presenting Data to Stakeholders',  type: 'document', content: 'Effective data storytelling requires choosing the right chart type, simplifying complexity, and leading with insights not data.', durationMinutes: 15 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[3],
      title: 'Node.js & Express Backend',
      description: 'Build production-ready REST APIs using Node.js and Express. Covers middleware, authentication with JWT, MongoDB integration, error handling, and deployment.',
      category: 'Development',
      level: 'Intermediate',
      price: 799,
      coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      modules: [
        { title: 'Node.js Runtime & npm',         type: 'video',    content: 'https://www.youtube.com/watch?v=TlB_eWDSMt4', durationMinutes: 12 },
        { title: 'Building APIs with Express',    type: 'document', content: 'Express is a minimal, unopinionated Node.js web framework that provides a robust set of features for web and mobile applications.', durationMinutes: 20 },
        { title: 'JWT Authentication',            type: 'video',    content: 'https://www.youtube.com/watch?v=7Q17ubqLfaM', durationMinutes: 25 },
        { title: 'MongoDB with Mongoose',         type: 'document', content: 'Mongoose is an ODM (Object Data Modeling) library for MongoDB and Node.js. It manages relationships between data and provides schema validation.', durationMinutes: 22 },
        { title: 'Error Handling & Middleware',   type: 'video',    content: 'https://www.youtube.com/watch?v=DYZTFooDB24', durationMinutes: 18 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[4],
      title: 'Python for Data Science',
      description: 'Go from Python basics to real data science workflows using pandas, NumPy, matplotlib, and scikit-learn. Work with real datasets throughout.',
      category: 'Development',
      level: 'Beginner',
      price: 1299,
      coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
      modules: [
        { title: 'Python Basics Refresher',         type: 'video',    content: 'https://www.youtube.com/watch?v=rfscVS0vtbw', durationMinutes: 30 },
        { title: 'NumPy Arrays & Operations',       type: 'document', content: 'NumPy is the foundational library for numerical computing in Python, providing efficient multi-dimensional array operations.', durationMinutes: 25 },
        { title: 'Data Wrangling with pandas',      type: 'video',    content: 'https://www.youtube.com/watch?v=vmEHCJofslg', durationMinutes: 35 },
        { title: 'Visualising Data with matplotlib', type: 'document', content: 'matplotlib is a comprehensive library for creating static, animated, and interactive visualizations in Python.', durationMinutes: 20 },
        { title: 'Intro to Machine Learning',       type: 'video',    content: 'https://www.youtube.com/watch?v=pqNCD_5r0IU', durationMinutes: 40 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[5],
      title: 'UI/UX Design with Figma',
      description: 'Learn the full product design process — user research, wireframing, prototyping, and handoff — using Figma. Includes real-world case studies and portfolio projects.',
      category: 'Design',
      level: 'Beginner',
      price: 0,
      coverImageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      modules: [
        { title: 'Design Thinking Process',      type: 'video',    content: 'https://www.youtube.com/watch?v=_r0VX-aU_T8', durationMinutes: 20 },
        { title: 'Figma Interface & Basics',     type: 'document', content: 'Figma is a browser-based collaborative design tool that allows teams to design, prototype, and gather feedback all in one place.', durationMinutes: 15 },
        { title: 'Wireframing Techniques',       type: 'video',    content: 'https://www.youtube.com/watch?v=D4NyQ5iowqo', durationMinutes: 25 },
        { title: 'Prototyping & Interactions',   type: 'video',    content: 'https://www.youtube.com/watch?v=iBkXf6u8htI', durationMinutes: 30 },
        { title: 'Design Systems & Components',  type: 'document', content: 'Design systems are sets of standards to manage design at scale by reducing redundancy while creating a shared language across teams.', durationMinutes: 22 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[6],
      title: 'Digital Marketing Masterclass',
      description: 'Complete guide to digital marketing: SEO, social media, email campaigns, paid ads (Google & Meta), analytics, and building a full marketing funnel from scratch.',
      category: 'Marketing',
      level: 'Intermediate',
      price: 1799,
      coverImageUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800',
      modules: [
        { title: 'Digital Marketing Overview',   type: 'video',    content: 'https://www.youtube.com/watch?v=bixR-KIJKYM', durationMinutes: 15 },
        { title: 'SEO Fundamentals',             type: 'document', content: 'SEO (Search Engine Optimization) is the practice of increasing the quantity and quality of traffic to your website through organic search results.', durationMinutes: 25 },
        { title: 'Paid Ads: Google & Meta',      type: 'video',    content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', durationMinutes: 35 },
        { title: 'Email Marketing Campaigns',    type: 'document', content: 'Email marketing involves sending targeted messages to subscribers to nurture leads, drive conversions, and build customer loyalty.', durationMinutes: 20 },
        { title: 'Analytics & Growth Tracking',  type: 'video',    content: 'https://www.youtube.com/watch?v=OzVB4B4_LH4', durationMinutes: 28 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    },
    {
      _id: courseIds[7],
      title: 'Full-Stack TypeScript with Next.js',
      description: 'Build complete full-stack applications using Next.js 14, TypeScript, Prisma ORM, Tailwind CSS, and deploy to Vercel. Includes auth, file uploads, and real-time features.',
      category: 'Development',
      level: 'Advanced',
      price: 2499,
      coverImageUrl: 'https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800',
      modules: [
        { title: 'Next.js 14 App Router',         type: 'video',    content: 'https://www.youtube.com/watch?v=wm5gMKuwSYk', durationMinutes: 30 },
        { title: 'TypeScript in Practice',        type: 'document', content: 'TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript, catching errors at compile time.', durationMinutes: 25 },
        { title: 'Prisma ORM & Databases',        type: 'video',    content: 'https://www.youtube.com/watch?v=RebA5J-rlwg', durationMinutes: 35 },
        { title: 'Authentication with NextAuth',  type: 'document', content: 'NextAuth.js is a complete open-source authentication solution for Next.js applications, supporting OAuth, email, and credentials.', durationMinutes: 20 },
        { title: 'Deployment & CI/CD on Vercel',  type: 'video',    content: 'https://www.youtube.com/watch?v=2HBIzEx6IZA', durationMinutes: 22 },
        { title: 'Real-time with Pusher/WebSockets', type: 'document', content: 'WebSockets provide full-duplex communication channels over a single TCP connection, enabling real-time features like chat and live notifications.', durationMinutes: 18 }
      ],
      instructor: { id: instructor._id, name: instructor.name },
      isPublished: true
    }
  ]);

  // ── Enrollment: student enrolled in React course ─────────────────
  await Enrollment.create({
    user: student._id,
    course: courseIds[0],
    completedLessons: [courses[0].modules[0]._id, courses[0].modules[1]._id],
    progressPercentage: 33,
    isCompleted: false
  });

  // ── Notifications ─────────────────────────────────────────────────
  await Notification.create([
    {
      userId: student._id,
      title: 'Welcome to EduFlow!',
      message: 'Great to have you here. Browse the catalog below and start your first course.',
      isRead: false
    },
    {
      userId: instructor._id,
      title: 'Instructor Account Approved',
      message: 'Your instructor profile is approved. Start creating courses from your dashboard.',
      isRead: false
    }
  ]);

  // ── Audit log ────────────────────────────────────────────────────
  await AuditLog.create({
    action: 'SYSTEM_INITIALIZE',
    details: `MongoDB seeded with ${courses.length} courses and default users.`,
    user: { name: 'System', email: 'system@eduflow.com' }
  });

  console.log(`✅ Seed complete: ${courses.length} courses created.`);
  console.log('   Default credentials: admin@eduflow.com / password');
};

module.exports = seedDatabase;
