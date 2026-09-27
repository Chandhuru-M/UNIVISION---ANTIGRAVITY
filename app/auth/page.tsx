'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LinkNext from 'next/link';
import { Sparkles, Mail, Lock, User, Calendar, Phone, Gift, ArrowRight, Eye, EyeOff, BookOpen, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';
import { db, Profile } from '@/lib/db';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [activeTab, setActiveTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | 'admin'>('student');
  
  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  
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
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleRoleLogin = async (role: 'student' | 'mentor' | 'admin') => {
    setSelectedRole(role);
    setError('');
    setSuccess('');
    setLoading(true);

    let targetEmail = 'alice@example.com';
    if (role === 'admin') targetEmail = 'admin@example.com';
    else if (role === 'mentor') targetEmail = 'mentor@example.com';
    else if (role === 'student') targetEmail = 'alice@example.com';

    setTimeout(async () => {
      const profilesList = await db.getProfiles();
      const user = profilesList.find(p => p.email.toLowerCase() === targetEmail.toLowerCase());
      if (user) {
        db.setCurrentUser(user);
        setSuccess(`Logged in as ${user.name} (${role})`);
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 800);
      } else {
        // Fallback create preset user
        let nameVal = role === 'admin' ? 'Mohamed Jaris (CEO & Founder)' : role === 'mentor' ? 'Mohamed Jaris' : 'Alice Student';
        const profile = await db.registerUser(targetEmail, nameVal, role, '2004-08-15', '+91 8438304400');
        db.setCurrentUser(profile);
        setSuccess(`Logged in as ${profile.name} (${role})`);
        setTimeout(() => {
          router.push(redirect);
          router.refresh();
        }, 800);
      }
      setLoading(false);
    }, 450);
  };

  return (
    <div className="max-w-md w-full mx-auto my-6 px-4">
      {/* Brand Header Logo */}
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <LinkNext href="/" className="flex items-center gap-2.5 mb-2">
          <img src="/logo.jpg" alt="Univision Counsel Logo" className="h-10 w-auto rounded-xl object-contain" />
          <span className="text-2xl font-extrabold tracking-tight gradient-text">
            UnivisionCounsel
          </span>
        </LinkNext>
        <p className="text-xs text-muted-foreground">Course Booking & LMS Platform</p>
      </div>

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
                  type={showSignInPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none"
                  aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignInPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end text-xs pt-1">
              <button
                type="button"
                onClick={() => { setActiveTab('forgot'); setError(''); setSuccess(''); }}
                className="text-blue-500 hover:text-blue-400 hover:underline cursor-pointer font-bold"
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
                    type={showSignUpPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none"
                    aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="signup-confirm">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/60" />
                  <input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
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

      {/* ROLE SELECTION SECTION */}
      <div className="mt-8 p-6 bg-card rounded-3xl border border-border text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 tracking-wider uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Select Role to Login</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Choose your account role for quick authentication
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => handleRoleLogin('student')}
            className={`py-3 px-3 border rounded-xl font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
              selectedRole === 'student'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                : 'bg-secondary border-border text-foreground hover:border-blue-500/50 hover:bg-secondary/80'
            }`}
          >
            <GraduationCap className="h-4 w-4 shrink-0 text-blue-400" />
            <span>Login as Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleLogin('mentor')}
            className={`py-3 px-3 border rounded-xl font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
              selectedRole === 'mentor'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                : 'bg-secondary border-border text-foreground hover:border-blue-500/50 hover:bg-secondary/80'
            }`}
          >
            <UserCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Login as Mentor</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleLogin('admin')}
            className={`py-3 px-3 border rounded-xl font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
              selectedRole === 'admin'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-sm'
                : 'bg-secondary border-border text-foreground hover:border-blue-500/50 hover:bg-secondary/80'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 text-purple-400" />
            <span>Login as Admin</span>
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

