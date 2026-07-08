'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet as WalletIcon, 
  Gift, 
  ExternalLink, 
  Clock, 
  Calendar, 
  Video, 
  AlertCircle,
  Copy,
  CheckCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { db, Course, Batch, Profile, Enrollment, Redemption } from '@/lib/db';
import DashboardSidebar from '@/components/DashboardSidebar';
import { BarChart, DonutChart } from '@/components/DashboardCharts';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  
  // Dashboard states
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  const [enrolledCohorts, setEnrolledCohorts] = useState<{
    enrollmentId: string;
    course: Course;
    batch: Batch;
    payment_status: 'pending' | 'completed' | 'failed';
    transaction_id?: string;
  }[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redeemPhone, setRedeemPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const currentUser = db.getCurrentUser();
        if (!currentUser || currentUser.role !== 'student') {
          router.push('/auth');
          return;
        }
        setUser(currentUser);

        // Fetch Wallet
        const wallet = await db.getWallet(currentUser.id);
        if (wallet) setWalletBalance(wallet.balance);

        // Fetch Enrollments
        const enrollments = await db.getEnrollments(currentUser.id);
        const courses = await db.getCourses();
        const batches = await db.getBatches();

        const cohorts = enrollments
          .map(e => {
            const course = courses.find(c => c.id === e.course_id);
            const batch = batches.find(b => b.id === e.batch_id);
            if (course && batch) {
              return { 
                enrollmentId: e.id, 
                course, 
                batch,
                payment_status: e.payment_status,
                transaction_id: e.transaction_id
              };
            }
            return null;
          })
          .filter(Boolean) as any[];

        setEnrolledCohorts(cohorts);

        // Fetch Redemptions
        const redemptionList = await db.getRedemptions(currentUser.id);
        setRedemptions(redemptionList);

        // Calculate count of other students referred by this student
        const allProfiles = await db.getProfiles();
        const referred = allProfiles.filter(p => p.referred_by_id === currentUser.id);
        setReferralsCount(referred.length);

      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  const handleCopyReferral = () => {
    if (!user?.referral_code) return;
    const link = `${window.location.origin}/auth?ref=${user.referral_code}`;
    navigator.clipboard.writeText(user.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeemRequest = async () => {
    if (!user || walletBalance <= 0 || !redeemPhone.trim()) {
      setMessage({ type: 'error', text: 'Linked mobile number is required to request redemption.' });
      return;
    }
    setActionLoading(true);
    setMessage(null);

    // Enforce check: must not have a pending redemption already
    const hasPending = redemptions.some(r => r.status === 'pending');
    if (hasPending) {
      setMessage({ type: 'error', text: 'You already have a pending redemption request.' });
      setActionLoading(false);
      return;
    }

    try {
      const amount = walletBalance;
      await db.createRedemptionRequest(user.id, amount, redeemPhone);
      
      // Update local state
      const updatedRedemptions = await db.getRedemptions(user.id);
      setRedemptions(updatedRedemptions);
      setRedeemPhone('');
      
      setMessage({ 
        type: 'success', 
        text: `Redemption request of ₹${amount.toFixed(2)} submitted successfully! It will be verified and credited within 1 to 7 business days.` 
      });
    } catch (err) {
      console.error('Redeem error:', err);
      setMessage({ type: 'error', text: 'Failed to request redemption. Try again later.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getStudentWalletDonut = () => {
    const redeemedAmount = redemptions
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);
    return [
      { label: 'Available Wallet', value: walletBalance, color: '#3b82f6' },
      { label: 'Redeemed Payouts', value: redeemedAmount, color: '#10b981' }
    ];
  };

  const getStudentBarData = () => {
    return [
      { label: 'Jan', value: 0 },
      { label: 'Feb', value: 0 },
      { label: 'Mar', value: Math.round(walletBalance * 0.2) },
      { label: 'Apr', value: Math.round(walletBalance * 0.5) },
      { label: 'May', value: Math.round(walletBalance * 0.8) },
      { label: 'Jun', value: walletBalance }
    ];
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-zinc-550 text-sm">Synchronizing dashboard workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <DashboardSidebar
        currentTab="workspace"
        onTabChange={() => {}}
        role="student"
        userName={user?.name || 'Student'}
        userEmail={user?.email || ''}
        onLogout={() => {
          db.setCurrentUser(null);
          router.push('/');
          router.refresh();
        }}
      />

      {/* Main Workspace Column */}
      <main className="flex-1 bg-[#09090b] min-h-screen p-8 text-left overflow-y-auto space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div>
            <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">
              Student Dashboard
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">July 2026 | Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

      {/* Analytics & Referral Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2">
              My Profile
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Full Name</span>
                <span className="font-bold text-white text-sm">{user?.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Email Address</span>
                <span className="text-zinc-300 font-medium">{user?.email}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Date of Birth</span>
                  <span className="text-zinc-300 font-medium">{user?.dob || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Contact Number</span>
                  <span className="text-zinc-300 font-medium">{user?.contact_number || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold mb-1">Account Role</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>        {/* Wallet & Redemptions Card */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <WalletIcon className="h-4.5 w-4.5 text-emerald-450" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Wallet Balance</h3>
            </div>
            
            <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-850 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-2xl font-black text-white">₹{walletBalance.toFixed(2)}</span>
              </div>

              {walletBalance > 0 && !redemptions.some(r => r.status === 'pending') && (
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-800">
                  <label className="text-[9px] font-black text-zinc-450 block uppercase tracking-wider">
                    Linked Payment Mobile (GPay/PhonePe)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter mobile number"
                    value={redeemPhone}
                    onChange={(e) => setRedeemPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-2 text-[10px] text-white focus:outline-none focus:border-emerald-500 font-medium"
                  />
                  <p className="text-[8px] text-zinc-550 leading-relaxed font-semibold">
                    * Redemptions are credited in 1 to 7 business days.
                  </p>
                </div>
              )}

              <button
                onClick={handleRedeemRequest}
                disabled={walletBalance <= 0 || actionLoading || redemptions.some(r => r.status === 'pending') || (walletBalance > 0 && !redeemPhone.trim())}
                className="w-full py-2 bg-emerald-600 disabled:bg-zinc-950 disabled:text-zinc-600 disabled:border-zinc-950 rounded-lg hover:bg-emerald-500 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                {actionLoading ? 'Sending...' : 'Redeem Cashout'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-900 pb-1">Redemption Status</h4>
            <div className="overflow-y-auto max-h-[80px] space-y-1.5 text-[10px]">
              {redemptions.length === 0 ? (
                <p className="text-zinc-650 italic">No cashout history.</p>
              ) : (
                redemptions.map((red) => (
                  <div key={red.id} className="flex justify-between items-center p-1.5 rounded bg-zinc-950/65 border border-zinc-900">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-zinc-300">₹{red.amount.toFixed(2)}</span>
                      <span className="text-[8px] text-zinc-550">Ph: {red.payment_phone}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      red.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400'
                        : red.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-450'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {red.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Referral Stats Card */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-400">Referral Center</h3>
                <p className="text-[10px] text-zinc-500">Get 25% cash back on friend signups</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-850">
              <span className="font-mono text-sm font-bold text-white tracking-wider uppercase select-all">
                {user?.referral_code}
              </span>
              <button
                onClick={handleCopyReferral}
                className="p-1 text-zinc-450 hover:text-white hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
                title="Copy Referral ID"
              >
                {copied ? <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 border-t border-zinc-900 pt-3">
            <span>Friends Referred</span>
            <span className="text-white text-sm font-black">{referralsCount} users</span>
          </div>
        </div>


      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pl-1">Wallet & Referrals Accumulation</h3>
          <BarChart data={getStudentBarData()} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pl-1">Wallet Status Summary</h3>
          <DonutChart segments={getStudentWalletDonut()} />
        </div>
      </div>

      {/* Enrolled Courses Cohort Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">My Active Course Cohorts</h2>

        {enrolledCohorts.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/20 rounded-3xl border border-zinc-900 space-y-4">
            <Video className="h-10 w-10 text-zinc-700 mx-auto" />
            <p className="text-zinc-450 font-medium">You have not enrolled in any course batches yet.</p>
            <button
              onClick={() => router.push('/#courses')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
            >
              Explore Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enrolledCohorts.map(({ enrollmentId, course, batch, payment_status }) => (
              <div 
                key={enrollmentId} 
                className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-6 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 px-4 py-1.5 border-l border-b border-zinc-850 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider ${
                  payment_status === 'pending'
                    ? 'bg-amber-500/10 text-amber-405 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {payment_status === 'pending' ? 'Pending Approval' : 'Active Enrolled'}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-snug">{course.name}</h3>
                    <p className="text-xs text-blue-400 font-semibold mt-0.5">{batch.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs text-zinc-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-zinc-550 shrink-0" />
                      <span>Timings: {course.timings}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-zinc-550 shrink-0" />
                      <span>Days: {course.days_of_week.join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
                  {payment_status === 'pending' ? (
                    <div className="flex items-center gap-2 w-full p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10.5px] text-amber-400 font-bold">
                      <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                      <span>Verification Pending: GPay reference checks in progress. Link active upon approval.</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] text-zinc-550 italic">
                        Classes conducted online via Google Meet.
                      </div>
                      
                      {batch.google_meet_link ? (
                        <a
                          href={batch.google_meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/10 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Video className="h-4 w-4" />
                          Join Google Meet
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold rounded-xl text-xs flex items-center gap-1.5"
                        >
                          <Video className="h-4 w-4" />
                          Link Not Scheduled
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
