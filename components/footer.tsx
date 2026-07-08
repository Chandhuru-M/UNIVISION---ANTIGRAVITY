import Link from 'next/link';
import { BookOpen, Code, Globe, Briefcase, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="support" className="bg-zinc-950 border-t border-zinc-900 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/10 border border-blue-500/20">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Univision<span className="text-blue-500">Counsel</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Empowering learners around the globe through premium tech education, custom mentorship, and transparent class management.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition-colors" title="Socials"><Globe className="h-4 w-4" /></a>
              <a href="#" className="hover:text-white transition-colors" title="Repository"><Code className="h-4 w-4" /></a>
              <a href="#" className="hover:text-white transition-colors" title="Careers"><Briefcase className="h-4 w-4" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Navigations</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#courses" className="hover:text-white transition-colors">Explore Courses</Link></li>
              <li><Link href="/#about" className="hover:text-white transition-colors">Our Vision & Mission</Link></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Student Log In</Link></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Mentor Join</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Help & Support</h3>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Contact Details</h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <span>univisioncounsel@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                <span>+91 8438304400</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Chennai, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-650 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Univision Counsel. All rights reserved.</p>
          <p>Designed with premium aesthetics for optimal experience.</p>
        </div>
      </div>
    </footer>
  );
}
