'use client';

import { useEffect, useState } from 'react';
import LinkNext from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Sparkles, 
  Target, 
  Compass, 
  BookOpen, 
  Clock, 
  Calendar, 
  CheckCircle,
  Gift,
  ShieldAlert,
  Mail,
  Phone,
  Layers,
  GraduationCap
} from 'lucide-react';
import { db, Course } from '@/lib/db';

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('error=access_denied') || hash.includes('otp_expired') || hash.includes('error_description')) {
        router.push('/auth?error=expired');
        return;
      }
    }

    const checkAuth = () => {
      const user = db.getCurrentUser();
      setIsLoggedIn(!!user);
    };

    async function loadData() {
      try {
        const data = await db.getCourses();
        setCourses(data);
        checkAuth();
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    window.addEventListener('univision_auth_change', checkAuth);
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('univision_auth_change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, [router]);

  const handleBookCourse = (courseId: string) => {
    if (isLoggedIn) {
      router.push(`/courses/${courseId}`);
    } else {
      router.push(`/auth?redirect=/courses/${courseId}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background radial glow */}
      <div className="hero-glow top-[-150px] left-[-150px] animate-pulse-slow"></div>
      <div className="hero-glow bottom-[-150px] right-[-150px] opacity-75"></div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20"></div>

      {/* 1. HERO SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>By Students, For Students | Established 2025</span>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-foreground">
            Quality Education Made <br />
            <span className="gradient-text font-black">Accessible & Affordable</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
            Univision Counsel is an EdTech platform driven by a collaborative network of students from India&apos;s top-tier institutions, offering peer-to-peer cohorts, verified roadmaps, and career-oriented support.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <LinkNext
            href="#courses"
            className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-605 bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/20 rounded-xl transition-all flex items-center gap-2"
          >
            Explore Courses
            <ArrowRight className="h-4 w-4" />
          </LinkNext>
          <LinkNext
            href="#about"
            className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-foreground bg-secondary border border-border rounded-xl hover:bg-accent transition-all"
          >
            About Us
          </LinkNext>
        </div>
      </section>

      {/* 2. ABOUT COMPANY DESCRIPTION */}
      <section id="about" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 border-t border-border">
        <div className="space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              About Univision Counsel
            </h2>
            <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Description Text */}
            <div className="lg:col-span-7 space-y-6 text-sm text-muted-foreground leading-relaxed font-medium">
              <p>
                <strong className="text-foreground font-black">Univision Counsel</strong> is an EdTech platform established with the vision of making quality education accessible to every student at an affordable cost, and in many cases, completely free of charge. Founded in 2025 by <strong className="text-foreground font-black">Mohamed Jaris</strong> during his pre-final year in Chennai, the organization is driven by students, for students.
              </p>
              <p>
                The company operates through a collaborative network of students from various academic branches and top-tier institutions across India. By combining collective experiences, insights, and practical knowledge, Univision Counsel aims to guide students in building a clear roadmap toward achieving their academic and career goals.
              </p>
              <p>
                Univision Counsel provides end-to-end guidance for different fields of study, helping students understand where to begin, how to progress, and how to successfully achieve their objectives. To simplify the learning process, the platform curates and consolidates high-quality study materials from across the internet, reducing the time students spend searching for reliable resources.
              </p>
              <p>
                Through mentorship programs, guidance sessions, and career-oriented support, Univision Counsel helps students gain clarity, improve their skills, and increase their chances of securing strong career opportunities. In addition, the platform offers subsidiary courses taught by students who have mastered their respective subjects, making complex concepts easier to understand and enabling learners to excel more effectively and efficiently.
              </p>
            </div>

            {/* Quick Specs / Meta Box */}
            <div className="lg:col-span-5">
              <div className="glass-panel rounded-3xl p-6 border border-border space-y-6 gradient-border">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-3">
                  Company Snapshot
                </h3>
                <div className="space-y-4 text-xs font-semibold text-muted-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/80">Founder & CEO</span>
                    <span className="text-foreground font-bold">Mohamed Jaris</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/80">Institution Origin</span>
                    <span className="text-foreground font-bold">Chennai</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/80">Founded Year</span>
                    <span className="text-foreground font-bold">2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/80">Core Philosophy</span>
                    <span className="text-primary font-bold">Driven by students, for students</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground/80">Network Reach</span>
                    <span className="text-foreground font-bold">Top-Tier institutions across India</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISION & MISSION SECTION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          
          {/* VISION PANEL */}
          <div className="glass-panel rounded-3xl p-8 border border-border flex flex-col justify-between space-y-6 relative overflow-hidden gradient-border">
            <div className="absolute top-[-50px] right-[-50px] w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-600/15 border border-blue-500/20 text-blue-400">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Our Vision</h3>
                  <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">The Future We Are Cultivating</p>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground leading-relaxed font-medium text-left">
                To build India&apos;s most trusted student-driven learning ecosystem that empowers every learner, regardless of financial background, with access to quality education, mentorship, career guidance, and opportunities for growth.
              </p>
              
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium text-left">
                {[
                  'Democratize quality education by making learning affordable and accessible to all.',
                  'Create a nationwide community of students, mentors, and professionals.',
                  'Become the go-to platform for academic guidance, skill development, and industry readiness.',
                  'Empower students not only to learn but also to earn through community-driven initiatives.',
                  'Foster a culture of knowledge sharing where experienced learners guide the next generation.',
                  'Enable millions of students to transform their dreams into reality.'
                ].map((point, index) => (
                  <li key={index} className="flex gap-2.5 items-start">
                    <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* MISSION PANEL */}
          <div className="glass-panel rounded-3xl p-8 border border-border flex flex-col justify-between space-y-6 relative overflow-hidden gradient-border">
            <div className="absolute top-[-50px] right-[-50px] w-24 h-24 bg-purple-500/10 rounded-full blur-xl"></div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-650/15 border border-purple-500/20 text-purple-400">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">Our Mission</h3>
                  <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider">Our Daily Commitment</p>
                </div>
              </div>

              <ul className="space-y-3.5 text-xs text-muted-foreground font-medium text-left">
                {[
                  'Provide quality education and mentorship at an affordable cost or free of charge for students across diverse fields of study.',
                  'Simplify the learning journey by curating reliable and high-quality study resources from across the internet.',
                  'Build a student-driven community where collective experiences and peer learning help students grow.',
                  'Guide students with clear roadmaps, career-oriented sessions, and practical insights.',
                  'Empower learners through concept-based subsidiary courses taught by skilled students, making education easier to understand.',
                  'Bridge the gap between learning and career opportunities by helping students develop industry-relevant knowledge.'
                ].map((point, index) => (
                  <li key={index} className="flex gap-2.5 items-start">
                    <CheckCircle className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 4. LEARN & EARN SCHEME (WHAT MAKES US DIFFERENT) */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              <Gift className="h-3.5 w-3.5" />
              <span>Learn and Earn Scheme</span>
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What Makes Univision Counsel Different?
            </h2>
            
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Unlike many organizations that primarily focus on profit, Univision Counsel is driven by the mission of making quality education accessible to every student at a minimal cost or completely free of charge. Financial limitations should never become a barrier to learning.
            </p>
            
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              To support this vision, we introduced our exclusive <strong className="text-foreground font-black">Learn and Earn Scheme</strong>, designed to help students not only learn but also earn while being part of the platform.
            </p>
          </div>

          {/* Scheme Steps */}
          <div className="lg:col-span-5 space-y-4 text-left">
            {[
              { step: '1', title: 'Get Wallet & Referral ID', desc: 'Every registered student receives a unique Referral ID and a personal wallet on the platform.' },
              { step: '2', title: 'Earn 12.5% Cashback', desc: 'Whenever a friend enrolls in a course using your Referral ID, 12.5% of the course fee is credited straight to your wallet.' },
              { step: '3', title: 'Dynamic Wallet Cap', desc: 'Referral earnings are capped dynamically up to 50% of the cumulative course fees you paid for.' },
              { step: '4', title: 'Withdraw In Full', desc: 'Submit a redeem request to the admin dashboard at any time. Wallet balance is approved and paid in full.' }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 bg-card rounded-2xl border border-border hover:border-accent-teal transition-all">
                <div className="h-8 w-8 shrink-0 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-black rounded-lg flex items-center justify-center">
                  {item.step}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">{item.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. COURSES SECTION */}
      <section id="courses" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 border-t border-border">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Explore Cohort Courses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm font-medium">
            Select a learning roadmap. Join a live cohort, learn concepts via Google Meet, and take advantage of the Learn and Earn referral rewards.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-muted-foreground text-xs">Fetching catalog...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No courses available at the moment.</p>
            <p className="text-muted-foreground/75 text-xs mt-1">Admin has not added courses to the live database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="glass-panel glass-panel-hover rounded-3xl flex flex-col justify-between overflow-hidden relative group text-left"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      {course.duration}
                    </span>
                    <span className="text-2xl font-black text-foreground">₹{course.fees}</span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-3 text-xs text-muted-foreground font-medium border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-muted-foreground/70 shrink-0" />
                      <span>{course.class_count} Lectures</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-muted-foreground/70 shrink-0" />
                      <span>{course.days_of_week.length} Days/wk</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted-foreground/80 italic">
                    Class schedule: {course.timings}
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleBookCourse(course.id)}
                    className="w-full py-3.5 text-center text-xs font-bold text-foreground bg-secondary border border-border rounded-xl hover:bg-blue-600 hover:border-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                  >
                    Book Course
                    <ArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. FIELDS OF STUDY / COMMUNITY COLLABORATION */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="p-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl w-fit">
              <Layers className="h-6 w-6 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-foreground">Fields of Study We Support</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Univision Counsel welcomes students and contributors from all branches and fields. We support, guide, and compile resources for a wide variety of domains:
            </p>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-muted-foreground">
              {['Engineering', 'Medical Sciences', 'Law', 'Commerce', 'Arts', 'Management'].map(f => (
                <span key={f} className="px-2.5 py-1.5 rounded-lg bg-card border border-border">
                  {f}
                </span>
              ))}
              <span className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-primary font-bold">
                &amp; many more
              </span>
            </div>

            <p className="text-[11px] text-amber-500/90 dark:text-amber-400/90 font-medium italic mt-3 leading-relaxed">
              <strong className="font-bold not-italic text-amber-500 dark:text-amber-400">Disclaimer:</strong> Other courses are currently under construction and will be available soon. For now, the courses listed above are the only courses available for enrollment.
            </p>
          </div>

          <div className="lg:col-span-7 bg-card/40 border border-border rounded-3xl p-6 space-y-4 text-left">
            <h4 className="text-sm font-bold text-foreground">Contribute a Course, Mentor Session or Roadmap</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              If you have expertise in a particular domain and would like to contribute a course, mentorship session, or a structured roadmap based on your academic or professional journey, you can reach out to the organization through email. Once reviewed, the team will respond to discuss opportunities for collaboration.
            </p>
            <div className="flex items-center gap-2">
              <a 
                href="mailto:univisioncounsel@gmail.com"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                univisioncounsel@gmail.com
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 7. WARNINGS & SECURITY BLOCK */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10 border-t border-border">
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row items-center md:items-start gap-4 text-left">
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-400 shrink-0">
            <ShieldAlert className="h-6 w-6 animate-bounce" />
          </div>
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider">Strict Security Warning</h4>
            <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
              Screen Records or any other form of recording is <strong className="text-red-400">Strictly Prohibited</strong>. In case of leak of session footage, you will be prosecuted under Copyright Infringement Policies.
            </p>
          </div>
        </div>
      </section>

      {/* 8. SUPPORT FOOTER ACCENT */}
      <section id="support" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          
          <div className="p-5 bg-card rounded-2xl border border-border flex flex-col md:flex-row items-center gap-3">
            <Mail className="h-6 w-6 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground/80 block font-bold uppercase">Mail Support</span>
              <a href="mailto:univisioncounsel@gmail.com" className="text-xs text-muted-foreground font-semibold hover:text-primary">
                univisioncounsel@gmail.com
              </a>
            </div>
          </div>

          <div className="p-5 bg-card rounded-2xl border border-border flex flex-col md:flex-row items-center gap-3">
            <Phone className="h-6 w-6 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground/80 block font-bold uppercase">Call Hotline</span>
              <a href="tel:+918438304400" className="text-xs text-muted-foreground font-semibold hover:text-primary">
                +91 8438304400
              </a>
            </div>
          </div>

          <div className="p-5 bg-card rounded-2xl border border-border flex flex-col md:flex-row items-center gap-3">
            <GraduationCap className="h-6 w-6 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-muted-foreground/80 block font-bold uppercase">Mentor & founder</span>
              <span className="text-xs text-muted-foreground font-semibold">
                Mohamed Jaris (CEO of Univision Counsel)
              </span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
