'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  DollarSign, 
  Gift, 
  TrendingUp, 
  FileSpreadsheet, 
  BookOpen, 
  UserPlus, 
  Wallet as WalletIcon, 
  Layers, 
  Video, 
  Clock, 
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  ClipboardList,
  ShieldAlert,
  QrCode
} from 'lucide-react';
import { db, getDirectImageUrl, Course, Batch, Profile, Enrollment, Redemption, Wallet } from '@/lib/db';
import DashboardSidebar from '@/components/DashboardSidebar';
import { BarChart, DonutChart } from '@/components/DashboardCharts';

type ActiveTab = 'analytics' | 'verifications' | 'redeem' | 'users' | 'courses' | 'core_team';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<Profile | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<ActiveTab>('analytics');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'mentor' | 'admin'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'completed' | 'failed' | 'all'>('pending');

  // Shared state
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Filter state for Analytics tab
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');

  // QR Manager state
  const [qrEditCourseId, setQrEditCourseId] = useState<string>('');
  const [qrEditUrl, setQrEditUrl] = useState<string>('');

  // Analytics computed results
  const [filteredBatch, setFilteredBatch] = useState<Batch | null>(null);
  const [filteredCourse, setFilteredCourse] = useState<Course | null>(null);
  const [roster, setRoster] = useState<{
    id: string;
    name: string;
    email: string;
    contact?: string;
    enrolledAt: string;
  }[]>([]);
  const [stats, setStats] = useState({
    totalEnrolled: 0,
    totalReferrals: 0,
    totalRevenue: 0
  });

  // Redemption Requests state
  const [pendingRedemptions, setPendingRedemptions] = useState<(Redemption & { studentName?: string; studentEmail?: string })[]>([]);

  // Forms states - Add Course
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('1 Month');
  const [newCourseClasses, setNewCourseClasses] = useState(12);
  const [newCourseTimings, setNewCourseTimings] = useState('6:00 PM - 7:30 PM');
  const [newCourseFees, setNewCourseFees] = useState(9999);
  const [newCourseQrUrl, setNewCourseQrUrl] = useState('');
  const [newCourseDays, setNewCourseDays] = useState<string[]>(['Monday', 'Wednesday']);

  // Forms states - Add Batch
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchCourseId, setNewBatchCourseId] = useState('');
  const [newBatchMentorId, setNewBatchMentorId] = useState('');
  const [newBatchMeetLink, setNewBatchMeetLink] = useState('');
  const [newBatchStartDate, setNewBatchStartDate] = useState('');

  // Forms states - Add Mentor
  const [newMentorName, setNewMentorName] = useState('');
  const [newMentorEmail, setNewMentorEmail] = useState('');
  const [newMentorDob, setNewMentorDob] = useState('');
  const [newMentorPhone, setNewMentorPhone] = useState('');
  const [newMentorSpec, setNewMentorSpec] = useState('');

  // Promotion modal states
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [promotionSpecialization, setPromotionSpecialization] = useState('');

  // Google Meet link editing states for Admin
  const [isEditingMeetLinkAdmin, setIsEditingMeetLinkAdmin] = useState(false);
  const [tempMeetLinkAdmin, setTempMeetLinkAdmin] = useState('');

  // Core promotion modal states
  const [promotingCoreUserId, setPromotingCoreUserId] = useState<string | null>(null);
  const [promotionCoreTeam, setPromotionCoreTeam] = useState('Marketing Team');

  // Team meet link states
  const [teamMeetings, setTeamMeetings] = useState<{ team_name: string; google_meet_link: string | null }[]>([]);
  const [editingTeamName, setEditingTeamName] = useState<string | null>(null);
  const [tempTeamMeetLink, setTempTeamMeetLink] = useState('');

  // Notification states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load all dashboard state
  async function refreshDashboardData() {
    try {
      const currentUser = db.getCurrentUser();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/auth');
        return;
      }
      setAdminUser(currentUser);

      const allCourses = await db.getCourses();
      const allBatches = await db.getBatches();
      const allProfiles = await db.getProfiles();
      const allEnrollments = await db.getEnrollments();
      const allRedemptions = await db.getRedemptions();
      const allWallets = await db.getWallets();

      setCourses(allCourses);
      setBatches(allBatches);
      setProfiles(allProfiles);
      setEnrollments(allEnrollments);
      setWallets(allWallets);
      
      const allTeamMeetings = await db.getTeamMeetings();
      setTeamMeetings(allTeamMeetings);
      
      const activeMentors = allProfiles.filter(p => p.role === 'mentor' || p.role === 'admin');
      setMentors(activeMentors);

      const pendRed = allRedemptions.filter(r => r.status === 'pending');
      setPendingRedemptions(pendRed);

      // Initialize Course and Batch Dropdowns if not set
      if (allCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(allCourses[0].id);
        const relatedBatches = allBatches.filter(b => b.course_id === allCourses[0].id);
        if (relatedBatches.length > 0) {
          setSelectedBatchId(relatedBatches[0].id);
        }
      }

      // Initialize New Batch Course dropdown
      if (allCourses.length > 0 && !newBatchCourseId) {
        setNewBatchCourseId(allCourses[0].id);
      }
      if (activeMentors.length > 0 && !newBatchMentorId) {
        setNewBatchMentorId(activeMentors[0].id);
      }

    } catch (err) {
      console.error('Failed to sync admin details:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDashboardData();
  }, [router]);

  // Handle Dynamic Course / Batch change
  useEffect(() => {
    if (!selectedCourseId) return;

    if (selectedCourseId === 'all') {
      setFilteredCourse(null);
      setFilteredBatch(null);

      const allCompletedEnrollments = enrollments.filter(e => e.payment_status === 'completed');
      const rosterData = allCompletedEnrollments.map(e => {
        const student = profiles.find(p => p.id === e.student_id);
        return {
          id: e.id,
          studentId: e.student_id,
          name: student?.name || 'Unknown Student',
          email: student?.email || 'N/A',
          contact: student?.contact_number,
          enrolledAt: e.created_at || new Date().toISOString()
        };
      });
      setRoster(rosterData);

      const totalEnrolled = allCompletedEnrollments.length;
      const totalReferrals = allCompletedEnrollments.filter(e => e.referred_by_id !== null).length;
      const totalRevenue = allCompletedEnrollments.reduce((sum, e) => sum + e.amount_paid, 0);

      setStats({
        totalEnrolled,
        totalReferrals,
        totalRevenue
      });
      return;
    }

    const matchedCourse = courses.find(c => c.id === selectedCourseId) || null;
    setFilteredCourse(matchedCourse);

    const relatedBatches = batches.filter(b => b.course_id === selectedCourseId);
    
    // Auto-update batch dropdown if the current batch is not in the related course and not 'all'
    let currentBatch = relatedBatches.find(b => b.id === selectedBatchId) || null;
    if (selectedBatchId !== 'all' && !currentBatch && relatedBatches.length > 0) {
      currentBatch = relatedBatches[0];
      setSelectedBatchId(relatedBatches[0].id);
    }
    setFilteredBatch(currentBatch);

    // Compute Roster and Stats
    let targetEnrollments: Enrollment[] = [];
    if (selectedBatchId === 'all' || !currentBatch) {
      targetEnrollments = enrollments.filter(e => e.course_id === selectedCourseId && e.payment_status === 'completed');
    } else {
      targetEnrollments = enrollments.filter(e => e.batch_id === currentBatch.id && e.payment_status === 'completed');
    }

    const rosterData = targetEnrollments.map(e => {
      const student = profiles.find(p => p.id === e.student_id);
      return {
        id: e.id, // enrollment ID
        studentId: e.student_id,
        name: student?.name || 'Unknown Student',
        email: student?.email || 'N/A',
        contact: student?.contact_number,
        enrolledAt: e.created_at || new Date().toISOString()
      };
    });
    setRoster(rosterData);

    const totalEnrolled = targetEnrollments.length;
    const totalReferrals = targetEnrollments.filter(e => e.referred_by_id !== null).length;
    const totalRevenue = targetEnrollments.reduce((sum, e) => sum + e.amount_paid, 0);

    setStats({
      totalEnrolled,
      totalReferrals,
      totalRevenue
    });

  }, [selectedCourseId, selectedBatchId, courses, batches, enrollments, profiles]);

  const getDonutSegments = () => {
    const counts: Record<string, number> = {};
    enrollments.forEach(e => {
      if (e.payment_status === 'completed') {
        const course = courses.find(c => c.id === e.course_id);
        const label = course ? course.name : 'Other';
        counts[label] = (counts[label] || 0) + 1;
      }
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#6b7280'];
    const segs = Object.keys(counts).map((label, idx) => ({
      label,
      value: counts[label],
      color: colors[idx % colors.length]
    }));
    return segs.length > 0 ? segs : [{ label: 'No Cohorts Booked', value: 1, color: '#4b5563' }];
  };

  const getBarChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: Record<string, number> = {};
    
    const now = new Date();
    const last6: { label: string; monthIndex: number; year: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6.push({
        label: months[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear()
      });
    }

    enrollments.forEach(e => {
      if (e.payment_status === 'completed' && e.created_at) {
        const d = new Date(e.created_at);
        const mLabel = months[d.getMonth()];
        dataMap[mLabel] = (dataMap[mLabel] || 0) + e.amount_paid;
      }
    });

    return last6.map(item => ({
      label: item.label,
      value: dataMap[item.label] || 0
    }));
  };

  // Export Student roster to CSV (pure client side)
  const handleExportCSV = () => {
    if (roster.length === 0) return;
    
    const headers = ['Student ID', 'Full Name', 'Email Address', 'Contact Number', 'Enrolled At'];
    const rows = roster.map(s => [
      s.id,
      s.name,
      s.email,
      s.contact || 'N/A',
      new Date(s.enrolledAt).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const courseLabel = filteredCourse ? filteredCourse.name.replace(/\s+/g, '_') : 'All_Courses';
    const batchLabel = filteredBatch ? filteredBatch.name.replace(/\s+/g, '_') : 'All_Batches';
    link.setAttribute('download', `Roster_${courseLabel}_${batchLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Action: Approve wallet redemption
  const handleApproveRedeem = async (id: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const success = await db.approveRedemption(id);
      if (success) {
        setMessage({ type: 'success', text: 'Redemption request approved. Student wallet zeroed out.' });
        await refreshDashboardData();
      } else {
        setMessage({ type: 'error', text: 'Failed to approve redemption.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Action failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Add Course
  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName || !newCourseTimings || newCourseFees <= 0) {
      setMessage({ type: 'error', text: 'Please fill in all course parameters.' });
      return;
    }
    setActionLoading(true);
    setMessage(null);

    try {
      await db.addCourse({
        name: newCourseName,
        description: newCourseDesc,
        duration: newCourseDuration,
        class_count: newCourseClasses,
        days_of_week: newCourseDays,
        timings: newCourseTimings,
        fees: Number(newCourseFees),
        qr_code_url: newCourseQrUrl
      });
      setMessage({ type: 'success', text: `Course "${newCourseName}" successfully published.` });
      // Reset
      setNewCourseName('');
      setNewCourseDesc('');
      setNewCourseQrUrl('');
      await refreshDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to create course.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Add Batch
  const handleAddBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName || !newBatchStartDate || !newBatchCourseId) {
      setMessage({ type: 'error', text: 'Batch Name, Start Date, and Course selection are required.' });
      return;
    }
    setActionLoading(true);
    setMessage(null);

    try {
      await db.addBatch({
        course_id: newBatchCourseId,
        name: newBatchName,
        mentor_id: newBatchMentorId || null,
        google_meet_link: newBatchMeetLink,
        start_date: newBatchStartDate
      });
      setMessage({ type: 'success', text: `Batch "${newBatchName}" successfully created.` });
      setNewBatchName('');
      setNewBatchMeetLink('');
      setNewBatchStartDate('');
      await refreshDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to create batch.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Add Mentor
  const handleAddMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentorName || !newMentorEmail || !newMentorDob || !newMentorPhone || !newMentorSpec) {
      setMessage({ type: 'error', text: 'Please fill in all mentor attributes.' });
      return;
    }
    setActionLoading(true);
    setMessage(null);

    try {
      await db.addMentor({
        name: newMentorName,
        email: newMentorEmail,
        dob: newMentorDob,
        contact_number: newMentorPhone,
        specialization: newMentorSpec
      });
      setMessage({ type: 'success', text: `Mentor "${newMentorName}" registered successfully.` });
      // Reset
      setNewMentorName('');
      setNewMentorEmail('');
      setNewMentorDob('');
      setNewMentorPhone('');
      setNewMentorSpec('');
      await refreshDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to create mentor.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePromoteToMentor = (userId: string) => {
    setPromotingUserId(userId);
    setPromotionSpecialization('');
  };

  const handlePromoteToCore = (userId: string) => {
    setPromotingCoreUserId(userId);
    setPromotionCoreTeam('Marketing Team');
  };

  // Action: Delete Course
  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course? All associated batches will be removed.')) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await db.deleteCourse(id);
      setMessage({ type: 'success', text: 'Course deleted successfully.' });
      await refreshDashboardData();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to delete course.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleDay = (day: string) => {
    if (newCourseDays.includes(day)) {
      setNewCourseDays(newCourseDays.filter(d => d !== day));
    } else {
      setNewCourseDays([...newCourseDays, day]);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-zinc-550 text-sm">Synchronizing admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Left Sidebar */}
      <DashboardSidebar
        currentTab={activeTab}
        onTabChange={(tabKey) => { setActiveTab(tabKey); setMessage(null); }}
        role="admin"
        userName={adminUser?.name || 'Admin'}
        userEmail={adminUser?.email || 'admin@univisioncounsel.com'}
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
              {activeTab === 'analytics' ? 'Dashboard Overview' : 
               activeTab === 'verifications' ? 'Verify Payments' : 
               activeTab === 'redeem' ? 'Redeem Requests' : 
               activeTab === 'users' ? 'Users Directory' : 
               activeTab === 'core_team' ? 'Core Team' : 'Courses & Batches'}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">July 2026 | Welcome back, {adminUser?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            {pendingRedemptions.length > 0 && (
              <span className="px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold rounded-full animate-pulse">
                {pendingRedemptions.length} redeem pending
              </span>
            )}
            <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-500 font-bold flex items-center justify-center text-xs">
              AD
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

        {/* -------------------- 1. ANALYTICS & ROSTER TAB -------------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            
            {/* Top Course/Batch Filters */}
            <div className="p-6 bg-card rounded-3xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <div className="space-y-1 w-full sm:w-60">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 font-bold">All Courses (Overall Revenue)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 w-full sm:w-48">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Batch</label>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {selectedCourseId === 'all' ? (
                      <option value="all" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">All Batches</option>
                    ) : (
                      <>
                        <option value="all" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">All Batches</option>
                        {batches.filter(b => b.course_id === selectedCourseId).map(b => (
                          <option key={b.id} value={b.id} className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">{b.name}</option>
                        ))}
                        {batches.filter(b => b.course_id === selectedCourseId).length === 0 && (
                          <option value="" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">No Batches Active</option>
                        )}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {roster.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 w-full sm:w-auto justify-center shadow-sm"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export to CSV
                </button>
              )}
            </div>

            {/* KPI Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-card rounded-3xl border border-border space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-bold">Total Enrollments</span>
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-foreground">{stats.totalEnrolled}</p>
                <p className="text-[10px] text-muted-foreground">Paid and active student profiles</p>
              </div>

              <div className="p-6 bg-card rounded-3xl border border-border space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-bold">Referred Bookings</span>
                  <Gift className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-foreground">{stats.totalReferrals}</p>
                <p className="text-[10px] text-muted-foreground">Enrollments using referral ID</p>
              </div>

              <div className="p-6 bg-card rounded-3xl border border-border space-y-2">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span className="text-xs font-bold">Total Revenue</span>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-3xl font-black text-foreground">₹{stats.totalRevenue.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">Based on amount paid</p>
              </div>
            </div>

            {/* Visual Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pl-1">Monthly Revenue Trend</h3>
                <BarChart data={getBarChartData()} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider pl-1">Enrollments by Course Cohort</h3>
                <DonutChart segments={getDonutSegments()} />
              </div>
            </div>

            {/* Selected Course Specs */}
            {filteredCourse && (
              <div className="p-6 bg-card rounded-3xl border border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Active Course Specifications</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-muted-foreground">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Course Fee</span>
                    <span className="text-foreground font-bold">₹{filteredCourse.fees}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Duration</span>
                    <span className="text-foreground font-bold">{filteredCourse.duration}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Lectures count</span>
                    <span className="text-white">{filteredCourse.class_count} classes</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Schedule Days</span>
                    <span className="text-white shrink-0 truncate">{filteredCourse.days_of_week.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Batch Settings (Google Meet link management) */}
            {filteredBatch && (
              <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-850 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-450">Active Batch Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-semibold text-zinc-400">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Cohort Start Date</span>
                    <span className="text-white">{filteredBatch.start_date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">Assigned Mentor</span>
                    <span className="text-white">
                      {mentors.find(m => m.id === filteredBatch.mentor_id)?.name || 'No Mentor Assigned'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 block">Google Meet Classroom</span>
                    {isEditingMeetLinkAdmin ? (
                      <div className="flex gap-2 mt-1">
                        <input
                          type="url"
                          value={tempMeetLinkAdmin}
                          onChange={(e) => setTempMeetLinkAdmin(e.target.value)}
                          placeholder="https://meet.google.com/..."
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none w-full max-w-[200px]"
                        />
                        <button
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              const success = await db.updateBatchMeetLink(filteredBatch.id, tempMeetLinkAdmin.trim());
                              if (success) {
                                setMessage({ type: 'success', text: 'Google Meet link updated successfully!' });
                                setIsEditingMeetLinkAdmin(false);
                                await refreshDashboardData();
                              }
                            } catch (err) {
                              console.error(err);
                              setMessage({ type: 'error', text: 'Failed to update Meet link.' });
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          className="px-2 py-1 bg-emerald-650 hover:bg-emerald-500 text-white rounded text-[10px] cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingMeetLinkAdmin(false)}
                          className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white truncate max-w-[180px]">
                          {filteredBatch.google_meet_link || 'Not Scheduled'}
                        </span>
                        <button
                          onClick={() => {
                            setTempMeetLinkAdmin(filteredBatch.google_meet_link || '');
                            setIsEditingMeetLinkAdmin(true);
                          }}
                          className="text-blue-500 hover:text-blue-400 hover:underline text-[10px] cursor-pointer font-bold"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Student Roster Table */}
            <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Users className="h-4.5 w-4.5 text-blue-500" />
                Batch Roster Details
              </h3>

              {roster.length === 0 ? (
                <div className="p-8 text-center text-zinc-650 text-xs italic">
                  No student enrollments in this batch.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Name</th>
                        <th className="pb-3">Email Address</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3 text-right">Enrolled Date</th>
                        <th className="pb-3 text-center pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {roster.map((r) => (
                        <tr key={r.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="py-3.5 pl-2 font-bold text-white">{r.name}</td>
                          <td className="py-3.5 text-zinc-450">{r.email}</td>
                          <td className="py-3.5 text-zinc-450">{r.contact || 'N/A'}</td>
                          <td className="py-3.5 text-right text-zinc-500">
                            {new Date(r.enrolledAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 text-center pr-2">
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to remove ${r.name} from this course batch?`)) {
                                  setActionLoading(true);
                                  try {
                                    const success = await db.removeEnrollment(r.id);
                                    if (success) {
                                      setMessage({ type: 'success', text: `Successfully removed ${r.name} from batch.` });
                                      await refreshDashboardData();
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    setMessage({ type: 'error', text: 'Failed to remove student.' });
                                  } finally {
                                    setActionLoading(false);
                                  }
                                }
                              }}
                              disabled={actionLoading}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Remove Student From Batch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------- 1.5 VERIFY PAYMENTS TAB -------------------- */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <div className="p-6 bg-card rounded-3xl border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Manual Payment Verifications
                </h2>
                <p className="text-xs text-muted-foreground">Verify student payment requests by date & time and authorize cohort access</p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                {(['pending', 'completed', 'failed', 'all'] as const).map((statusVal) => (
                  <button
                    key={statusVal}
                    type="button"
                    onClick={() => setVerificationFilter(statusVal)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                      verificationFilter === statusVal
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
                    }`}
                  >
                    {statusVal === 'pending'
                      ? 'Pending Verification'
                      : statusVal === 'completed'
                      ? 'Verified'
                      : statusVal === 'failed'
                      ? 'Rejected'
                      : 'All Requests'}
                  </button>
                ))}
              </div>
            </div>

            {enrollments.filter(e => verificationFilter === 'all' || e.payment_status === verificationFilter).length === 0 ? (
              <div className="p-16 text-center bg-card rounded-3xl border border-border space-y-4 max-w-xl mx-auto">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="text-foreground font-medium">No payment requests found.</p>
                <p className="text-xs text-muted-foreground">There are no course payment records matching the selected status filter.</p>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-secondary/60 border-b border-border text-muted-foreground uppercase font-black tracking-wider text-[10px]">
                        <th className="p-4">Student Details</th>
                        <th className="p-4">Phone Number</th>
                        <th className="p-4">Request Date & Time</th>
                        <th className="p-4">Course & Batch</th>
                        <th className="p-4">Referral ID</th>
                        <th className="p-4 text-right">Fee Due</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium">
                      {enrollments
                        .filter(e => verificationFilter === 'all' || e.payment_status === verificationFilter)
                        .map((enrollment) => {
                          const studentProfile = profiles.find(p => p.id === enrollment.student_id);
                          const sInfo = {
                            name: studentProfile?.name || 'Unknown Student',
                            email: studentProfile?.email || '',
                            contact: studentProfile?.contact_number || 'N/A'
                          };
                          const courseName = courses.find(c => c.id === enrollment.course_id)?.name || 'Unknown Course';
                          const batchName = batches.find(b => b.id === enrollment.batch_id)?.name || 'Unknown Batch';
                          
                          // Referral ID lookup
                          const referrerProfile = enrollment.referred_by_id 
                            ? profiles.find(p => p.id === enrollment.referred_by_id) 
                            : null;
                          const referralCodeDisplay = referrerProfile?.referral_code || 'None';

                          // Timestamp formatting
                          const reqDate = enrollment.created_at
                            ? new Date(enrollment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                            : 'N/A';
                          const reqTime = enrollment.created_at
                            ? new Date(enrollment.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : 'N/A';

                          return (
                            <tr key={enrollment.id} className="hover:bg-secondary/30 transition-colors">
                              <td className="p-4 space-y-0.5">
                                <p className="font-bold text-foreground text-sm">{sInfo.name}</p>
                                <p className="text-[10px] text-muted-foreground">{sInfo.email}</p>
                              </td>
                              <td className="p-4 font-semibold text-foreground">
                                {sInfo.contact}
                              </td>
                              <td className="p-4 space-y-0.5">
                                <p className="text-foreground font-bold">{reqDate}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{reqTime}</p>
                              </td>
                              <td className="p-4 space-y-0.5">
                                <p className="text-foreground font-bold">{courseName}</p>
                                <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">{batchName}</p>
                              </td>
                              <td className="p-4">
                                <span className="font-mono text-emerald-400 font-bold bg-secondary px-2 py-1 rounded select-all border border-border">
                                  {referralCodeDisplay}
                                </span>
                              </td>
                              <td className="p-4 text-right font-bold text-foreground text-sm">
                                ₹{enrollment.amount_paid.toFixed(2)}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  enrollment.payment_status === 'pending'
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : enrollment.payment_status === 'completed'
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                                }`}>
                                  {enrollment.payment_status === 'pending'
                                    ? 'Pending Verification'
                                    : enrollment.payment_status === 'completed'
                                    ? 'Verified'
                                    : 'Rejected'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                {enrollment.payment_status === 'pending' ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setActionLoading(true);
                                        try {
                                          const success = await db.approveEnrollment(enrollment.id);
                                          if (success) {
                                            setMessage({ type: 'success', text: `Payment verified for ${sInfo.name}. Cohort access granted!` });
                                            await refreshDashboardData();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                          setMessage({ type: 'error', text: 'Verification approval failed.' });
                                        } finally {
                                          setActionLoading(false);
                                        }
                                      }}
                                      disabled={actionLoading}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-[10px] cursor-pointer"
                                    >
                                      Verify Payment
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`Reject payment request from ${sInfo.name}?`)) {
                                          setActionLoading(true);
                                          try {
                                            const success = await db.rejectEnrollment(enrollment.id);
                                            if (success) {
                                              setMessage({ type: 'success', text: `Payment request for ${sInfo.name} rejected.` });
                                              await refreshDashboardData();
                                            }
                                          } catch (err) {
                                            console.error(err);
                                            setMessage({ type: 'error', text: 'Rejection failed.' });
                                          } finally {
                                            setActionLoading(false);
                                          }
                                        }
                                      }}
                                      disabled={actionLoading}
                                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all text-[10px] cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground font-semibold">Processed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------- 2. REDEEM REQUESTS TAB -------------------- */}
        {activeTab === 'redeem' && (
          <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-emerald-400" />
                Redeem Wallet Requests
              </h2>
              <span className="text-xs text-zinc-500">{pendingRedemptions.length} pending requests</span>
            </div>

            {pendingRedemptions.length === 0 ? (
              <div className="py-16 text-center text-zinc-650 text-xs italic bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-900">
                No pending wallet redemption requests currently.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRedemptions.map((red) => (
                  <div 
                    key={red.id}
                    className="p-5 bg-zinc-900 rounded-2xl border border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-800 transition-all"
                  >
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-bold text-white">{red.studentName}</p>
                      <p className="text-xs text-zinc-400">Email: {red.studentEmail}</p>
                      <p className="text-xs font-mono font-bold text-emerald-400">GPay / UPI Mobile: {red.payment_phone}</p>
                      <p className="text-[10px] text-zinc-550">Requested: {red.created_at ? new Date(red.created_at).toLocaleDateString() : 'Today'}</p>
                    </div>

                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs text-zinc-500 block">Requested Cashout</span>
                        <span className="text-lg font-black text-emerald-400">₹{red.amount.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={() => handleApproveRedeem(red.id)}
                        disabled={actionLoading}
                        className="px-4 py-2.5 bg-emerald-650 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                      >
                        Payment Done / Approved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------- 3. USERS DIRECTORY TAB -------------------- */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Filter Bar */}
            <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Users Directory & Permissions
                </h2>
                <p className="text-xs text-zinc-550">View profiles, wallet rewards, and promote students to mentors.</p>
              </div>

              <div className="flex gap-2">
                {(['all', 'student', 'mentor', 'admin'] as const).map((roleVal) => (
                  <button
                    key={roleVal}
                    onClick={() => setUserRoleFilter(roleVal)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                      userRoleFilter === roleVal
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    {roleVal === 'all' ? 'All Roles' : roleVal + 's'}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Directory Table (Full width) */}
            <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registered Profiles</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-905 text-zinc-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">User Details</th>
                      <th className="pb-3">Contact & DOB</th>
                      <th className="pb-3">Role Details</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {profiles
                      .filter(p => userRoleFilter === 'all' || p.role === userRoleFilter)
                      .map((profile) => {
                        const userWallet = wallets.find(w => w.student_id === profile.id);
                        return (
                          <tr key={profile.id} className="hover:bg-zinc-900/20 transition-colors">
                            {/* Name & Email */}
                            <td className="py-4 pl-2 space-y-0.5">
                              <p className="font-bold text-white text-sm">{profile.name}</p>
                              <p className="text-zinc-500 text-xs">{profile.email}</p>
                            </td>

                            {/* DOB & Contact */}
                            <td className="py-4 space-y-0.5">
                              <p className="text-zinc-300 font-medium">{profile.contact_number || 'N/A'}</p>
                              <p className="text-[10px] text-zinc-500">
                                DOB: {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                              </p>
                            </td>

                            {/* Role & Specific Attributes */}
                            <td className="py-4 space-y-1">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                profile.role === 'admin'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : profile.role === 'mentor'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {profile.role}
                              </span>

                              {profile.role === 'student' && (
                                <div className="space-y-0.5 text-[10px] mt-1">
                                  <p className="text-zinc-400">Referral ID: <span className="font-bold text-zinc-300 select-all">{profile.referral_code}</span></p>
                                  <p className="text-emerald-400 font-semibold">Wallet: ₹{userWallet?.balance.toFixed(2) || '0.00'}</p>
                                </div>
                              )}

                              {profile.role === 'mentor' && (
                                <p className="text-[10px] text-zinc-400 mt-1">Spec: {profile.specialization}</p>
                              )}
                            </td>

                            <td className="py-4 text-right pr-2">
                             {profile.role === 'student' ? (
                                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                  <button
                                    onClick={() => handlePromoteToMentor(profile.id)}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all whitespace-nowrap"
                                  >
                                    Promote to Mentor
                                  </button>
                                  <button
                                    onClick={() => handlePromoteToCore(profile.id)}
                                    disabled={actionLoading}
                                    className="px-2.5 py-1.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all whitespace-nowrap"
                                  >
                                    Promote to Core
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-600 font-medium">No actions</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 3.5 CORE TEAM TAB -------------------- */}
        {activeTab === 'core_team' && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Core Team Directory
                </h2>
                <p className="text-xs text-zinc-550">Manage Core Members, assign teams, and schedule team meetings.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Columns: Core Members List */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4 text-left">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Core Team Roster</h3>
                {profiles.filter(p => p.role === 'core').length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 text-xs italic bg-zinc-900/10 rounded-2xl border border-zinc-900">
                    No Core Members registered or promoted yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-555 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Name & Email</th>
                          <th className="pb-3">Contact</th>
                          <th className="pb-3">Assigned Team</th>
                          <th className="pb-3">Referral ID</th>
                          <th className="pb-3 text-right pr-2">Wallet</th>
                          <th className="pb-3 text-right pr-2">Status / Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900">
                        {profiles
                          .filter(p => p.role === 'core')
                          .map((core) => {
                            const coreWallet = wallets.find(w => w.student_id === core.id);
                            return (
                              <tr key={core.id} className="hover:bg-zinc-900/20 transition-colors">
                                <td className="py-4 pl-2 space-y-0.5">
                                  <p className="font-bold text-white text-sm">{core.name}</p>
                                  <p className="text-zinc-500 text-xs">{core.email}</p>
                                </td>
                                <td className="py-4 text-zinc-300 font-medium">
                                  {core.contact_number || 'N/A'}
                                </td>
                                <td className="py-4">
                                  <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                                    {core.specialization || 'No Team'}
                                  </span>
                                </td>
                                <td className="py-4 font-mono font-bold text-zinc-400 select-all">
                                  {core.referral_code}
                                </td>
                                <td className="py-4 text-right pr-2 font-bold text-emerald-400 text-sm">
                                  ₹{coreWallet?.balance.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-4 text-right pr-2">
                                  {core.status === 'pending' ? (
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={async () => {
                                          setActionLoading(true);
                                          try {
                                            const success = await db.approveCoreMember(core.id);
                                            if (success) {
                                              setMessage({ type: 'success', text: `Approved Core Member ${core.name}!` });
                                              await refreshDashboardData();
                                            }
                                          } catch (err) {
                                            console.error(err);
                                          } finally {
                                            setActionLoading(false);
                                          }
                                        }}
                                        className="px-2 py-1 bg-emerald-650 hover:bg-emerald-500 text-white font-bold rounded text-[10px] cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Reject Core Member application for ${core.name}?`)) {
                                            setActionLoading(true);
                                            try {
                                              const success = await db.rejectCoreMember(core.id);
                                              if (success) {
                                                setMessage({ type: 'success', text: `Rejected Core Member ${core.name}.` });
                                                await refreshDashboardData();
                                              }
                                            } catch (err) {
                                              console.error(err);
                                            } finally {
                                              setActionLoading(false);
                                            }
                                          }
                                        }}
                                        className="px-2 py-1 bg-red-650 hover:bg-red-500 text-white font-bold rounded text-[10px] cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                      core.status === 'rejected'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                      {core.status || 'approved'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Schedule Team Meetings */}
              <div className="lg:col-span-1 glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6 text-left">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Video className="h-4.5 w-4.5 text-indigo-400" />
                    Schedule Team Meetings
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    Set Google Meet links for active Core Teams. Core members can view and join these sessions instantly from their workspace.
                  </p>
                </div>

                <div className="space-y-4">
                  {teamMeetings.map((meeting) => (
                    <div key={meeting.team_name} className="p-4 bg-zinc-950 rounded-2xl border border-zinc-850 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-white">{meeting.team_name}</span>
                        {editingTeamName === meeting.team_name ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={async () => {
                                setActionLoading(true);
                                try {
                                  const success = await db.updateTeamMeetLink(meeting.team_name, tempTeamMeetLink.trim());
                                  if (success) {
                                    setMessage({ type: 'success', text: `Meet link for ${meeting.team_name} updated!` });
                                    setEditingTeamName(null);
                                    await refreshDashboardData();
                                  }
                                } catch (err) {
                                  console.error(err);
                                  setMessage({ type: 'error', text: 'Failed to update meeting link.' });
                                } finally {
                                  setActionLoading(false);
                                }
                              }}
                              className="px-2 py-1 bg-emerald-650 hover:bg-emerald-500 text-white font-bold rounded text-[10px] cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTeamName(null)}
                              className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingTeamName(meeting.team_name);
                              setTempTeamMeetLink(meeting.google_meet_link || '');
                            }}
                            className="text-blue-500 hover:text-blue-450 hover:underline text-[10px] font-bold cursor-pointer"
                          >
                            Edit Link
                          </button>
                        )}
                      </div>

                      {editingTeamName === meeting.team_name ? (
                        <input
                          type="url"
                          value={tempTeamMeetLink}
                          onChange={(e) => setTempTeamMeetLink(e.target.value)}
                          placeholder="https://meet.google.com/..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      ) : (
                        <div className="text-[10px] text-zinc-400 break-all font-medium">
                          {meeting.google_meet_link ? (
                            <a
                              href={meeting.google_meet_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {meeting.google_meet_link}
                            </a>
                          ) : (
                            <span className="text-zinc-650 italic">No meeting link scheduled</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- 4. COURSES & BATCHES TAB -------------------- */}
        {activeTab === 'courses' && (
          <div className="space-y-8">

            {/* Payment QR Code Manager Card */}
            <div className="glass-panel rounded-3xl p-6 border border-border space-y-4 text-left">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Configure Course Payment QR Code</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Set or update the UPI QR Code URL or image for any published course. Students checking out will see this configured QR code.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Select Course</label>
                  <select
                    value={qrEditCourseId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setQrEditCourseId(cId);
                      const targetCourse = courses.find(c => c.id === cId);
                      setQrEditUrl(targetCourse?.qr_code_url || '');
                    }}
                    className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">Payment QR Image link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrEditUrl}
                      onChange={(e) => setQrEditUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/... or custom image URL"
                      className="w-full bg-background border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const targetId = qrEditCourseId || (courses.length > 0 ? courses[0].id : '');
                        if (!targetId) return;
                        setActionLoading(true);
                        try {
                          const success = await db.updateCourseQrCode(targetId, qrEditUrl.trim());
                          if (success) {
                            setMessage({ type: 'success', text: 'Payment QR Code updated successfully!' });
                            await refreshDashboardData();
                          }
                        } catch (err) {
                          console.error(err);
                          setMessage({ type: 'error', text: 'Failed to update QR code.' });
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Save QR Code
                    </button>
                  </div>
                </div>
              </div>

              {/* Live QR Preview */}
              {qrEditUrl && (
                <div className="pt-2 flex items-center gap-4 border-t border-border mt-3">
                  <span className="text-xs font-semibold text-muted-foreground">Live QR Preview:</span>
                  <div className="bg-white p-2 rounded-xl border border-border">
                    <img
                      src={getDirectImageUrl(qrEditUrl)}
                      alt="QR Preview"
                      className="h-20 w-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Create Course and Batch Dual Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Add Course Form */}
              <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-400" />
                  Publish New Course
                </h2>

                <form onSubmit={handleAddCourseSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Node.js Advanced API Design"
                      value={newCourseName}
                      onChange={(e) => setNewCourseName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Course Description</label>
                    <textarea
                      placeholder="Provide syllabus outline..."
                      value={newCourseDesc}
                      onChange={(e) => setNewCourseDesc(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none min-h-[60px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">Duration</label>
                      <input
                        type="text"
                        value={newCourseDuration}
                        onChange={(e) => setNewCourseDuration(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">Lecture Count</label>
                      <input
                        type="number"
                        value={newCourseClasses}
                        onChange={(e) => setNewCourseClasses(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">Timings</label>
                      <input
                        type="text"
                        value={newCourseTimings}
                        onChange={(e) => setNewCourseTimings(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-400">Fees (INR / ₹)</label>
                      <input
                        type="number"
                        value={newCourseFees}
                        onChange={(e) => setNewCourseFees(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                        required
                      />
                    </div>
                  </div>



                  {/* Day Checkboxes */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 block">Days of the Week</label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            newCourseDays.includes(day)
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-900 text-zinc-550 border border-zinc-850'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Publish Course
                  </button>
                </form>
              </div>

              {/* Add Batch Form */}
              <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-450" />
                  Schedule New Cohort Batch
                </h2>

                <form onSubmit={handleAddBatchSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Batch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Batch Gamma"
                      value={newBatchName}
                      onChange={(e) => setNewBatchName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Course Selection</label>
                    <select
                      value={newBatchCourseId}
                      onChange={(e) => setNewBatchCourseId(e.target.value)}
                      className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none"
                      required
                    >
                      <option value="" disabled className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">-- Select Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id} className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Assigned Mentor</label>
                    <select
                      value={newBatchMentorId}
                      onChange={(e) => setNewBatchMentorId(e.target.value)}
                      className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none"
                    >
                      <option value="" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">-- No Mentor (Awaiting Assignment) --</option>
                      {mentors.map(m => (
                        <option key={m.id} value={m.id} className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">
                          {m.name} ({m.specialization || (m.role === 'admin' ? 'Admin / Lead Mentor' : 'Mentor')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Google Meet URL</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={newBatchMeetLink}
                      onChange={(e) => setNewBatchMeetLink(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">Start Date</label>
                    <input
                      type="date"
                      value={newBatchStartDate}
                      onChange={(e) => setNewBatchStartDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Schedule Batch
                  </button>
                </form>
              </div>

            </div>

            {/* Courses list with delete button */}
            <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Published Course Catalog ({courses.length})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-550 font-bold">
                      <th className="pb-3 pl-2">Name</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Days</th>
                      <th className="pb-3">Fee</th>
                      <th className="pb-3 text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-zinc-900/20">
                        <td className="py-3 pl-2 font-bold text-white">{course.name}</td>
                        <td className="py-3 text-zinc-400">{course.duration}</td>
                        <td className="py-3 text-zinc-400">{course.days_of_week.join(', ')}</td>
                        <td className="py-3 font-bold text-white">₹{course.fees}</td>
                        <td className="py-3 text-right pr-2">
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      {promotingUserId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="space-y-1 text-left">
              <h3 className="text-lg font-bold text-white">Promote User to Mentor</h3>
              <p className="text-xs text-zinc-400">Specify the specialization area or course category for this mentor.</p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-zinc-400">Mentor Specialization</label>
              <input
                type="text"
                placeholder="e.g. Full-Stack Web Development"
                value={promotionSpecialization}
                onChange={(e) => setPromotionSpecialization(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                autoFocus
              />
            </div>

            <div className="flex gap-3 justify-end text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setPromotingUserId(null)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!promotionSpecialization.trim()) {
                    alert("Specialization is required.");
                    return;
                  }
                  const targetId = promotingUserId;
                  const spec = promotionSpecialization.trim();
                  setPromotingUserId(null);
                  
                  setActionLoading(true);
                  setMessage(null);
                  try {
                    const success = await db.promoteUser(targetId, 'mentor', spec);
                    if (success) {
                      setMessage({ type: 'success', text: 'User successfully promoted to Mentor!' });
                      await refreshDashboardData();
                    } else {
                      setMessage({ type: 'error', text: 'Promotion failed.' });
                    }
                  } catch (err) {
                    console.error(err);
                    setMessage({ type: 'error', text: 'Failed to perform promotion.' });
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}

      {promotingCoreUserId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="space-y-1 text-left">
              <h3 className="text-lg font-bold text-white">Promote User to Core Member</h3>
              <p className="text-xs text-zinc-400">Assign this user to one of the active organization teams.</p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-zinc-400 block mb-1">Select Core Team</label>
              <select
                value={promotionCoreTeam}
                onChange={(e) => setPromotionCoreTeam(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-800 rounded-xl py-3 px-4 text-xs focus:outline-none cursor-pointer"
                autoFocus
              >
                <option value="PR Team" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">PR Team</option>
                <option value="Marketing Team" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">Marketing Team</option>
                <option value="Course Validation Team" className="bg-zinc-900 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-100">Course Validation Team</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end text-xs font-bold pt-2">
              <button
                type="button"
                onClick={() => setPromotingCoreUserId(null)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = promotingCoreUserId;
                  const team = promotionCoreTeam;
                  setPromotingCoreUserId(null);
                  
                  setActionLoading(true);
                  setMessage(null);
                  try {
                    const success = await db.promoteUser(targetId, 'core', team);
                    if (success) {
                      setMessage({ type: 'success', text: 'User successfully promoted to Core Member!' });
                      await refreshDashboardData();
                    } else {
                      setMessage({ type: 'error', text: 'Promotion failed.' });
                    }
                  } catch (err) {
                    console.error(err);
                    setMessage({ type: 'error', text: 'Failed to perform promotion.' });
                  } finally {
                    setActionLoading(false);
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all cursor-pointer"
              >
                Confirm Promotion
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
