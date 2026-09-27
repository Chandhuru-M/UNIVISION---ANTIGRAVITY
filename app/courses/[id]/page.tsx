'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  ArrowLeft, 
  CheckCircle, 
  Users, 
  ArrowRight,
  AlertTriangle,
  Check
} from 'lucide-react';
import { db, Course, Batch } from '@/lib/db';

interface CoursePageProps {
  params: Promise<{ id: string }>;
}

const SHORT_DAY_NAMES: Record<string, string> = {
  'Monday': 'Mon',
  'Tuesday': 'Tue',
  'Wednesday': 'Wed',
  'Thursday': 'Thu',
  'Friday': 'Fri',
  'Saturday': 'Sat',
  'Sunday': 'Sun',
  'Mon': 'Mon',
  'Tue': 'Tue',
  'Wed': 'Wed',
  'Thu': 'Thu',
  'Fri': 'Fri',
  'Sat': 'Sat',
  'Sun': 'Sun'
};

function formatShortDay(day: string): string {
  const trimmed = day.trim();
  return SHORT_DAY_NAMES[trimmed] || (trimmed.length > 3 ? trimmed.slice(0, 3) : trimmed);
}

const ALL_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CourseDetailPage({ params }: CoursePageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function loadCourseAndBatches() {
      try {
        const user = db.getCurrentUser();
        setIsLoggedIn(!!user);

        // Fetch course and its batches
        const courseData = await db.getCourseById(courseId);
        if (courseData) {
          setCourse(courseData);
          const batchData = await db.getBatches(courseId);
          setBatches(batchData);
          if (batchData.length > 0) {
            setSelectedBatchId(batchData[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching course/batches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourseAndBatches();
  }, [courseId]);

  const handleProceedToPayment = () => {
    if (!selectedBatchId) return;
    router.push(`/payment?courseId=${courseId}&batchId=${selectedBatchId}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-muted-foreground text-sm">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex-1 max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Course Not Found</h2>
        <p className="text-muted-foreground">The course you are looking for does not exist or has been removed.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const shortCourseDays = course.days_of_week.map(formatShortDay);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative text-left">
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left 2 Columns: Course Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight">
              {course.name}
            </h1>
            <p className="text-muted-foreground leading-relaxed text-base font-medium">
              {course.description}
            </p>
          </div>

          {/* Key Course Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <Clock className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] text-muted-foreground/80 uppercase font-bold tracking-wider block">Duration</span>
              <span className="text-sm font-bold text-foreground">{course.duration}</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] text-muted-foreground/80 uppercase font-bold tracking-wider block">Class Count</span>
              <span className="text-sm font-bold text-foreground">{course.class_count} lectures</span>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1.5 flex flex-col justify-between overflow-hidden">
              <div>
                <Calendar className="h-5 w-5 text-blue-400" />
                <span className="text-[10px] text-muted-foreground/80 uppercase font-bold tracking-wider block mt-1">Days</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {shortCourseDays.map((day, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0"
                  >
                    {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="text-[10px] text-muted-foreground/80 uppercase font-bold tracking-wider block">Timings</span>
              <span className="text-sm font-bold text-foreground leading-tight block">{course.timings}</span>
            </div>
          </div>

          {/* Curriculum / What You Learn */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">What is included in this course?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Full syllabus aligned to current tech standards',
                'Live sessions conducted via Google Meet',
                'Access to direct mentor support channels',
                'Peer networking within your cohort',
                'Certificate of completion upon active attendance',
                'Referral eligibility (Earn 12.5% cashback on student referrals)',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Batch Selection & Booking Actions */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-border space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <span className="text-sm font-semibold text-muted-foreground">Total Course Fee</span>
              <span className="text-3xl font-black text-foreground">₹{course.fees}</span>
            </div>

            {/* Weekly Schedule Days Overview */}
            <div className="p-3 bg-secondary/50 rounded-2xl border border-border space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Lecture Schedule</span>
                <span className="text-blue-400 font-semibold lowercase tracking-normal">{course.timings}</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {ALL_WEEKDAYS.map((day) => {
                  const isActive = shortCourseDays.includes(day);
                  return (
                    <div
                      key={day}
                      className={`py-1 px-0.5 text-center text-[11px] font-bold rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white border border-blue-500 shadow-sm'
                          : 'bg-background/40 text-muted-foreground/30 border border-border/40'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Batch Selector */}
            <div className="space-y-3 text-left">
              <label className="text-xs font-semibold text-muted-foreground block">Select Available Batch</label>
              
              {batches.length === 0 ? (
                <div className="p-4 bg-card rounded-xl border border-border text-center space-y-2">
                  <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto" />
                  <p className="text-xs text-muted-foreground">No active batches available. Please check back later or contact Support.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {batches.map((batch) => {
                    const isSelected = selectedBatchId === batch.id;
                    return (
                      <button
                        key={batch.id}
                        type="button"
                        onClick={() => setSelectedBatchId(batch.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer block relative ${
                          isSelected
                            ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10'
                            : 'bg-card border-border hover:border-muted-foreground/50 hover:bg-secondary/40'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-bold text-foreground">{batch.name}</span>
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-500 text-white' 
                              : 'border-border bg-background'
                          }`}>
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                          <span className="font-semibold text-muted-foreground/90">Starts: {batch.start_date}</span>
                          <div className="flex gap-1">
                            {shortCourseDays.map((d, i) => (
                              <span key={i} className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isLoggedIn ? (
              <button
                onClick={handleProceedToPayment}
                disabled={!selectedBatchId}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-secondary disabled:text-muted-foreground disabled:border-border text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Proceed to Payment
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => router.push(`/auth?redirect=/courses/${courseId}`)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In to Book Course
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <p className="text-[10px] text-muted-foreground/80 text-center">
              Payment includes instant batch registration and referral dashboard access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

