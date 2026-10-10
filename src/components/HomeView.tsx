import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  PhoneCall,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { GENERATED_IMAGES } from '../data/seedData';
import { AcademyCourse, BlogPost, ServiceItem } from '../types';
import { ActivePage } from './Navbar';

interface HomeViewProps {
  services: ServiceItem[];
  courses: AcademyCourse[];
  blogPosts: BlogPost[];
  onNavigate: (page: ActivePage, subTarget?: string) => void;
  onSelectService: (service: ServiceItem) => void;
  onOpenAssessmentModal: (defaultService?: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  services,
  courses,
  blogPosts,
  onNavigate,
  onSelectService,
  onOpenAssessmentModal,
}) => {
  const processSteps = [
    {
      step: '01. Understand',
      detail: 'We examine your commercial model, customer bottlenecks, and operational goals before discussing tools.',
    },
    {
      step: '02. Diagnose',
      detail: 'We audit workflows, data quality, and latency to isolate the true root cause of inefficiency.',
    },
    {
      step: '03. Design',
      detail: 'We architect a tailored, secure solution with clear KPIs, data boundaries, and human checkpoints.',
    },
    {
      step: '04. Implement',
      detail: 'We deploy production workflows, dashboards, and school or team integrations with zero disruption.',
    },
    {
      step: '05. Measure',
      detail: 'We track Naira cost savings, hours reclaimed, and conversion velocity against baseline targets.',
    },
    {
      step: '06. Improve',
      detail: 'We refine models, expand capabilities, and train your staff for sustained execution.',
    },
  ];

  return (
    <div className="space-y-24 pb-12">
      {/* SECTION 1 — HERO (Part I Section 4.1) */}
      <section className="bg-[#0B1F33] text-white border-b border-white/10">
        <div className="max-w-[1360px] mx-auto px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            {/* Left Column: Proposition & CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div className="text-xs text-[#C9B58B] tracking-wide font-mono-tabular">
                  AVICHAS METRICS LIMITED · CAC REGISTRATION: 9880947 · NIGERIA & INTERNATIONAL
                </div>

                <h1
                  className="font-editorial font-semibold tracking-tight text-white leading-[1.08]"
                  style={{ fontSize: 'clamp(2.5rem, 4.2vw, 4rem)', textWrap: 'balance' }}
                >
                  Make Your Business Work Smarter.
                </h1>

                <p className="text-base sm:text-lg text-stone-200 max-w-2xl leading-relaxed">
                  Avichas Metrics helps organisations improve sales efficiency, productivity, business operations and
                  decision-making through intelligent systems, AI-powered solutions and measurable performance
                  improvement.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                {/* Primary & Secondary CTAs */}
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('services')}
                    className="px-6 py-3 text-sm font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>Explore Our Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAssessmentModal()}
                    className="px-6 py-3 text-sm font-semibold text-white border border-white/30 hover:border-[#C9B58B] hover:bg-white/5 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    Start an Assessment
                  </button>
                </div>

                {/* School Pathway Link (Required by Section 4.1) */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => onNavigate('schools')}
                    className="text-[#C9B58B] hover:text-white transition-colors inline-flex items-center gap-2 text-left font-medium"
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>For Schools: Discover Avichas AI solutions for education →</span>
                  </button>

                  <a
                    href="tel:+12348156687"
                    className="text-xs text-stone-300 hover:text-white font-mono-tabular inline-flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#C9B58B]" />
                    <span>Ava AI Receptionist: +1 (234) 815-6687</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Nigerian Executive Photography */}
            <div className="lg:col-span-5">
              <div className="relative h-full min-h-[340px] rounded-md overflow-hidden border border-white/15 bg-[#142C46]">
                <img
                  src={GENERATED_IMAGES.heroBoardroom}
                  alt="Nigerian corporate executives reviewing business intelligence metrics in a modern Lagos boardroom"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F33]/90 via-[#0B1F33]/25 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 space-y-1">
                  <div className="text-xs text-[#C9B58B] font-mono-tabular">
                    EXECUTIVE INTELLIGENCE · VICTORIA ISLAND, LAGOS
                  </div>
                  <p className="text-sm text-white font-medium">
                    Decision-grade business intelligence, sales velocity pipelines, and licensed institutional AI.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Quantitative Proof Strip below Hero Split */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-2xl font-semibold text-white font-mono-tabular">65% Faster</div>
              <div className="text-xs text-stone-300 mt-1">
                Commercial proposal & lead qualification turnaround within 30 days
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white font-mono-tabular">48 Hours</div>
              <div className="text-xs text-stone-300 mt-1">
                End-of-term school broadsheet analysis & report preparation (down from 10 days)
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white font-mono-tabular">100% Server-Verified</div>
              <div className="text-xs text-stone-300 mt-1">
                Naira subscription webhooks, cryptographic school licences & role permissions
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-white font-mono-tabular">6 Core Pillars</div>
              <div className="text-xs text-stone-300 mt-1">
                Sales Efficiency · BI · Operations · Execution · Institutional · School AI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — WHAT WE DO (Part I Section 4.2) */}
      <section className="max-w-[1360px] mx-auto px-6 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-300 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs text-[#4778A8] font-semibold tracking-wider uppercase">
              Section 02 · Service Catalogue
            </div>
            <h2 className="text-3xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
              What We Do: Intelligent Systems Built for Measurable Outcomes
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="text-sm font-semibold text-[#0B1F33] hover:text-[#4778A8] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>View Full Services Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Core Services Grid (Each card links to dedicated service page) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-stone-200/90 rounded-md p-6 flex flex-col justify-between hover:border-[#0B1F33] transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-500 font-mono-tabular">
                  <span>
                    {service.indexNumber}. {service.category}
                  </span>
                  <span>{service.availabilityStatus}</span>
                </div>

                <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial leading-snug">
                  {service.title}
                </h3>

                <p className="text-sm text-stone-600 leading-relaxed">{service.shortSummary}</p>

                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <div className="text-xs font-medium text-stone-500">Key Measurable Indicator:</div>
                  <div className="text-xs text-[#0B1F33] font-medium">
                    {service.expectedBenefits[0]?.metric}: {service.expectedBenefits[0]?.indicator}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-stone-200/80 flex items-center justify-between gap-4">
                <div className="text-xs text-stone-600 font-mono-tabular">
                  From <span className="font-semibold text-[#0B1F33]">₦{service.startingPriceNgn.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className="text-xs font-semibold text-[#0B1F33] hover:text-[#B5965A] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Explore Service Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — SOLUTIONS FOR SCHOOLS (Part I Section 4.3) */}
      <section className="bg-[#EDE7D9] border-y border-stone-300/80 py-20">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs text-[#0B1F33] font-mono-tabular">
                  SECTION 03 · EDUCATIONAL ADMINISTRATION & PRODUCTIVITY · CENTRAL LICENSING + LOCAL n8n
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
                  Solutions for Schools: Licensed AI Workflows for Academic Excellence
                </h2>
                <p className="text-sm sm:text-base text-[#2E3A44] leading-relaxed">
                  Avichas provides participating Nigerian primary and secondary schools with a structured,
                  subscription-licensed AI workflow suite. Each participating school operates its own local n8n workflow
                  instance while Avichas manages central subscription entitlement, usage credit verification, and
                  teacher onboarding.
                </p>
              </div>

              {/* Verified & Tested School Capabilities Matrix (Honoring Section 4.3 Rule: Only advertise developed/tested features) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-white/90 border border-stone-300 rounded-md p-4 space-y-1">
                  <div className="text-xs font-mono-tabular text-emerald-800">
                    VERIFIED & TESTED · PRODUCTION READY
                  </div>
                  <div className="text-sm font-semibold text-[#0B1F33]">AI-Assisted Result Analysis</div>
                  <p className="text-xs text-stone-600">
                    Automated cohort, subject, and terminal broadsheet variance diagnostics for principals and academic
                    boards.
                  </p>
                </div>

                <div className="bg-white/90 border border-stone-300 rounded-md p-4 space-y-1">
                  <div className="text-xs font-mono-tabular text-emerald-800">
                    VERIFIED & TESTED · PRODUCTION READY
                  </div>
                  <div className="text-sm font-semibold text-[#0B1F33]">Report Preparation & Remark Support</div>
                  <p className="text-xs text-stone-600">
                    Generates constructive, personalised teacher and principal report card remarks with mandatory
                    educator review.
                  </p>
                </div>

                <div className="bg-white/90 border border-stone-300 rounded-md p-4 space-y-1">
                  <div className="text-xs font-mono-tabular text-emerald-800">
                    VERIFIED & TESTED · PRODUCTION READY
                  </div>
                  <div className="text-sm font-semibold text-[#0B1F33]">Lesson Planning Assistance</div>
                  <p className="text-xs text-stone-600">
                    NERDC and British/Nigerian curriculum-aligned weekly lesson notes, learning objectives, and class
                    assessments.
                  </p>
                </div>

                <div className="bg-white/90 border border-stone-300 rounded-md p-4 space-y-1">
                  <div className="text-xs font-mono-tabular text-amber-800">
                    INSTITUTIONAL TIER · CONTROLLED ROLLOUT
                  </div>
                  <div className="text-sm font-semibold text-[#0B1F33]">
                    Administrative Workflow & Performance Summaries
                  </div>
                  <p className="text-xs text-stone-600">
                    Executive termly summaries and department coordination workflows with strict school data privacy
                    controls.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('schools')}
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Explore School Solutions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#2E3A44] font-mono-tabular">
                  Termly Licences from ₦185,000 · Includes Central Licensing API & Onboarding
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="h-full min-h-[340px] rounded-md overflow-hidden border border-stone-300 bg-white flex flex-col justify-between">
                <img
                  src={GENERATED_IMAGES.schoolEducators}
                  alt="Nigerian school principal and senior educators reviewing terminal academic performance analytics"
                  referrerPolicy="no-referrer"
                  className="w-full h-64 lg:h-72 object-cover"
                />
                <div className="p-6 space-y-3 bg-white">
                  <div className="text-xs font-mono-tabular text-stone-500">
                    WORKFLOW EXECUTION PATTERN · SECTION 8D
                  </div>
                  <div className="text-xs font-mono-tabular text-[#0B1F33] bg-stone-100 p-3 rounded border border-stone-200 leading-relaxed">
                    Trigger → Licence & Entitlement Check (/api/v1/licensing/verify) → Validate Inputs → Process
                    Authorised Task → Record Usage → Return Result
                  </div>
                  <p className="text-xs text-stone-600">
                    Transparent data boundaries: School databases stay on school infrastructure while entitlement is
                    verified securely over HTTPS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW AVICHAS WORKS (Part I Section 4.4) */}
      <section className="max-w-[1360px] mx-auto px-6 space-y-10">
        <div className="max-w-3xl space-y-3">
          <div className="text-xs text-[#4778A8] font-semibold tracking-wider uppercase">
            Section 04 · Execution Methodology
          </div>
          <h2 className="text-3xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
            How Avichas Works: Problem First, Technology Second
          </h2>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Avichas starts with customer needs rather than recommending technology without understanding the problem.
            Every engagement follows our disciplined six-stage operational lifecycle:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {processSteps.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-stone-200 rounded-md p-5 flex flex-col justify-between space-y-4"
            >
              <div className="text-sm font-semibold text-[#0B1F33] font-editorial">{item.step}</div>
              <p className="text-xs text-stone-600 leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 — AVICHAS ACADEMY (Part I Section 4.5) */}
      <section className="max-w-[1360px] mx-auto px-6">
        <div className="bg-[#0B1F33] text-white rounded-md overflow-hidden border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs text-[#C9B58B] font-mono-tabular">
                  SECTION 05 · AVICHAS ACADEMY · CORPORATE & EDUCATOR UPSKILLING
                </div>
                <h2 className="text-3xl font-semibold font-editorial tracking-tight text-white">
                  Practical Training in AI, Productivity, Automation & Business Intelligence
                </h2>
                <p className="text-sm sm:text-base text-stone-300 leading-relaxed">
                  Equip your leadership team, analysts, and educators with hands-on competency in workflow automation,
                  business data intelligence, and responsible AI governance. Includes structured modules, practical
                  labs, progress tracking, and verifiable completion certificates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {courses.slice(0, 2).map((crs) => (
                  <div key={crs.id} className="p-4 rounded bg-white/5 border border-white/10 space-y-1.5">
                    <div className="text-xs text-[#C9B58B] font-mono-tabular">
                      {crs.category} · {crs.isFree ? 'Complimentary' : `₦${crs.priceNgn.toLocaleString()}`}
                    </div>
                    <div className="text-sm font-semibold text-white">{crs.title}</div>
                    <div className="text-xs text-stone-400">{crs.duration}</div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('academy')}
                  className="px-6 py-3 text-sm font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Explore the Academy</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 min-h-[300px]">
              <img
                src={GENERATED_IMAGES.academyWorkshop}
                alt="Avichas Academy executive training session in Nigeria"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — LATEST INSIGHTS (Part I Section 4.6) */}
      <section className="max-w-[1360px] mx-auto px-6 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-300 pb-6">
          <div className="space-y-2">
            <div className="text-xs text-[#4778A8] font-semibold tracking-wider uppercase">
              Section 06 · Insights & AI News Commentary
            </div>
            <h2 className="text-3xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
              Latest Insights on AI, Productivity & Business Intelligence
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="text-sm font-semibold text-[#0B1F33] hover:text-[#4778A8] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Read All Insights</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              className="bg-white border border-stone-200 rounded-md overflow-hidden flex flex-col justify-between hover:border-[#0B1F33] transition-colors"
            >
              <div>
                <div className="h-48 overflow-hidden bg-stone-100">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 space-y-3">
                  {/* Zero-Pill Metadata Discipline */}
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-mono-tabular">
                    <span>{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTimeMinutes} min read</span>
                  </div>

                  <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">{post.excerpt}</p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500">{post.author}</span>
                <button
                  type="button"
                  onClick={() => onNavigate('insights', post.id)}
                  className="font-semibold text-[#0B1F33] hover:text-[#B5965A]"
                >
                  Read Article →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 7 — FINAL CALL TO ACTION (Part I Section 4.7) */}
      <section className="max-w-[1360px] mx-auto px-6">
        <div className="bg-white border border-stone-300 rounded-md p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="text-xs text-[#4778A8] font-mono-tabular">
              TRUSTED FOUNDATION FOR INTELLIGENT EXECUTION
            </div>
            <h2 className="text-3xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
              Ready to Make Your Organisation Work Smarter?
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Review our service catalogue, request a structured business diagnostic assessment, or speak directly with
              Ava (our AI Phone Receptionist) or our WhatsApp Business desk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAssessmentModal()}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Request an Assessment
            </button>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="px-5 py-3 text-sm font-semibold text-[#0B1F33] border border-stone-300 hover:border-[#0B1F33] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Service Catalogue
            </button>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="px-5 py-3 text-sm font-semibold text-[#0B1F33] border border-stone-300 hover:border-[#0B1F33] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Contact Channels
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
