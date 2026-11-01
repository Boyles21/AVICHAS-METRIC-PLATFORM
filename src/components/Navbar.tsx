import React, { useState } from 'react';
import {
  Building2,
  Menu,
  PhoneCall,
  User,
  X,
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
  | 'legal';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, subTarget?: string) => void;
  currentUser: UserProfile | null;
  onSignOut?: () => void;
  onOpenAssessmentModal: (defaultService?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  onNavigate,
  currentUser,
  onSignOut,
  onOpenAssessmentModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // All 9 Main Navigation items from Part I Section 3
  const navItems: { id: ActivePage; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'schools', label: 'Solutions' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'academy', label: 'Academy' },
    { id: 'insights', label: 'Insights' },
    { id: 'about', label: 'About Avichas' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'portal', label: currentUser ? 'Client Portal' : 'Sign In' },
  ];

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="sticky top-0 z-40 bg-[#0B1F33] text-white border-b border-white/10">
      {/* Top Contact & Trust Strip */}
      <div className="bg-[#071524] text-[11px] text-stone-300 border-b border-white/10 py-1.5 px-6">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono-tabular">
            <span className="text-[#C9B58B]">CAC: 9880947</span>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span className="hidden sm:inline">Make Your Business Work Smarter.</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="tel:+12348156687"
              className="inline-flex items-center gap-1.5 text-stone-200 hover:text-[#C9B58B] transition-colors font-mono-tabular"
            >
              <PhoneCall className="w-3 h-3 text-[#C9B58B]" />
              <span>Ava AI Receptionist: +1 (234) 815-6687</span>
            </a>

            {currentUser && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/20">
                <span className="text-white font-medium">{currentUser.name}</span>
                <span className="text-[#C9B58B] font-mono-tabular">({currentUser.role.toUpperCase()})</span>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleNavClick('admin')}
                    className="ml-1 text-[11px] text-[#C9B58B] hover:underline font-semibold"
                  >
                    Admin Console
                  </button>
                )}
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="ml-2 text-stone-400 hover:text-white underline"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header with All 9 Main Nav Items */}
      <header className="max-w-[1360px] mx-auto flex items-center justify-between gap-4 px-6 py-3.5">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="text-xl font-semibold tracking-tight text-white font-editorial whitespace-nowrap shrink-0 text-left"
        >
          Avichas Metrics
        </button>

        {/* Desktop Navigation: All 9 Main Items visible */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-stone-200">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 ${
                activePage === item.id ? 'border-[#C9B58B] text-white font-semibold' : 'border-transparent text-stone-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Primary Action Button & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onOpenAssessmentModal()}
            className="px-4 py-2 text-xs font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors whitespace-nowrap"
          >
            Start an Assessment
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-stone-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown: All 9 Items */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#071524] border-t border-white/10 px-6 py-4 space-y-2 text-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left py-2 px-3 rounded text-xs ${
                activePage === item.id ? 'bg-[#0B1F33] text-[#C9B58B] font-semibold' : 'text-stone-300 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}

          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleNavClick('admin')}
              className="block w-full text-left py-2 px-3 rounded text-xs text-[#C9B58B] font-semibold"
            >
              Central Administration Console
            </button>
          )}

          {currentUser && onSignOut && (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded text-xs text-stone-400 hover:text-white"
            >
              Sign Out ({currentUser.email})
            </button>
          )}
        </div>
      )}
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
              <div>Trusted foundation for intelligent execution.</div>
            </div>

            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:+12348156687"
                className="p-3 rounded-md border border-white/15 bg-white/5 hover:border-[#C9B58B] transition-colors block"
              >
                <div className="text-xs text-[#C9B58B] font-medium">AI Receptionist — Phone Calls</div>
                <div className="text-sm font-semibold text-white font-mono-tabular mt-0.5">+1 (234) 815-6687</div>
                <div className="text-xs text-stone-400 mt-0.5">Handled by Ava (Voice Line)</div>
              </a>

              <a
                href="https://wa.me/2348165705114?text=Hello%20Avichas%20Metrics%20Limited%2C%20I%20would%20like%20to%20make%20a%20business%20enquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-md border border-white/15 bg-white/5 hover:border-[#C9B58B] transition-colors block"
              >
                <div className="text-xs text-[#C9B58B] font-medium">WhatsApp Business Enquiries</div>
                <div className="text-sm font-semibold text-white font-mono-tabular mt-0.5">08165705114</div>
                <div className="text-xs text-stone-400 mt-0.5">Intl: +234 816 570 5114</div>
              </a>
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white tracking-wider uppercase">Platform & Services</div>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Services Catalogue
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('schools')} className="hover:text-white transition-colors">
                  School Solutions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('subscriptions')}
                  className="hover:text-white transition-colors"
                >
                  Subscriptions & Pricing
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('academy')} className="hover:text-white transition-colors">
                  Avichas Academy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('insights')} className="hover:text-white transition-colors">
                  Insights & AI Blog
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Corporate & Client Portal */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-white tracking-wider uppercase">Company & Support</div>
            <ul className="space-y-2 text-sm">
              <li>
                <button type="button" onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  About Avichas
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact Us
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('portal')} className="hover:text-white transition-colors">
                  Client Portal / Sign In
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Required Legal Policies */}
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
    </footer>
  );
};
