'use client';

import React from 'react';
import { 
  LayoutGrid, 
  TrendingUp, 
  BookOpen, 
  Layers, 
  Eye, 
  Users, 
  UserSquare2, 
  GraduationCap, 
  Wallet, 
  Gift,
  Sun,
  Moon,
  LogOut
} from 'lucide-react';
import LinkNext from 'next/link';

interface SidebarItem {
  name: string;
  icon: React.ComponentType<any>;
  tabKey: string;
}

interface SidebarCategory {
  title: string;
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  currentTab: string;
  onTabChange: (tabKey: any) => void;
  role: 'admin' | 'mentor' | 'core' | 'student';
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export default function DashboardSidebar({ 
  currentTab, 
  onTabChange, 
  role, 
  userName, 
  userEmail,
  onLogout 
}: DashboardSidebarProps) {

  // Define categories based on role
  const getCategories = (): SidebarCategory[] => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'OVERVIEW',
            items: [
              { name: 'Dashboard', icon: LayoutGrid, tabKey: 'analytics' },
              { name: 'Revenue', icon: TrendingUp, tabKey: 'analytics' }
            ]
          },
          {
            title: 'COURSES',
            items: [
              { name: 'All courses', icon: BookOpen, tabKey: 'courses' },
              { name: 'Categories', icon: Layers, tabKey: 'courses' },
              { name: 'Revisit stats', icon: Eye, tabKey: 'analytics' }
            ]
          },
          {
            title: 'PEOPLE',
            items: [
              { name: 'Mentors', icon: Users, tabKey: 'users' },
              { name: 'Students', icon: GraduationCap, tabKey: 'users' },
              { name: 'Core Team', icon: UserSquare2, tabKey: 'core_team' }
            ]
          },
          {
            title: 'FINANCE',
            items: [
              { name: 'Wallets', icon: Wallet, tabKey: 'redeem' },
              { name: 'Referrals', icon: Gift, tabKey: 'verifications' }
            ]
          }
        ];

      case 'mentor':
        return [
          {
            title: 'OVERVIEW',
            items: [
              { name: 'Dashboard', icon: LayoutGrid, tabKey: 'workspace' }
            ]
          },
          {
            title: 'PEOPLE',
            items: [
              { name: 'Student Roster', icon: Users, tabKey: 'workspace' }
            ]
          }
        ];

      case 'core':
        return [
          {
            title: 'OVERVIEW',
            items: [
              { name: 'Dashboard', icon: LayoutGrid, tabKey: 'workspace' }
            ]
          },
          {
            title: 'FINANCE',
            items: [
              { name: 'Wallets', icon: Wallet, tabKey: 'workspace' },
              { name: 'Referrals', icon: Gift, tabKey: 'workspace' }
            ]
          }
        ];

      default: // student
        return [
          {
            title: 'OVERVIEW',
            items: [
              { name: 'Dashboard', icon: LayoutGrid, tabKey: 'workspace' }
            ]
          },
          {
            title: 'FINANCE',
            items: [
              { name: 'Wallets', icon: Wallet, tabKey: 'workspace' },
              { name: 'Referrals', icon: Gift, tabKey: 'workspace' }
            ]
          }
        ];
    }
  };

  const categories = getCategories();

  return (
    <aside className="w-64 bg-[#0a0a0c] border-r border-border min-h-screen flex flex-col justify-between shrink-0 text-left">
      <div className="p-6 space-y-8">
        {/* Brand Heading */}
        <div className="flex items-center justify-between">
          <LinkNext href="/" className="flex items-center gap-1.5 group">
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-primary transition-colors">
              Univision<span className="text-blue-500">.</span>
            </span>
          </LinkNext>
        </div>

        {/* Navigation Categories */}
        <div className="space-y-6">
          {categories.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest block px-3">
                {cat.title}
              </span>
              <ul className="space-y-1">
                {cat.items.map((item, itemIdx) => {
                  const isActive = currentTab === item.tabKey;
                  const Icon = item.icon;
                  return (
                    <li key={itemIdx}>
                      <button
                        onClick={() => onTabChange(item.tabKey)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-blue-600/10 text-blue-550 dark:text-blue-400 font-bold' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                        }`}
                      >
                        <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <span>{item.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-border bg-card/10 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0">
            {userName ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{userName || 'User Profile'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{userEmail || 'email@example.com'}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
