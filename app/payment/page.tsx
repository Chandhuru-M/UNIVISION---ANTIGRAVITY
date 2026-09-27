'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle, 
  QrCode, 
  AlertCircle,
  MessageSquare,
  Mail,
  ArrowRight,
  Gift
} from 'lucide-react';
import { db, getDirectImageUrl, Course, Batch, Profile } from '@/lib/db';

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
  
  // Referral code state
  const [referralCode, setReferralCode] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [requestTimestamp, setRequestTimestamp] = useState<{ date: string; time: string }>({ date: '', time: '' });
  
  // QR image fallback state
  const [qrImageSrc, setQrImageSrc] = useState<string>('');

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

          // Configure initial QR image source (supporting Google Drive links)
          const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            `upi://pay?pa=univisioncounsel@gmail.com&pn=Univision%20Counsel&am=${courseData.fees}&cu=INR`
          )}`;
          const rawQr = courseData.qr_code_url;
          setQrImageSrc(rawQr && rawQr.trim() !== '' ? getDirectImageUrl(rawQr) : fallbackQr);

          // Check if user has a pre-existing referrer code
          if (currentUser.referred_by_id) {
            const profiles = await db.getProfiles();
            const referrerProfile = profiles.find(p => p.id === currentUser.referred_by_id);
            if (referrerProfile?.referral_code) {
              setReferralCode(referrerProfile.referral_code);
            }
          }
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

  const handleQrError = () => {
    if (course) {
      const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        `upi://pay?pa=univisioncounsel@gmail.com&pn=Univision%20Counsel&am=${course.fees}&cu=INR`
      )}`;
      setQrImageSrc(fallbackQr);
    }
  };

  const handleProceedNext = async () => {
    if (!user || !course || !batch) return;
    setLoading(true);

    try {
      const now = new Date();
      setRequestTimestamp({
        date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      // Submit enrollment request as Pending Verification
      await db.enrollStudent(
        user.id,
        batch.id,
        course.id,
        course.fees,
        'N/A', // No manual transaction ID required
        referralCode.trim() || undefined
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('univision_data_change'));
        window.dispatchEvent(new Event('storage'));
      }

      setPaymentSuccess(true);
    } catch (err: any) {
      console.error('Enrollment submission error:', err);
      setError(err.message || 'Failed to record payment verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !paymentSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-muted-foreground text-sm">Initializing checkout gateway...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl text-center space-y-6 border border-border">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Payment Error</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-secondary border border-border hover:bg-accent text-foreground font-semibold rounded-xl text-sm cursor-pointer"
        >
          Return to Courses
        </button>
      </div>
    );
  }

  if (paymentSuccess && user && course && batch) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 glass-panel rounded-3xl text-center space-y-6 border border-border relative overflow-hidden animate-fade-in text-left">
        {/* Glow */}
        <div className="absolute top-[-50px] left-[50%] translate-x-[-50%] w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full w-fit mx-auto animate-pulse">
          <CheckCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            Pending Verification
          </div>
          <h2 className="text-2xl font-black text-foreground">Payment Submitted!</h2>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Your payment request for <strong className="text-foreground">{course.name}</strong> ({batch.name}) has been submitted for manual admin verification.
          </p>
        </div>

        {/* Verification Summary Specs */}
        <div className="p-4 bg-card rounded-2xl border border-border space-y-3 text-xs">
          <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] border-b border-border pb-2">
            Submitted Verification Details
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-muted-foreground block">Student Name</span>
              <span className="font-bold text-foreground">{user.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Contact Number</span>
              <span className="font-bold text-foreground">{user.contact_number || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Request Date</span>
              <span className="font-bold text-foreground">{requestTimestamp.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Request Time</span>
              <span className="font-bold text-foreground">{requestTimestamp.time}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Referral ID Used</span>
              <span className="font-mono font-bold text-emerald-400">{referralCode || 'None'}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Amount Submitted</span>
              <span className="font-bold text-foreground">₹{course.fees.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/50 rounded-2xl border border-border text-xs space-y-3">
          <div className="flex gap-3 items-start">
            <MessageSquare className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Manual Verification Note</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                The administrator will manually cross-verify your payment receipt against the submitted timestamp ({requestTimestamp.date} at {requestTimestamp.time}). Once approved, your cohort status will change to Active.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            router.push('/dashboard/student');
            router.refresh();
          }}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
        >
          Go to Student Dashboard
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-left">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Cancel & Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Course Details Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-border space-y-6">
          <h2 className="text-xl font-bold text-foreground">Order Summary</h2>

          {user && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-1">
              <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block">Enrolling Account</span>
              <p className="text-sm font-bold text-foreground">{user.name} ({user.email})</p>
              {user.contact_number && <p className="text-xs text-muted-foreground">Contact: {user.contact_number}</p>}
            </div>
          )}

          {course && batch && (
            <div className="space-y-4">
              <div className="p-4 bg-card rounded-2xl border border-border space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Course Name</span>
                <p className="text-base font-bold text-foreground">{course.name}</p>
              </div>

              <div className="p-4 bg-card rounded-2xl border border-border space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Assigned Cohort Batch</span>
                <p className="text-base font-bold text-foreground">{batch.name}</p>
              </div>

              <div className="p-4 bg-card rounded-2xl border border-border grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Timings</span>
                  <span className="text-xs font-bold text-foreground">{course.timings}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Duration</span>
                  <span className="text-xs font-bold text-foreground">{course.duration}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-4 flex justify-between items-center text-sm font-semibold">
            <span className="text-muted-foreground">Amount Due</span>
            <span className="text-2xl font-black text-foreground">₹{course?.fees.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment QR Code Panel */}
        <div className="glass-panel rounded-3xl p-6 border border-border space-y-6">
          <div className="flex justify-center gap-2 items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <QrCode className="h-4.5 w-4.5 text-blue-500" />
            <span>Scan UPI QR Code to Pay</span>
          </div>

          {/* Configured QR Code Image */}
          <div className="bg-white p-4 rounded-3xl w-fit mx-auto border-4 border-border flex items-center justify-center shadow-lg">
            {qrImageSrc ? (
              <img 
                src={qrImageSrc} 
                alt="UPI Payment QR Code" 
                onError={handleQrError}
                className="h-48 w-48 rounded-xl object-contain"
              />
            ) : (
              <div className="h-48 w-48 flex flex-col items-center justify-center text-zinc-800 font-semibold text-xs border border-zinc-200 rounded-xl">
                <span>Loading QR Code...</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground text-center">
            <p>Scan with GPay, PhonePe, Paytm, or any BHIM UPI App.</p>
            <p className="font-bold text-foreground text-sm">Pay exactly ₹{course?.fees} INR</p>
          </div>

          {/* Enter Referral ID Section (Optional) */}
          <div className="border-t border-border pt-5 space-y-4">
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5" htmlFor="payment-referral">
                  <Gift className="h-3.5 w-3.5 text-emerald-400" />
                  Enter Referral ID (Optional)
                </label>
                <span className="text-[10px] text-muted-foreground/70">Reward for your friend</span>
              </div>
              <input
                id="payment-referral"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="REF-1234ABCD"
                className="w-full bg-background border border-border rounded-xl py-3 px-4 text-xs font-mono tracking-wider text-foreground focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleProceedNext}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-secondary disabled:text-muted-foreground text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-[10px] text-muted-foreground/70 text-center">
              Click &quot;Next&quot; after completing the transfer to submit for manual admin verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 relative">
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
