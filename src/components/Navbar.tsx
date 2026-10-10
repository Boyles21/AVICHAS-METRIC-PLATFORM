import React from 'react';
import {
  Building2,
  CheckCircle2,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Palette,
  PhoneCall,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { LegalPolicyDocument, UserProfile } from '../types';

export type ActivePage =
  | 'home'
  | 'services'
  | 'schools'
  | 'subscriptions'
  | 'academy'
  | 'insights'
  | 'about'
  | 'contact'
  | 'portal'
  | 'admin'
  | 'legal'
  | 'register_spec';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, subTarget?: string) => void;
  currentUser: UserProfile;
  allPersonaUsers: UserProfile[];
  onSwitchUser: (userId: string) => void;
  brandTheme: 'part-ii' | 'part-i';
  onToggleBrandTheme: () => void;
  onOpenAssessmentModal: (defaultService?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  currentUser,
  allPersonaUsers,
  onSwitchUser,
  brandTheme,
  onToggleBrandTheme,
  onOpenAssessmentModal,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-[#0B1F33] text-white border-b border-white/10">
      {/* Mandatory 3-Zone Top Bar Contract */}
      <header className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="text-xl font-semibold tracking-tight text-white font-editorial whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-[#B5965A]"
        >
          Avichas Metrics
        </button>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activePage === 'services' ? 'border-[#B5965A] text-white' : 'border-transparent'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => onNavigate('schools')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activePage === 'schools' ? 'border-[#B5965A] text-white' : 'border-transparent'
            }`}
          >
            School Solutions
          </button>
          <button
            type="button"
            onClick={() => onNavigate('subscriptions')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activePage === 'subscriptions' ? 'border-[#B5965A] text-white' : 'border-transparent'
            }`}
          >
            Subscriptions
          </button>
          <button
            type="button"
            onClick={() => onNavigate('academy')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activePage === 'academy' ? 'border-[#B5965A] text-white' : 'border-transparent'
            }`}
          >
            Academy
          </button>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activePage === 'insights' ? 'border-[#B5965A] text-white' : 'border-transparent'
            }`}
          >
            Insights
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onOpenAssessmentModal()}
            className="px-4 py-2 text-xs font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Start an Assessment
          </button>
        </div>
      </header>

      {/* Secondary Workspace & Ecosystem Toolbar (Below Header) */}
      <div className="bg-[#071524] border-t border-white/10 text-xs text-stone-300">
        <div className="max-w-[1360px] mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Full Architecture Pathways */}
          <div className="flex items-center gap-4 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'home' ? 'text-[#C9B58B] font-semibold' : ''
              }`}
            >
              Overview
            </button>
            <span aria-hidden="true" className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'about' ? 'text-[#C9B58B] font-semibold' : ''
              }`}
            >
              About Avichas
            </button>
            <span aria-hidden="true" className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'contact' ? 'text-[#C9B58B] font-semibold' : ''
              }`}
            >
              Contact Us
            </button>
            <span aria-hidden="true" className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => onNavigate('portal')}
              className={`inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'portal' ? 'text-[#C9B58B] font-semibold' : ''
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#C9B58B]" />
              Client Portal
            </button>
            <span aria-hidden="true" className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className={`inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'admin' ? 'text-[#C9B58B] font-semibold' : ''
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C9B58B]" />
              Central Admin
            </button>
            <span aria-hidden="true" className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => onNavigate('register_spec')}
              className={`inline-flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'register_spec' ? 'text-[#C9B58B] font-semibold' : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9B58B]" />
              Pre-Launch Register & Spec
            </button>
          </div>

          {/* Right: Ava Phone Channel + Active Role Persona + Brand Token Switcher */}
          <div className="flex items-center gap-4 flex-wrap">
            <a
              href="tel:+12348156687"
              className="inline-flex items-center gap-1.5 text-stone-200 hover:text-[#C9B58B] transition-colors whitespace-nowrap shrink-0 font-mono-tabular"
              title="Call Ava — Avichas Metrics AI Phone Receptionist"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#C9B58B]" />
              <span>Ava AI Receptionist: +1 (234) 815-6687</span>
            </a>

            <span aria-hidden="true" className="text-white/20 hidden sm:inline">|</span>

            <button
              type="button"
              onClick={onToggleBrandTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-stone-200 transition-colors whitespace-nowrap shrink-0"
              title="Reconcile Part I vs Part II Brand Tokens (Page 14-15 Note)"
            >
              <Palette className="w-3.5 h-3.5 text-[#C9B58B]" />
              <span>
                Tokens: {brandTheme === 'part-ii' ? 'Part II (Canela / Muted Gold)' : 'Part I (Playfair / Stone)'}
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#C9B58B]" />
              <label htmlFor="persona-select" className="sr-only">
                Active Role Persona
              </label>
              <select
                id="persona-select"
                value={currentUser.id}
                onChange={(e) => onSwitchUser(e.target.value)}
                className="bg-[#0B1F33] border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#C9B58B]"
              >
                {allPersonaUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    Role: {u.role.toUpperCase()} — {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FooterProps {
  policies: LegalPolicyDocument[];
  onNavigate: (page: ActivePage, subTarget?: string) => void;
  onOpenPolicy: (policySlug: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ policies, onNavigate, onOpenPolicy }) => {
  return (
    <footer className="bg-[#0B1F33] text-stone-300 border-t border-white/10 mt-20">
      <div className="max-w-[1360px] mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Col 1 & 2: Brand & Official Contact Channels */}
          <div className="lg:col-span-2 space-y-4">
            <div className="font-editorial text-2xl font-semibold text-white tracking-tight">
              Avichas Metrics Limited
            </div>
            <p className="text-sm text-stone-300 max-w-md leading-relaxed">
              Make Your Business Work Smarter. Business intelligence, AI-powered productivity, sales efficiency, school
              licensing, and executive learning systems.
            </p>
            <div className="text-xs text-stone-400 space-y-1 font-mono-tabular pt-1">
              <div>CAC Registration: 9880947</div>
              <div>Closing Statement: Trusted foundation for intelligent execution.</div>
            </div>

            {/* Distinct Official Contact Channels (Part II Section 1) */}
            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:+12348156687"
                className="p-3 rounded-md border border-white/15 bg-white/5 hover:border-[#C9B58B] transition-colors block"
              >
                <div className="text-xs text-[#C9B58B] font-medium">AI Receptionist — Phone Calls</div>
                <div className="text-sm font-semibold text-white font-mono-tabular mt-0.5">+1 (234) 815-6687</div>
                <div className="text-xs text-stone-400 mt-0.5">Handled by Ava (Voice Line Only)</div>
              </a>

              <a
                href="https://wa.me/2348165705114?text=Hello%20Avichas%20Metrics%20Limited%2C%20I%20would%20like%20to%20make%20a%20business%20enquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-md border border-white/15 bg-white/5 hover:border-[#C9B58B] transition-colors block"
              >
                <div className="text-xs text-[#C9B58B] font-medium">WhatsApp Business Enquiries</div>
                <div className="text-sm font-semibold text-white font-mono-tabular mt-0.5">08165705114</div>
                <div className="text-xs text-stone-400 mt-0.5">Intl: +234 816 570 5114 (Chat Channel)</div>
              </a>
            </div>
          </div>

          {/* Col 3: Platform Architecture */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white tracking-wider uppercase">Platform & Portals</div>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Services Catalogue
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('schools')} className="hover:text-white transition-colors">
                  School AI & Licensing Portal
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subscriptions')}
                  className="hover:text-white transition-colors"
                >
                  Naira Subscriptions & Pricing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('academy')} className="hover:text-white transition-colors">
                  Avichas Academy LMS
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('insights')} className="hover:text-white transition-colors">
                  Insights & AI News Blog
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('portal')} className="hover:text-white transition-colors">
                  Client Portal / Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Governance & Developer Handover */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white tracking-wider uppercase">Governance & Spec</div>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  About Avichas Metrics
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact & Assessment Desk
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('admin')} className="hover:text-white transition-colors">
                  Central Administration
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('register_spec')}
                  className="hover:text-white transition-colors text-[#C9B58B]"
                >
                  Pre-Launch Confirmation Register
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('register_spec', 'phases')}
                  className="hover:text-white transition-colors"
                >
                  5-Phase Delivery Roadmap
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Required Legal & Trust Section (Part II Section 4) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white tracking-wider uppercase">Legal & Trust Policies</div>
            <ul className="space-y-2 text-sm">
              {policies.map((pol) => (
                <li key={pol.id}>
                  <button
                    type="button"
                    onClick={() => onOpenPolicy(pol.slug)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {pol.shortTitle}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-400">
          <div>
            © {new Date().getFullYear()} Avichas Metrics Limited (CAC Registration: 9880947). All rights reserved.
          </div>
          <div>
            Trusted foundation for intelligent execution · Nigeria Data Protection Act (NDPA) Aligned Architecture
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Business Contact Icon (Part II Section 1B — Distinct from Ava AI Phone Line) */}
      <a
        href="https://wa.me/2348165705114?text=Hello%20Avichas%20Metrics%20Limited%2C%20I%20have%20an%20enquiry%20about%20your%20services."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0B1F33] text-white border border-[#C9B58B] shadow-lg hover:bg-[#14314F] transition-colors text-xs font-medium"
        aria-label="Open WhatsApp Business Chat with Avichas Metrics Limited (08165705114)"
      >
        <MessageSquare className="w-4 h-4 text-[#C9B58B]" />
        <span>WhatsApp Business: 08165705114</span>
      </a>
    </footer>
  );
};
