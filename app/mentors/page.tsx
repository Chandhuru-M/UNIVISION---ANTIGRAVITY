'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Award, 
  Mail, 
  Phone, 
  Sparkles, 
  ShieldCheck, 
  Briefcase 
} from 'lucide-react';
import { db, Profile } from '@/lib/db';

export default function MentorsPage() {
  const [team, setTeam] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeam() {
      try {
        const allProfiles = await db.getProfiles();
        // Filter for mentors and admins
        const filtered = allProfiles.filter(p => p.role === 'mentor' || p.role === 'admin');
        setTeam(filtered);
      } catch (err) {
        console.error('Failed to load mentors page registry:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden py-16">
      {/* Background radial glow */}
      <div className="hero-glow top-[-100px] right-[-100px] animate-pulse-slow"></div>
      <div className="hero-glow bottom-[-100px] left-[-100px] opacity-60"></div>

      {/* Main Grid container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Univision Counsel Team Directory</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Meet Our <span className="gradient-text">Specialist Mentors & Admins</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
            Univision Counsel is a student-driven collaborative network of experts and mentors. We combine collective experiences, insights, and roadmaps to help students grow and excel.
          </p>
        </div>

        {/* Dynamic List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-muted-foreground text-sm">Loading directory registry...</p>
          </div>
        ) : team.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border max-w-xl mx-auto space-y-4">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">No team members registered yet.</p>
            <p className="text-xs text-muted-foreground/75">Admins and promoted mentors will appear here dynamically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member) => (
              <div 
                key={member.id}
                className="glass-panel glass-panel-hover rounded-3xl p-6 border border-border flex flex-col justify-between space-y-6 relative overflow-hidden group text-left"
              >
                {/* Accent glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                <div className="space-y-4 relative z-10">
                  {/* Badge */}
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      member.role === 'admin'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {member.role === 'admin' ? 'CEO & Founder' : 'Verified Mentor'}
                    </span>
                    
                    {member.role === 'admin' ? (
                      <ShieldCheck className="h-5 w-5 text-purple-400" />
                    ) : (
                      <Briefcase className="h-5 w-5 text-blue-400" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {member.name}
                    </h3>
                    
                    {member.role === 'mentor' && member.specialization && (
                      <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span>Specialization: {member.specialization}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-2 relative z-10 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  {member.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground/70 shrink-0" />
                      <span>{member.contact_number}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recruitment CTA */}
        <div className="glass-panel rounded-3xl p-8 border border-border text-center max-w-4xl mx-auto space-y-4 relative overflow-hidden gradient-border">
          <h2 className="text-xl font-bold text-foreground">Want to Join the Univision Counsel Team?</h2>
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed font-semibold">
            Univision Counsel welcomes students and contributors from all fields of study (Engineering, Medical Sciences, Law, Commerce, Arts, Management, etc.). If you have domain expertise and want to build roadmaps, run mentorship classes, or publish a course, get in touch with us!
          </p>
          <div className="pt-2">
            <a 
              href="mailto:univisioncounsel@gmail.com" 
              className="px-6 py-2.5 bg-secondary border border-border hover:bg-accent text-foreground text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Mail className="h-4 w-4 text-blue-500" />
              Apply via Email
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
