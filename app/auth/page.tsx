'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Mail, Lock, User, Calendar, Phone, Award, Gift, ArrowRight } from 'lucide-react';
import { db, Profile } from '@/lib/db';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Sign Up Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [referredByCode, setReferredByCode] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCoreSignUp, setIsCoreSignUp] = useState(false);
  const [coreTeam, setCoreTeam] = useState('Marketing Team');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const current = db.getCurrentUser();
    if (current) {
      if (current.role === 'core' && current.status === 'pending') {
        db.setCurrentUser(null);
        setError('Your Core Member account is pending admin approval.');
      } else if (current.role === 'core' && current.status === 'rejected') {
        db.setCurrentUser(null);
        setError('Your Core Member application has been rejected.');
      } else {
        router.push(redirect);
      }
    }

    const errParam = searchParams.get('error');
    if (errParam === 'pending') {
      setError('Your Core Member account is pending admin approval.');
    } else if (errParam === 'rejected') {
      setError('Your Core Member application has been rejected.');
    }
  }, [router, redirect, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!signInEmail || !signInPassword) {
      setError('Please fill in both email and password.');
      setLoading(false);
      return;
    }

    try {
      const user = await db.signIn(signInEmail, signInPassword);
      db.setCurrentUser(user);
      setSuccess(`Logged in successfully as ${user.name}!`);
      setTimeout(() => {
        router.push(redirect);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !dob || !contactNumber || !signUpPassword || !confirmPassword) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const specVal = isCoreSignUp ? coreTeam : undefined;
      const roleVal = isCoreSignUp ? 'core' : 'student';

      const profile = await db.registerUser(
        email,
        name,
        roleVal,
        dob,
        contactNumber,
        specVal,
        referredByCode || undefined,
        signUpPassword
      );

      if (roleVal === 'core') {
        setSuccess('Application submitted! Pending admin approval.');
        setActiveTab('signin');
      } else {
        setSuccess('Registration successful! Logging you in...');
        db.setCurrentUser(profile);
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!forgotEmail) {
      setError('Please enter your email.');
      setLoading(false);
      return;
    }

    try {
      await db.resetPassword(forgotEmail);
      setSuccess('Reset instructions sent! Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (presetRole: 'admin' | 'mentor' | 'core-member' | 'student-alice' | 'student-bob') => {
    setError('');
    setSuccess('');
    setLoading(true);

    let targetEmail = 'alice@example.com';
    if (presetRole === 'admin') targetEmail = 'admin@example.com';
    else if (presetRole === 'mentor') targetEmail = 'mentor@example.com';
    else if (presetRole === 'core-member') targetEmail = 'core@example.com';
    else if (presetRole === 'student-bob') targetEmail = 'bob@example.com';

    setTimeout(async () => {
      const profilesList = await db.getProfiles();
      const user = profilesList.find(p => p.email.toLowerCase() === targetEmail.toLowerCase());
      if (user) {
        if (user.role === 'core' && user.status === 'pending') {
          setError('Demo Bypass blocked: core member status is pending admin approval.');
          setLoading(false);
          return;
        }
        db.setCurrentUser(user);
        setSuccess(`Demo Bypass: Logged in as ${user.name} (${user.role})`);
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 800);
      } else {
        // Fallback create
        let nameVal = presetRole === 'admin' ? 'Mohamed Jaris (CEO & Founder)' : presetRole === 'mentor' ? 'Mohamed Jaris' : presetRole === 'core-member' ? 'Jaris Core' : 'Alice Student';
        let roleVal: 'student' | 'mentor' | 'admin' | 'core' = presetRole === 'admin' ? 'admin' : presetRole === 'mentor' ? 'mentor' : presetRole === 'core-member' ? 'core' : 'student';
        let specVal = presetRole === 'core-member' ? 'Marketing Team' : undefined;
        const profile = await db.registerUser(targetEmail, nameVal, roleVal, '2004-08-15', '+91 8438304400', specVal);
        db.setCurrentUser(profile);
        router.push(redirect);
        router.refresh();
      }
      setLoading(false);
    }, 450);
  };

  return (
    <div className="max-w-md w-full mx-auto my-12 px-4">
      {/* Tab Selectors */}
      <div className="flex border-b border-border mb-8 bg-card/45 p-1 rounded-2xl">
        <button
          onClick={() => { setActiveTab('signin'); setError(''); }}
          className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'signin' 
              ? 'bg-secondary text-foreground shadow-sm font-bold' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setActiveTab('signup'); setError(''); }}
          className={`flex-1 py-3 text-center text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'signup' 
              ? 'bg-secondary text-foreground shadow-sm font-bold' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden gradient-border">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 text-left">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 animate-pulse text-left">
            {success}
          </div>
        )}

        {activeTab === 'signin' && (
          /* SIGN IN FORM */
          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-1 text-center sm:text-left mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">Welcome Back</h2>
              <p className="text-xs text-muted-foreground">Sign in to your learning portal profile</p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="signin-email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  id="signin-email"
                  type="email"
                  placeholder="name@example.com"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="signin-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end text-xs pt-1">
              <button
                type="button"
                onClick={() => { setActiveTab('forgot'); setError(''); setSuccess(''); }}
                className="text-blue-500 hover:text-blue-450 hover:underline cursor-pointer font-bold"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-center text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-550/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Continue to Dashboard'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {activeTab === 'signup' && (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-1 text-center sm:text-left mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">Get Started</h2>
              <p className="text-xs text-muted-foreground">Create your cohort account and start booking</p>
            </div>

            {/* Full Name */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-name">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  id="signup-name"
                  type="text"
                  placeholder="Alice Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  id="signup-email"
                  type="email"
                  placeholder="alice@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              {/* DOB */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-dob">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="signup-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-phone">Contact No.</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="signup-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-password">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-confirm">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Student Referral Code */}
            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-ref">Referral ID (Optional)</label>
                <span className="text-[10px] text-muted-foreground/70">Get cash back for your friend</span>
              </div>
              <div className="relative">
                <Gift className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  id="signup-ref"
                  type="text"
                  placeholder="REF-1234ABCD"
                  value={referredByCode}
                  onChange={(e) => setReferredByCode(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono tracking-wider text-xs uppercase"
                />
              </div>
            </div>

            {/* Core Member Checkbox */}
            <div className="pt-2 flex flex-col gap-4 bg-secondary p-4 rounded-2xl border border-border text-left">
              <div className="flex items-center gap-2">
                <input
                  id="signup-iscore"
                  type="checkbox"
                  checked={isCoreSignUp}
                  onChange={(e) => setIsCoreSignUp(e.target.checked)}
                  className="rounded border-border bg-background text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <label className="text-xs font-bold text-foreground cursor-pointer" htmlFor="signup-iscore">
                  Signing up as a Core Team Member?
                </label>
              </div>

              {isCoreSignUp && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Select Core Team</label>
                  <select
                    value={coreTeam}
                    onChange={(e) => setCoreTeam(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="PR Team">PR Team</option>
                    <option value="Marketing Team">Marketing Team</option>
                    <option value="Course Validation Team">Course Validation Team</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-center text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-550/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {activeTab === 'forgot' && (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="space-y-1 text-center sm:text-left mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">Reset Password</h2>
              <p className="text-xs text-muted-foreground">Request a password reset link for your account</p>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="forgot-email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-center text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-550/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Send Recovery Instructions'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex justify-center text-xs pt-2">
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setError(''); setSuccess(''); }}
                className="text-muted-foreground hover:text-foreground cursor-pointer font-bold flex items-center gap-1 transition-all"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* QUICK LOGINS FOR DEMO TESTING */}
      <div className="mt-8 p-6 bg-card rounded-3xl border border-border text-center space-y-4">
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 tracking-wider uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Quick Demo Bypass Panel</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          One-click login to preset roles to verify course dashboards and referral payout mechanics.
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleQuickLogin('admin')}
            className="py-2.5 px-3 bg-secondary border border-border hover:border-accent-teal hover:bg-accent rounded-xl font-bold text-foreground transition-all cursor-pointer"
          >
            🔑 Admin Portal
          </button>
          <button
            onClick={() => handleQuickLogin('mentor')}
            className="py-2.5 px-3 bg-secondary border border-border hover:border-accent-teal hover:bg-accent rounded-xl font-bold text-foreground transition-all cursor-pointer"
          >
            🧑‍🏫 Mentor Portal
          </button>
          <button
            onClick={() => handleQuickLogin('core-member')}
            className="py-2.5 px-3 bg-secondary border border-border hover:border-accent-teal hover:bg-accent rounded-xl font-bold text-foreground transition-all cursor-pointer col-span-2"
          >
            👥 Core Team Member
          </button>
          <button
            onClick={() => handleQuickLogin('student-alice')}
            className="py-2.5 px-3 bg-secondary border border-border hover:border-accent-teal hover:bg-accent rounded-xl font-bold text-foreground transition-all cursor-pointer col-span-2"
          >
            🎓 Student 1: Alice (Referrer)
          </button>
          <button
            onClick={() => handleQuickLogin('student-bob')}
            className="py-2.5 px-3 bg-secondary border border-border hover:border-accent-teal hover:bg-accent rounded-xl font-bold text-foreground transition-all cursor-pointer col-span-2"
          >
            🎓 Student 2: Bob (Referred by Alice)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}
