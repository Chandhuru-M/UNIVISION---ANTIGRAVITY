'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet as WalletIcon, 
  Gift, 
  ExternalLink, 
  Clock, 
  Video, 
  AlertCircle,
  Copy,
  CheckCircle,
  Users,
  Compass
} from 'lucide-react';
import { db, Course, Profile, Enrollment, Redemption } from '@/lib/db';
import DashboardSidebar from '@/components/DashboardSidebar';
import { BarChart, DonutChart } from '@/components/DashboardCharts';

interface ReferralRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  courseFee: number;
  rewardEarned: number;
  date: string;
}

export default function CoreDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  
  // Dashboard states
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  const [referralList, setReferralList] = useState<ReferralRecord[]>([]);
  const [teamMeetingLink, setTeamMeetingLink] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redeemPhone, setRedeemPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadCoreDashboardData() {
      try {
        const currentUser = db.getCurrentUser();
        if (!currentUser || currentUser.role !== 'core') {
          router.push('/auth');
          return;
        }
        if (currentUser.status === 'pending') {
          db.setCurrentUser(null);
          router.push('/auth?error=pending');
          return;
        }
        if (currentUser.status === 'rejected') {
          db.setCurrentUser(null);
          router.push('/auth?error=rejected');
          return;
        }
        setUser(currentUser);

        // Fetch Wallet
        const wallet = await db.getWallet(currentUser.id);
        if (wallet) setWalletBalance(wallet.balance);

        // Fetch all profiles and enrollments to build referrals list
        const allProfiles = await db.getProfiles();
        const allEnrollments = await db.getEnrollments();
        const allCourses = await db.getCourses();

        // Referrals count: profiles referred
        const referredProfiles = allProfiles.filter(p => p.referred_by_id === currentUser.id);
        setReferralsCount(referredProfiles.length);

        // Successful referrals list: completed enrollments referred by this core user
        const successfulReferrals = allEnrollments
          .filter(e => e.referred_by_id === currentUser.id && e.payment_status === 'completed')
          .map(e => {
            const student = allProfiles.find(p => p.id === e.student_id);
            const course = allCourses.find(c => c.id === e.course_id);
            const fee = e.amount_paid;
            const reward = fee * 0.10; // Core Member: 10% reward

            return {
              id: e.id,
              studentName: student?.name || 'Unknown Student',
              studentEmail: student?.email || 'N/A',
              courseName: course?.name || 'Unknown Course',
              courseFee: fee,
              rewardEarned: reward,
              date: e.created_at || new Date().toISOString()
            };
          });

        setReferralList(successfulReferrals);

        // Fetch Team Meetings
        const meetings = await db.getTeamMeetings();
        const myMeeting = meetings.find(m => m.team_name === currentUser.specialization);
        if (myMeeting) {
          setTeamMeetingLink(myMeeting.google_meet_link);
        }

        // Fetch Redemptions
        const redemptionList = await db.getRedemptions(currentUser.id);
        setRedemptions(redemptionList);

      } catch (err) {
        console.error('Failed to load core dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCoreDashboardData();
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
      setWalletBalance(0);
      setRedeemPhone('');
      
      setMessage({ 
        type: 'success', 
        text: `Redemption request of ₹${amount.toFixed(2)} submitted successfully! Processed within 1 to 7 business days.` 
      });
    } catch (err) {
      console.error('Redeem error:', err);
      setMessage({ type: 'error', text: 'Failed to request redemption. Try again later.' });
    } finally {
      setActionLoading(false);
    }
  };

  const getCoreBarData = () => {
    return [
      { label: 'Jan', value: 0 },
      { label: 'Feb', value: 0 },
      { label: 'Mar', value: Math.round(walletBalance * 0.2) },
      { label: 'Apr', value: Math.round(walletBalance * 0.5) },
      { label: 'May', value: Math.round(walletBalance * 0.8) },
      { label: 'Jun', value: walletBalance }
    ];
  };

  const getCoreDonutData = () => {
    const redeemedAmount = redemptions
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + r.amount, 0);
    return [
      { label: 'Available Wallet', value: walletBalance, color: '#3b82f6' },
      { label: 'Redeemed Payouts', value: redeemedAmount, color: '#10b981' }
    ];
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-zinc-550 text-sm">Synchronizing core workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <DashboardSidebar
        currentTab="workspace"
        onTabChange={() => {}}
        role="core"
        userName={user?.name || 'Core Member'}
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
            <h1 className="text-xl font-extrabold text-white uppercase tracking-wider">
              Core Member Dashboard
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">July 2026 | Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CO'}
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

      {/* Profile & Wallet Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Details */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4 relative overflow-hidden text-left">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
          
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
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Contact No</span>
                  <span className="text-zinc-300 font-semibold">{user?.contact_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase tracking-wider font-bold">Assigned Team</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black inline-block mt-0.5">
                    {user?.specialization || 'General Member'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refer & Earn */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4 relative overflow-hidden text-left">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2">
              Refer & Earn
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Share your unique referral ID with students. When they enroll and make payments, you receive a limitless **10% cash reward** of the respective course fee.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">My Referral ID</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 font-mono font-bold text-white text-xs select-all flex items-center justify-between">
                  <span>{user?.referral_code || 'Awaiting promotion'}</span>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="p-2.5 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  title="Copy Referral ID"
                >
                  {copied ? <CheckCircle className="h-4.5 w-4.5 text-emerald-400" /> : <Copy className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Limitless Wallet */}
        <div className="glass-panel rounded-3xl p-6 border border-zinc-800 flex flex-col justify-between space-y-4 relative overflow-hidden text-left">
          <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-2">
              Limitless Wallet
            </h3>
            
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-400 font-semibold">Available Balance:</span>
              <span className="text-2xl font-black text-emerald-400">₹{walletBalance.toFixed(2)}</span>
            </div>

            {walletBalance > 0 ? (
              <div className="space-y-2">
                <input
                  type="tel"
                  placeholder="GPay/PhonePe Mobile No."
                  value={redeemPhone}
                  onChange={(e) => setRedeemPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
                <button
                  onClick={handleRedeemRequest}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-emerald-650 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <WalletIcon className="h-4 w-4" />
                  Redeem Wallet Cash
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-zinc-550 italic font-semibold leading-relaxed">
                * Accumulate cash back rewards from successful referrals. Cash can be redeemed at any time.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pl-1">Wallet & Referrals Accumulation</h3>
          <BarChart data={getCoreBarData()} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pl-1">Wallet Status Summary</h3>
          <DonutChart segments={getCoreDonutData()} />
        </div>
      </div>

      {/* Meeting Rooms & Redemption History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Referrals Table */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4 text-left">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-indigo-400" />
            Referrals History ({referralList.length})
          </h3>

          {referralList.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs italic bg-zinc-900/10 rounded-2xl border border-zinc-900">
              No successful student enrollments recorded under your referral code yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-550 font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Referred Student</th>
                    <th className="pb-3">Course Name</th>
                    <th className="pb-3">Enrollment Fee</th>
                    <th className="pb-3 text-right pr-2">My Payout (10%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {referralList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="py-3.5 pl-2 space-y-0.5">
                        <p className="font-bold text-white">{rec.studentName}</p>
                        <p className="text-zinc-500 text-[10px]">{rec.studentEmail}</p>
                      </td>
                      <td className="py-3.5 text-zinc-300 font-medium">{rec.courseName}</td>
                      <td className="py-3.5 text-zinc-400 font-semibold">₹{rec.courseFee.toFixed(2)}</td>
                      <td className="py-3.5 text-right pr-2 font-bold text-emerald-400">
                        +₹{rec.rewardEarned.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Meetings and Redemption Logs */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Active Team Meeting */}
          <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4 text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Video className="h-4.5 w-4.5 text-indigo-400" />
              Team Classroom
            </h3>

            {teamMeetingLink ? (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  An active team meet link has been set by the administrator for the **{user?.specialization}**. Click below to launch the video meeting room.
                </p>
                <a
                  href={teamMeetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-blue-500/10"
                >
                  <Video className="h-4 w-4" />
                  Join Team Meeting
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-900 text-center space-y-3">
                <Compass className="h-8 w-8 text-zinc-650 mx-auto" />
                <p className="text-zinc-400 font-bold text-xs">No Active Sessions</p>
                <p className="text-[10px] text-zinc-550 leading-relaxed">
                  There are no scheduled video conferences for the **{user?.specialization || 'your team'}** currently. Check back later!
                </p>
              </div>
            )}
          </div>

          {/* Redemption Requests History */}
          <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4 text-left">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-indigo-400" />
              Cashout Logs
            </h3>

            {redemptions.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No cashout history found.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {redemptions.map((red) => (
                  <div key={red.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex justify-between items-center text-xs font-semibold">
                    <div className="space-y-1">
                      <p className="text-white">Amount: ₹{red.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-zinc-500">To: {red.payment_phone}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-wider ${
                        red.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {red.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
      </main>
    </div>
  );
}
