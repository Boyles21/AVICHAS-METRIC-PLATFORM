import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  Palette,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';
import {
  DevelopmentPhaseSpec,
  LegalPolicyDocument,
  PreLaunchConfirmationItem,
  UserProfile,
} from '../types';

interface SpecAndLegalViewProps {
  mode: 'about' | 'contact' | 'legal' | 'register_spec';
  currentUser: UserProfile;
  policies: LegalPolicyDocument[];
  selectedPolicySlug?: string;
  confirmations: PreLaunchConfirmationItem[];
  developmentPhases: DevelopmentPhaseSpec[];
  brandTheme: 'part-ii' | 'part-i';
  onToggleBrandTheme: () => void;
  onRefreshData: () => Promise<void>;
}

export const SpecAndLegalView: React.FC<SpecAndLegalViewProps> = ({
  mode,
  currentUser,
  policies,
  selectedPolicySlug,
  confirmations,
  developmentPhases,
  brandTheme,
  onToggleBrandTheme,
  onRefreshData,
}) => {
  const [activePolicySlug, setActivePolicySlug] = useState<string>(
    selectedPolicySlug || policies[0]?.slug || 'terms-and-conditions'
  );

  // Contact / Assessment Form State
  const [enqType, setEnqType] = useState<'Service Assessment' | 'Custom Quotation' | 'School Onboarding Enquiry'>(
    'Service Assessment'
  );
  const [fullName, setFullName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceInterest, setServiceInterest] = useState('AI-Powered Sales Efficiency & Business Productivity');
  const [message, setMessage] = useState('');
  const [formNotice, setFormNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Admin Policy Editing State (Part II Section 5: Make policies easy for an authorised administrator to update)
  const activePolicy = policies.find((p) => p.slug === activePolicySlug) || policies[0];
  const [editingPolicySummary, setEditingPolicySummary] = useState<string>(activePolicy?.summary || '');
  const [policyUpdateSaved, setPolicyUpdateSaved] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormNotice(null);
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: enqType,
        fullName,
        organisation,
        email,
        phone,
        serviceInterest,
        message,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setFormNotice({
        ok: true,
        text: 'Enquiry validated and logged on the server. Our team will respond within 1 business day.',
      });
      setFullName('');
      setOrganisation('');
      setEmail('');
      setPhone('');
      setMessage('');
      await onRefreshData();
    } else {
      setFormNotice({
        ok: false,
        text: data.error || 'Submission failed validation.',
      });
    }
  };

  const handleUpdateConfirmationStatus = async (id: string, status: PreLaunchConfirmationItem['status']) => {
    await fetch(`/api/confirmations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({ status }),
    });
    await onRefreshData();
  };

  const handleAdminSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePolicy) return;
    setPolicyUpdateSaved(null);
    const res = await fetch(`/api/policies/${activePolicy.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({
        summary: editingPolicySummary,
      }),
    });
    if (res.ok) {
      setPolicyUpdateSaved(`Policy "${activePolicy.shortTitle}" updated with new revision date.`);
      await onRefreshData();
    }
  };

  // MODE 1: ABOUT AVICHAS METRICS LIMITED
  if (mode === 'about') {
    return (
      <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
        <div className="bg-[#0B1F33] text-white rounded-md p-8 sm:p-12 border border-white/10 space-y-4">
          <div className="text-xs text-[#C9B58B] font-mono-tabular">
            AVICHAS METRICS LIMITED · CAC REGISTRATION: 9880947 · NIGERIA & INTERNATIONAL
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold font-editorial tracking-tight">
            Trusted Foundation for Intelligent Execution.
          </h1>
          <p className="text-base text-stone-200 max-w-3xl leading-relaxed">
            Avichas Metrics Limited is a Nigerian business technology and intelligence company helping organisations
            improve sales efficiency, operational productivity, executive decision-making, and educational
            administration through practical, measurable systems.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-stone-200 rounded-md p-6 space-y-2">
            <div className="text-xs font-mono-tabular text-[#4778A8]">CORE CUSTOMER JOURNEY</div>
            <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">Commercial Lifecycle</h2>
            <p className="text-xs text-stone-600 leading-relaxed font-mono-tabular">
              Discover Avichas → Understand the Solution → Register → Subscribe → Pay → Onboard → Use the Service →
              Measure Value → Renew or Expand.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-6 space-y-2">
            <div className="text-xs font-mono-tabular text-[#4778A8]">ACADEMY LEARNER JOURNEY</div>
            <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">Competency Lifecycle</h2>
            <p className="text-xs text-stone-600 leading-relaxed font-mono-tabular">
              Discover a Course → Register → Enrol → Pay if Required → Learn → Track Progress → Complete.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-md p-6 space-y-2">
            <div className="text-xs font-mono-tabular text-[#4778A8]">CONTENT JOURNEY</div>
            <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">Authority & Trust Lifecycle</h2>
            <p className="text-xs text-stone-600 leading-relaxed font-mono-tabular">
              Research → Review → Publish → Educate → Build Trust → Generate Enquiries.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // MODE 2: CONTACT US & OFFICIAL CONTACT CHANNELS (Part II Section 1)
  if (mode === 'contact') {
    return (
      <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
        <div className="border-b border-stone-300 pb-6 space-y-2">
          <div className="text-xs text-[#4778A8] font-mono-tabular">
            PART II SECTION 1 · OFFICIAL CONTACT CHANNELS & DIAGNOSTIC ASSESSMENT DESK
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
            Contact Avichas Metrics Limited
          </h1>
          <p className="text-sm text-stone-600 max-w-2xl">
            Our AI Phone Receptionist (Ava) and our WhatsApp Business desk operate as two distinct channels. Choose your
            preferred channel below or submit a structured assessment request.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Distinct Official Contact Channels (Part II Section 1A & 1B) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0B1F33] text-white rounded-md p-6 sm:p-8 space-y-4 border border-white/10">
              <div className="text-xs text-[#C9B58B] font-mono-tabular">
                CHANNEL A · AI RECEPTIONIST (PHONE CALLS ONLY)
              </div>
              <h2 className="text-2xl font-semibold font-editorial">Call Ava, Our AI Receptionist</h2>
              <p className="text-xs text-stone-300 leading-relaxed">
                Incoming telephone calls are handled by Ava, the Avichas Metrics AI receptionist, for immediate service
                orientation and assessment booking.
              </p>
              <div className="text-xl font-semibold font-mono-tabular text-[#C9B58B]">+1 (234) 815-6687</div>
              <a
                href="tel:+12348156687"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-[#C9B58B] text-[#0B1F33] rounded-md hover:bg-[#B5965A]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call +1 (234) 815-6687 Directly</span>
              </a>
            </div>

            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-4">
              <div className="text-xs text-[#4778A8] font-mono-tabular">
                CHANNEL B · WHATSAPP BUSINESS ENQUIRIES (DISTINCT FROM AVA VOICE LINE)
              </div>
              <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
                WhatsApp Business Messaging
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                For customer enquiries, service questions, and business communication via WhatsApp. (Supplied Nigerian
                number: <code className="font-mono-tabular">08165705114</code> · International format:{' '}
                <code className="font-mono-tabular">+234 816 570 5114</code>).
              </p>
              <div className="text-xl font-semibold font-mono-tabular text-[#0B1F33]">
                08165705114 (+234 816 570 5114)
              </div>
              <a
                href="https://wa.me/2348165705114?text=Hello%20Avichas%20Metrics%20Limited%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F33] rounded-md hover:bg-[#163452]"
              >
                <MessageSquare className="w-4 h-4 text-[#C9B58B]" />
                <span>Open WhatsApp Business Conversation</span>
              </a>
            </div>
          </div>

          {/* Right: Validated Assessment & Quotation Form */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-stone-200 pb-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                SERVER-VALIDATED ENQUIRY & DIAGNOSTIC ASSESSMENT FORM
              </div>
              <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
                Request an Assessment or Custom Quotation
              </h2>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Enquiry Type</label>
                  <select
                    value={enqType}
                    onChange={(e) => setEnqType(e.target.value as typeof enqType)}
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md bg-white"
                  >
                    <option value="Service Assessment">Diagnostic Business Assessment</option>
                    <option value="Custom Quotation">Custom Project Quotation</option>
                    <option value="School Onboarding Enquiry">School AI Solutions Onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Primary Service Area</label>
                  <select
                    value={serviceInterest}
                    onChange={(e) => setServiceInterest(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md bg-white"
                  >
                    <option value="AI-Powered Sales Efficiency & Business Productivity">
                      01. AI-Powered Sales Efficiency & Productivity
                    </option>
                    <option value="Business Intelligence & Performance Measurement">
                      02. Business Intelligence & Performance Measurement
                    </option>
                    <option value="AI-Powered Business Operations">03. AI-Powered Business Operations</option>
                    <option value="Execution Intelligence">04. Execution Intelligence</option>
                    <option value="Institutional Intelligence">05. Institutional Intelligence</option>
                    <option value="AI Solutions for Schools">06. AI Solutions for Schools</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Organisation or School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    placeholder="Company or School Name"
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organisation.ng"
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Operational Problem or Objectives *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the sales, data, operational, or school reporting challenge you want to solve..."
                  className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md"
              >
                Submit Validated Enquiry
              </button>
            </form>

            {formNotice && (
              <div
                className={`p-3.5 rounded border text-xs ${
                  formNotice.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {formNotice.text}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MODE 3: LEGAL & TRUST POLICIES (Part II Section 4 & 5)
  if (mode === 'legal') {
    return (
      <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-8">
        {/* Mandatory Pre-Launch Legal Review Banner (Part II Section 4 & 5: Do not publish placeholder legal text as if it were final, approved policy) */}
        <div className="bg-amber-50 border border-amber-300 rounded-md p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-amber-950">
            <div className="font-semibold">
              PRE-LAUNCH LEGAL DISCLOSURE (PART II SECTIONS 4 & 5 COMPLIANCE)
            </div>
            <p>
              These 6 policy documents are structured specifically around Avichas Metrics Limited’s actual technical
              architecture (including local school n8n instances, central Licensing API telemetry, Paystack/Flutterwave
              webhooks, and Ava AI Receptionist). Per Part II Section 4 & 5, they are explicitly marked{' '}
              <strong>“Draft — Pending Nigerian Legal Counsel Review”</strong> and must be signed off by a qualified
              Nigerian legal practitioner under the Nigeria Data Protection Act (NDPA) before public production launch.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 6 Policy Navigation List */}
          <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-md p-4 space-y-1.5">
            <div className="text-xs font-mono-tabular text-stone-500 px-2 pb-2 border-b border-stone-200">
              6 MANDATORY LEGAL & TRUST POLICIES
            </div>
            {policies.map((pol, i) => (
              <button
                key={pol.id}
                type="button"
                onClick={() => {
                  setActivePolicySlug(pol.slug);
                  setEditingPolicySummary(pol.summary);
                  setPolicyUpdateSaved(null);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded text-xs font-medium transition-colors ${
                  activePolicy.slug === pol.slug
                    ? 'bg-[#0B1F33] text-white font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                0{i + 1}. {pol.title}
              </button>
            ))}
          </aside>

          {/* Right: Policy Document Reader + Admin Update Tool */}
          {activePolicy && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-stone-200 rounded-md p-8 space-y-6">
                <div className="border-b border-stone-200 pb-5 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-mono-tabular">
                    <span>Last Updated: {activePolicy.lastUpdated}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-800 font-semibold">{activePolicy.counselApprovalStatus}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#0B1F33] font-editorial">
                    {activePolicy.title}
                  </h1>
                  <div className="text-xs text-[#4778A8] font-mono-tabular">{activePolicy.regulatoryFramework}</div>
                  <p className="text-sm text-stone-600 pt-1">{activePolicy.summary}</p>
                </div>

                <div className="space-y-6">
                  {activePolicy.sections.map((sec, idx) => (
                    <div key={idx} className="space-y-2">
                      <h2 className="text-base font-semibold text-[#0B1F33] font-editorial">{sec.heading}</h2>
                      <p className="text-sm text-stone-700 leading-relaxed">{sec.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Policy Editor (Part II Section 5: Make policies easy for an authorised administrator to update) */}
              {currentUser.role === 'admin' && (
                <div className="bg-[#EDE7D9] border border-stone-300 rounded-md p-6 space-y-4">
                  <div className="text-xs font-mono-tabular text-[#0B1F33]">
                    ADMINISTRATOR POLICY CMS (PART II SECTION 5)
                  </div>
                  <h3 className="text-base font-semibold text-[#0B1F33] font-editorial">
                    Update Policy Executive Summary & Revision Date
                  </h3>
                  <form onSubmit={handleAdminSavePolicy} className="space-y-3">
                    <textarea
                      rows={2}
                      value={editingPolicySummary}
                      onChange={(e) => setEditingPolicySummary(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-md"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
                    >
                      Save Policy Revision & Update Timestamp
                    </button>
                  </form>
                  {policyUpdateSaved && (
                    <div className="text-xs text-emerald-900 font-medium">{policyUpdateSaved}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // MODE 4: PRE-LAUNCH CONFIRMATION REGISTER, BRAND RECONCILER & 5 DEVELOPMENT PHASES (Appendix Page 16 & Section 17-20)
  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-14">
      {/* Header */}
      <div className="bg-[#0B1F33] text-white rounded-md p-8 sm:p-10 border border-white/10 space-y-3">
        <div className="text-xs text-[#C9B58B] font-mono-tabular">
          PART I SECTIONS 17–21 & PART II SECTION 6 + APPENDIX (PAGE 16)
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold font-editorial tracking-tight">
          Pre-Launch Confirmation Register, Brand Reconciliation & Phased Delivery Plan
        </h1>
        <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
          Consolidates all open items marked for final confirmation in the specification, reconciles Part I vs. Part II
          brand tokens, and documents the 5-Phase development estimates, dependencies, and acceptance criteria.
        </p>
      </div>

      {/* 1. Part I vs Part II Brand Palette & Typography Reconciler (Part II Section 2, 3 & 6) */}
      <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <div className="text-xs font-mono-tabular text-[#4778A8]">
              PART II SECTION 2 & 3 NOTE · DESIGN TOKEN RECONCILIATION
            </div>
            <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
              Reconciling Part I (Initial Visual Identity) vs. Part II (Supplied Brand Assets)
            </h2>
          </div>
          <button
            type="button"
            onClick={onToggleBrandTheme}
            className="px-4 py-2 text-xs font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Palette className="w-4 h-4" />
            <span>
              Switch Active Preview Theme (Currently: {brandTheme === 'part-ii' ? 'Part II' : 'Part I'})
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="p-5 rounded border border-stone-200 bg-stone-50 space-y-3">
            <div className="font-mono-tabular font-semibold text-[#0B1F33]">
              PART I PALETTE & TYPEFACES (PAGE 3)
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono-tabular">
              <div className="p-2 rounded bg-[#0B1F33] text-white">Deep Navy: #0B1F33</div>
              <div className="p-2 rounded bg-[#C9B58B] text-[#0B1F33]">Gold / Bronze: #C9B58B</div>
              <div className="p-2 rounded bg-[#EDE7D9] text-[#0B1F33] border border-stone-300">Stone: #EDE7D9</div>
              <div className="p-2 rounded bg-[#2E3A44] text-white">Charcoal: #2E3A44</div>
            </div>
            <div className="text-stone-600">
              Primary Typeface: <strong>Montserrat</strong> · Secondary Typeface: <strong>Playfair Display</strong>
            </div>
          </div>

          <div className="p-5 rounded border border-stone-200 bg-stone-50 space-y-3">
            <div className="font-mono-tabular font-semibold text-[#0B1F33]">
              PART II PALETTE & TYPEFACES (PAGES 14–15)
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono-tabular">
              <div className="p-2 rounded bg-[#C8C1B5] text-[#0B1F33]">Obsidian (Supplied): #C8C1B5</div>
              <div className="p-2 rounded bg-[#B5965A] text-white">Muted Gold: #B5965A</div>
              <div className="p-2 rounded bg-[#4778A8] text-white">AI Blue: #4778A8</div>
              <div className="p-2 rounded bg-white text-[#0B1F33] border border-stone-300">
                Warm Ivory / Navy / Stone: TBC
              </div>
            </div>
            <div className="text-stone-600">
              Primary Typeface: <strong>Canela</strong> (Editorial Headings) · Secondary:{' '}
              <strong>Neue Haas Grotesk</strong> (Body/UI)
            </div>
          </div>
        </div>
      </div>

      {/* 2. Appendix — Pre-Launch Confirmation Register (Page 16 Table) */}
      <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
        <div className="p-6 border-b border-stone-200">
          <div className="text-xs font-mono-tabular text-[#4778A8]">
            APPENDIX (PAGE 16) · PRE-LAUNCH CONFIRMATION REGISTER
          </div>
          <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial mt-1">
            9 Mandatory Pre-Launch Decisions & Sign-Off Evidence
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Items explicitly marked for confirmation remain tracked below. Administrators can update status as written
            approvals are recorded.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase">
                <th className="py-3 px-4">Item & Spec Ref</th>
                <th className="py-3 px-4">Required Decision / Evidence</th>
                <th className="py-3 px-4">Implemented Platform Resolution</th>
                <th className="py-3 px-4">Status</th>
                {currentUser.role === 'admin' && <th className="py-3 px-4 text-right">Update Sign-Off</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {confirmations.map((c) => (
                <tr key={c.id} className="hover:bg-stone-50">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#0B1F33]">{c.item}</div>
                    <div className="text-[11px] text-stone-500 font-mono-tabular">{c.partReference}</div>
                  </td>
                  <td className="py-3.5 px-4 text-stone-700 max-w-xs">{c.requiredDecisionEvidence}</td>
                  <td className="py-3.5 px-4 text-stone-600 max-w-md">{c.currentResolutionNotes}</td>
                  <td className="py-3.5 px-4 font-mono-tabular font-semibold">
                    <span
                      className={
                        c.status === 'Confirmed'
                          ? 'text-emerald-700'
                          : c.status === 'In Review'
                            ? 'text-amber-700'
                            : 'text-[#4778A8]'
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                  {currentUser.role === 'admin' && (
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={c.status}
                        onChange={(e) =>
                          handleUpdateConfirmationStatus(
                            c.id,
                            e.target.value as PreLaunchConfirmationItem['status']
                          )
                        }
                        className="px-2 py-1 text-xs border border-stone-300 rounded bg-white font-mono-tabular"
                      >
                        <option value="Open">Open</option>
                        <option value="In Review">In Review</option>
                        <option value="Confirmed">Confirmed</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Section 17: 5 Development Phases (Costs, Delivery Periods, Dependencies & Acceptance Criteria) */}
      <div className="space-y-6">
        <div className="border-b border-stone-300 pb-4">
          <div className="text-xs font-mono-tabular text-[#4778A8]">
            PART I SECTION 17 · PHASED DELIVERY ROADMAP, ESTIMATES & ACCEPTANCE CRITERIA
          </div>
          <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial mt-1">
            5 Development Phases & Commercial Delivery Estimates
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {developmentPhases.map((phase) => (
            <div
              key={phase.phaseNumber}
              className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-5 space-y-2">
                <div className="text-xs font-mono-tabular text-[#B5965A]">
                  PHASE 0{phase.phaseNumber} · EST. DURATION: {phase.estimatedDuration.toUpperCase()} · EST. COST:{' '}
                  {phase.estimatedInvestmentNgn}
                </div>
                <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">{phase.name}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{phase.scope}</p>
                <div className="text-xs text-[#0B1F33] pt-1">
                  <strong>Objective:</strong> {phase.objective}
                </div>
              </div>

              <div className="lg:col-span-3 space-y-2 text-xs">
                <div className="font-semibold text-[#0B1F33]">Dependencies:</div>
                <ul className="space-y-1 text-stone-600">
                  {phase.dependencies.map((dep, i) => (
                    <li key={i}>• {dep}</li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-4 space-y-2 text-xs">
                <div className="font-semibold text-[#0B1F33]">Phase Acceptance Criteria:</div>
                <ul className="space-y-1.5 text-stone-700">
                  {phase.acceptanceCriteria.map((ac, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{ac}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
