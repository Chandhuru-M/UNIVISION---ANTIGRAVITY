'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  QrCode, 
  CreditCard, 
  AlertCircle,
  MessageSquare,
  Mail,
  HelpCircle
} from 'lucide-react';
import { db, Course, Batch, Profile } from '@/lib/db';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId') || '';
  const batchId = searchParams.get('batchId') || '';

  const [user, setUser] = useState<Profile | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function loadPaymentDetails() {
      try {
        const currentUser = db.getCurrentUser();
        if (!currentUser) {
          router.push(`/auth?redirect=/payment?courseId=${courseId}&batchId=${batchId}`);
          return;
        }
        setUser(currentUser);

        if (!courseId || !batchId) {
          setError('Missing course or batch selection.');
          setLoading(false);
          return;
        }

        const courseData = await db.getCourseById(courseId);
        const batches = await db.getBatches(courseId);
        const batchData = batches.find(b => b.id === batchId);

        if (courseData && batchData) {
          setCourse(courseData);
          setBatch(batchData);
        } else {
          setError('Invalid course or batch parameters.');
        }
      } catch (err) {
        console.error('Error loading payment specs:', err);
        setError('Failed to initialize payment.');
      } finally {
        setLoading(false);
      }
    }

    loadPaymentDetails();
  }, [courseId, batchId, router]);

  const handleSimulatePayment = async () => {
    if (!user || !course || !batch || !transactionId.trim()) return;
    setLoading(true);

    try {
      // Find out if this student profile has a referred_by_id
      const referrerId = user.referred_by_id;
      let referrerCode: string | undefined;
      
      if (referrerId) {
        const profiles = await db.getProfiles();
        const referrerProfile = profiles.find(p => p.id === referrerId);
        if (referrerProfile) {
          referrerCode = referrerProfile.referral_code;
        }
      }

      // Add enrollment as pending
      await db.enrollStudent(
        user.id,
        batch.id,
        course.id,
        course.fees,
        transactionId,
        referrerCode
      );

      setPaymentSuccess(true);
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Failed to record payment verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !paymentSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-zinc-550 text-sm">Initializing checkout gateway...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl text-center space-y-6 border border-zinc-800">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Payment Error</h2>
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm"
        >
          Return to Courses
        </button>
      </div>
    );
  }

  if (paymentSuccess && user && course && batch) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 glass-panel rounded-3xl text-center space-y-6 border border-zinc-800 relative overflow-hidden animate-fade-in">
        {/* Glow */}
        <div className="absolute top-[-50px] left-[50%] translate-x-[-50%] w-32 h-32 bg-amber-500/10 rounded-full blur-xl"></div>
        
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full w-fit mx-auto animate-pulse">
          <CheckCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Verification Pending!</h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-medium">
            Your transaction reference <span className="text-white font-mono font-bold select-all bg-zinc-900 px-1.5 py-0.5 rounded">{transactionId}</span> has been submitted to the admin team.
          </p>
          <p className="text-[11px] text-zinc-500">
            Please allow up to 24 hours for the administrator to manually verify your payment receipt. Once verified, your status will change to Completed.
          </p>
        </div>

        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-900 text-left text-xs space-y-3.5">
          <h4 className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] border-b border-zinc-850 pb-1">
            Simulated Notifications
          </h4>
          
          <div className="flex gap-3 items-start">
            <MessageSquare className="h-5 w-5 text-amber-450 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">WhatsApp Alert Dispatched</p>
              <p className="text-[10px] text-zinc-550 mt-0.5">To mobile: {user.contact_number}</p>
              <p className="text-[10px] text-zinc-450 bg-zinc-950 p-2 rounded-lg mt-1 italic">
                &quot;Hi {user.name}, we have received your transaction reference {transactionId} for {course.name} ({batch.name}). It is now awaiting manual admin review.&quot;
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <Mail className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Email Receipt Queued</p>
              <p className="text-[10px] text-zinc-555 mt-0.5">To address: {user.email}</p>
              <p className="text-[10px] text-zinc-455 bg-zinc-950 p-2 rounded-lg mt-1 italic">
                &quot;Subject: Booking Receipt - Univision Counsel. Your payment verification request for ₹{course.fees} is being processed manually. Classroom access link will become active immediately upon approval.&quot;
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            router.push('/dashboard/student');
            router.refresh();
          }}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer text-sm"
        >
          Go to Student Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Cancel & Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Course Details Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6">
          <h2 className="text-xl font-bold text-white">Order Summary</h2>

          {course && batch && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-850 space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Course Name</span>
                <p className="text-base font-bold text-white">{course.name}</p>
              </div>

              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-850 space-y-1.5">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Assigned Cohort Batch</span>
                <p className="text-base font-bold text-white">{batch.name}</p>
              </div>

              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-850 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Timings</span>
                  <span className="text-xs font-bold text-zinc-300">{course.timings}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Duration</span>
                  <span className="text-xs font-bold text-zinc-300">{course.duration}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-sm font-semibold">
            <span className="text-zinc-400">Amount Due</span>
            <span className="text-2xl font-black text-white">₹{course?.fees.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment QR Code Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6">
          <div className="flex justify-center gap-2 items-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <QrCode className="h-4.5 w-4.5 text-blue-500" />
            <span>Scan UPI QR to Pay</span>
          </div>

          {/* QR Code Graphic (renders dynamically for each course) */}
          <div className="bg-white p-4 rounded-3xl w-fit mx-auto border-4 border-zinc-800 flex items-center justify-center shadow-lg">
            {course?.qr_code_url ? (
              <img 
                src={course.qr_code_url} 
                alt="UPI Payment QR Code" 
                className="h-44 w-44 rounded-xl"
              />
            ) : (
              <div className="h-44 w-44 flex flex-col items-center justify-center text-black font-semibold text-xs border border-zinc-200 rounded-xl">
                <span>QR Loading...</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-zinc-500">
            <p>Scan the code above with GPay, PhonePe, Paytm, or any BHIM UPI App.</p>
            <p className="font-semibold text-zinc-400">Pay exactly ₹{course?.fees} INR</p>
          </div>

          {/* Form field for Transaction ID */}
          <div className="border-t border-zinc-900 pt-6 space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-semibold text-zinc-350 block">
                UPI Transaction ID / Ref No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter 12-digit transaction number"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-xs font-mono tracking-wider text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-zinc-550 leading-relaxed font-semibold">
                Please transfer the amount first, copy the UPI Ref/Transaction ID, and enter it above for verification.
              </p>
            </div>

            <button
              onClick={handleSimulatePayment}
              disabled={!transactionId.trim() || loading}
              className="w-full py-3.5 bg-blue-600 disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border-zinc-900 hover:bg-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
            >
              <CreditCard className="h-4 w-4" />
              {loading ? 'Submitting...' : 'Submit Transaction ID'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 relative">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}
