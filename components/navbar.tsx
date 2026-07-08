'use client';

import { useEffect, useState } from 'react';
import LinkNext from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, User, LogOut, Menu, X, Wallet as WalletIcon, Sun, Moon } from 'lucide-react';
import { db, Profile } from '@/lib/db';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Read user from db helper
    const currentUser = db.getCurrentUser();
    setUser(currentUser);

    if (currentUser && (currentUser.role === 'student' || currentUser.role === 'core')) {
      db.getWallet(currentUser.id).then(wallet => {
        if (wallet) setWalletBalance(wallet.balance);
      });
    }

    // Scroll listener for sticky background blur transition
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initialize Theme
    const savedTheme = localStorage.getItem('univision_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = 'dark';
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('univision_theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setUser(null);
    setWalletBalance(null);
    router.push('/');
    router.refresh();
  };

  const getDashboardLink = (role: string) => {
    switch (role) {
      case 'admin': return '/dashboard/admin';
      case 'mentor': return '/dashboard/mentor';
      case 'core': return '/dashboard/core';
      default: return '/dashboard/student';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-background/85 backdrop-blur-md border-b border-border/50 py-3 shadow-sm' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <LinkNext href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 transition-all">
                <BookOpen className="h-6 w-6 text-indigo-500" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                Univision<span className="text-emerald-500">Counsel</span>
              </span>
            </LinkNext>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <LinkNext href="/#courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Courses
            </LinkNext>
            <LinkNext href="/mentors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Mentors
            </LinkNext>
            <LinkNext href="/#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About Us
            </LinkNext>
            <LinkNext href="/#support" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Support
            </LinkNext>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer bg-secondary border border-border"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-amber-500" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-600" />
              )}
            </button>

            {user ? (
              <>
                {(user.role === 'student' || user.role === 'core') && walletBalance !== null && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground">
                    <WalletIcon className="h-4 w-4 text-emerald-400" />
                    <span>Wallet: ₹{walletBalance.toFixed(2)}</span>
                  </div>
                )}
                
                <LinkNext
                  href={getDashboardLink(user.role)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-xl hover:bg-secondary hover:border-border transition-all"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Dashboard
                </LinkNext>

                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <LinkNext
                href="/auth"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-650/20 transition-all"
              >
                Sign In
              </LinkNext>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border backdrop-blur-lg px-4 pt-2 pb-6 space-y-4">
          <LinkNext
            href="/#courses"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Courses
          </LinkNext>
          <LinkNext
            href="/mentors"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Mentors
          </LinkNext>
          <LinkNext
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            About Us
          </LinkNext>
          <LinkNext
            href="/#support"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            Support
          </LinkNext>
          
          <div className="pt-4 border-t border-border space-y-3">
            {/* Mobile Theme Toggle */}
            <div className="flex justify-between items-center px-3 py-2 text-sm font-semibold">
              <span className="text-muted-foreground">Appearance</span>
              <button
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground font-bold"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-500" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-indigo-500" />
                    Dark Mode
                  </>
                )}
              </button>
            </div>

            {user ? (
              <>
                {(user.role === 'student' || user.role === 'core') && walletBalance !== null && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground">
                    <WalletIcon className="h-5 w-5 text-emerald-400" />
                    <span>Wallet Balance: ₹{walletBalance.toFixed(2)}</span>
                  </div>
                )}
                <LinkNext
                  href={getDashboardLink(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-base font-medium text-foreground bg-card border border-border"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  Dashboard
                </LinkNext>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-base font-medium text-red-450 bg-red-500/10"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <LinkNext
                href="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-3 rounded-xl text-base font-semibold text-white bg-blue-650 hover:bg-blue-500"
              >
                Sign In / Sign Up
              </LinkNext>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
