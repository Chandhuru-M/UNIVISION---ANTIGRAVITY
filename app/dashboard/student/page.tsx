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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses'>('dashboard');
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
        <p className="text-muted-foreground text-sm">Synchronizing dashboard workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <DashboardSidebar
        currentTab={activeTab}
        onTabChange={setActiveTab}
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
      <main className="flex-1 bg-background min-h-screen p-6 text-left overflow-y-auto space-y-6 transition-colors">
        
        {/* Top Header */}
        <div className="flex justify-between items-center pb-4 border-b border-border">
          <div>
            <h1 className="text-xl font-extrabold text-foreground uppercase tracking-wider">
              {activeTab === 'dashboard' ? 'Student Dashboard' : 'My Courses'}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">July 2026 | Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 font-bold flex items-center justify-center text-xs">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
            </div>
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* -------------------- 1. STUDENT DASHBOARD VIEW -------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Analytics & Referral Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile Card */}
              <div className="bg-card rounded-3xl p-6 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                    My Profile
                  </h3>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-bold">Full Name</span>
                      <span className="font-bold text-foreground text-sm">{user?.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-bold">Email Address</span>
                      <span className="text-muted-foreground font-medium">{user?.email}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-bold">Date of Birth</span>
                        <span className="text-muted-foreground font-medium">{user?.dob || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-bold">Contact Number</span>
                        <span className="text-muted-foreground font-medium">{user?.contact_number || 'N/A'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block uppercase tracking-wider font-bold mb-1">Account Role</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet & Redemptions Card */}
              <div className="bg-card rounded-3xl p-6 border border-border flex flex-col justify-between space-y-4 relative overflow-hidden">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4.5 w-4.5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Wallet Balance</h3>
                  </div>
                  
                  <div className="bg-background p-3 rounded-xl border border-border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-foreground">₹{walletBalance.toFixed(2)}</span>
                    </div>

                    {walletBalance > 0 && !redemptions.some(r => r.status === 'pending') && (
                      <div className="space-y-1.5 pt-1.5 border-t border-border">
                        <label className="text-[9px] font-black text-muted-foreground block uppercase tracking-wider">
                          Linked Payment Mobile (GPay/PhonePe)
                        </label>
                        <input
                          type="text"
                          placeholder="Enter mobile number"
                          value={redeemPhone}
                          onChange={(e) => setRedeemPhone(e.target.value)}
                          className="w-full bg-card border border-input rounded-lg py-1.5 px-2 text-[10px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                        />
                        <p className="text-[8px] text-muted-foreground leading-relaxed font-semibold">
                          * Redemptions are credited in 1 to 7 business days.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleRedeemRequest}
                      disabled={walletBalance <= 0 || actionLoading || redemptions.some(r => r.status === 'pending') || (walletBalance > 0 && !redeemPhone.trim())}
                      className="w-full py-2 bg-emerald-600 disabled:opacity-50 rounded-lg hover:bg-emerald-500 text-[10px] font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                    >
                      {actionLoading ? 'Sending...' : 'Redeem Cashout'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Redemption Status</h4>
                  <div className="overflow-y-auto max-h-[80px] space-y-1.5 text-[10px]">
                    {redemptions.length === 0 ? (
                      <p className="text-muted-foreground italic">No cashout history.</p>
                    ) : (
                      redemptions.map((red) => (
                        <div key={red.id} className="flex justify-between items-center p-1.5 rounded bg-background border border-border">
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-foreground">₹{red.amount.toFixed(2)}</span>
                            <span className="text-[8px] text-muted-foreground">Ph: {red.payment_phone}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            red.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : red.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
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
              <div className="bg-card rounded-3xl p-6 border border-border flex flex-col justify-between space-y-6 relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                      <Gift className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Referral Center</h3>
                      <p className="text-[10px] text-muted-foreground">Get 25% cash back on friend signups</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
                    <span className="font-mono text-sm font-bold text-foreground tracking-wider uppercase select-all">
                      {user?.referral_code}
                    </span>
                    <button
                      onClick={handleCopyReferral}
                      className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all cursor-pointer"
                      title="Copy Referral ID"
                    >
                      {copied ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> : <Copy className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground border-t border-border pt-3">
                  <span>Friends Referred</span>
                  <span className="text-foreground text-sm font-black">{referralsCount} users</span>
                </div>
              </div>

            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pl-1">Wallet & Referrals Accumulation</h3>
                <BarChart data={getStudentBarData()} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pl-1">Wallet Status Summary</h3>
                <DonutChart segments={getStudentWalletDonut()} />
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 2. MY COURSES VIEW -------------------- */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground">My Active Course Cohorts</h2>

            {enrolledCohorts.length === 0 ? (
              <div className="p-12 text-center bg-card rounded-3xl border border-border space-y-4">
                <Video className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground font-medium">You have not enrolled in any course batches yet.</p>
                <button
                  onClick={() => router.push('/#courses')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Explore Courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCohorts.map(({ enrollmentId, course, batch, payment_status }) => (
                  <div 
                    key={enrollmentId} 
                    className="bg-card rounded-3xl p-6 border border-border flex flex-col justify-between space-y-6 relative overflow-hidden"
                  >
                    <div className={`absolute top-0 right-0 px-4 py-1.5 border-l border-b border-border rounded-bl-2xl text-[10px] font-black uppercase tracking-wider ${
                      payment_status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      {payment_status === 'pending' ? 'Pending Approval' : 'Active Enrolled'}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-foreground leading-snug">{course.name}</h3>
                        <p className="text-xs text-blue-500 font-semibold mt-0.5">{batch.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                          <span>Timings: {course.timings}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                          <span>Days: {course.days_of_week.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                      {payment_status === 'pending' ? (
                        <div className="flex items-center gap-2 w-full p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-[10.5px] text-amber-500 font-bold">
                          <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
                          <span>Verification Pending: GPay reference checks in progress. Link active upon approval.</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-[10px] text-muted-foreground italic">
                            Classes conducted online via Google Meet.
                          </div>
                          
                          {batch.google_meet_link ? (
                            <a
                              href={batch.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Video className="h-4 w-4" />
                              Join Google Meet
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 bg-secondary border border-border text-muted-foreground font-bold rounded-xl text-xs flex items-center gap-1.5"
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
        )}
      </main>
    </div>
  );
}
