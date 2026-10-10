import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Layers,
  PhoneCall,
  Sliders,
} from 'lucide-react';
import { ServiceItem } from '../types';
import { ActivePage } from './Navbar';

interface ServicesViewProps {
  services: ServiceItem[];
  selectedService: ServiceItem | null;
  onSelectService: (service: ServiceItem | null) => void;
  onNavigate: (page: ActivePage) => void;
  onOpenAssessmentModal: (defaultService?: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  selectedService,
  onSelectService,
  onNavigate,
  onOpenAssessmentModal,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredServices =
    categoryFilter === 'ALL' ? services : services.filter((s) => s.category === categoryFilter);

  if (selectedService) {
    return (
      <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
        {/* Back button */}
        <div className="flex items-center justify-between border-b border-stone-300 pb-4">
          <button
            type="button"
            onClick={() => onSelectService(null)}
            className="text-sm font-medium text-[#0B1F33] hover:text-[#4778A8] inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Avichas Services</span>
          </button>

          <div className="text-xs text-stone-500 font-mono-tabular">
            SERVICE SPECIFICATION {selectedService.indexNumber} · {selectedService.availabilityStatus.toUpperCase()}
          </div>
        </div>

        {/* Service Header */}
        <div className="bg-[#0B1F33] text-white rounded-md p-8 sm:p-12 border border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="text-xs text-[#C9B58B] font-mono-tabular">
                {selectedService.indexNumber} · {selectedService.category.toUpperCase()} · {selectedService.commercialModel.toUpperCase()}
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold font-editorial tracking-tight text-white">
                {selectedService.title}
              </h1>
              <p className="text-base text-stone-200 leading-relaxed max-w-3xl">
                {selectedService.shortSummary}
              </p>
            </div>

            <div className="lg:col-span-4 bg-white/5 border border-white/15 rounded-md p-6 space-y-4">
              <div className="text-xs text-stone-300">Commercial & Pricing Overview</div>
              <div className="text-2xl font-semibold text-white font-mono-tabular">
                From ₦{selectedService.startingPriceNgn.toLocaleString()}
              </div>
              <div className="text-xs text-stone-300">{selectedService.billingCadence}</div>
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedService.ctaAction === 'school_portal') {
                      onNavigate('schools');
                    } else if (selectedService.ctaAction === 'subscribe') {
                      onNavigate('subscriptions');
                    } else {
                      onOpenAssessmentModal(selectedService.title);
                    }
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors"
                >
                  {selectedService.ctaLabel}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('subscriptions')}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white border border-white/25 hover:bg-white/10 rounded-md transition-colors"
                >
                  Compare Standardised Subscription Plans
                </button>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-stone-300 font-mono-tabular">
                <a href="tel:+12348156687" className="hover:text-[#C9B58B] inline-flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#C9B58B]" />
                  <span>Ava AI Receptionist: +1 (234) 815-6687</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 9 Mandatory Specification Sections (Part I Section 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Business Problem Addressed */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-3">
              <div className="text-xs font-mono-tabular text-[#4778A8]">01 · THE BUSINESS PROBLEM ADDRESSED</div>
              <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                Why Organisations Lose Margin & Time Without Structured Execution
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed">{selectedService.businessProblem}</p>
            </div>

            {/* 2 & 3. Who It Is Designed For + What Avichas Provides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
                <div className="text-xs font-mono-tabular text-[#4778A8]">02 · WHO THIS SERVICE IS DESIGNED FOR</div>
                <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">Target Organisations & Roles</h3>
                <ul className="space-y-2.5 text-sm text-stone-700">
                  {selectedService.designedFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0B1F33] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
                <div className="text-xs font-mono-tabular text-[#4778A8]">03 · WHAT AVICHAS PROVIDES</div>
                <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">Deliverables & Capabilities</h3>
                <ul className="space-y-2.5 text-sm text-stone-700">
                  {selectedService.whatAvichasProvides.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#B5965A] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. How The Solution Works */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">04 · HOW THE SOLUTION WORKS</div>
              <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">Operational Architecture</h3>
              <div className="space-y-3">
                {selectedService.howItWorks.map((step, i) => (
                  <div key={i} className="p-4 rounded bg-stone-50 border border-stone-200 flex items-start gap-3">
                    <span className="font-mono-tabular text-xs font-semibold text-[#0B1F33] mt-0.5">
                      0{i + 1}.
                    </span>
                    <p className="text-sm text-stone-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Expected Benefits & Measurable Indicators */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                05 · EXPECTED BENEFITS & MEASURABLE INDICATORS
              </div>
              <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                Quantifiable Performance Benchmarks
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedService.expectedBenefits.map((b, i) => (
                  <div key={i} className="p-4 rounded bg-[#F9F8F5] border border-stone-200 space-y-1">
                    <div className="text-xs text-stone-500">{b.metric}</div>
                    <div className="text-sm font-semibold text-[#0B1F33] font-mono-tabular">{b.indicator}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. Frequently Asked Questions */}
            <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">08 · FREQUENTLY ASKED QUESTIONS</div>
              <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                Service Governance & Technical Clarifications
              </h3>
              <div className="space-y-4">
                {selectedService.faqs.map((faq, i) => (
                  <div key={i} className="border-b border-stone-200 last:border-b-0 pb-4 last:pb-0 space-y-1.5">
                    <div className="text-sm font-semibold text-[#0B1F33]">{faq.question}</div>
                    <p className="text-sm text-stone-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Implementation Process & Commercial Model */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">06 · IMPLEMENTATION PROCESS</div>
              <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                Understand → Diagnose → Design → Implement
              </h3>
              <ol className="space-y-3 text-sm text-stone-700">
                {selectedService.implementationProcess.map((proc, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono-tabular text-xs font-semibold text-[#B5965A] mt-0.5">
                      Step {idx + 1}:
                    </span>
                    <span>{proc}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-[#EDE7D9] border border-stone-300 rounded-md p-6 space-y-4">
              <div className="text-xs font-mono-tabular text-[#0B1F33]">07 · COMMERCIAL MODEL SPECIFICATION</div>
              <div className="text-base font-semibold text-[#0B1F33] font-editorial">
                {selectedService.commercialModel}
              </div>
              <p className="text-xs text-[#2E3A44] leading-relaxed">
                Avichas supports both Fixed/Customised Services (diagnostic consultation, tailored architecture, and
                bespoke quotation) and Standardised Subscription Products with server-verified online payment in Naira.
              </p>
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => onOpenAssessmentModal(selectedService.title)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors"
                >
                  Submit Enquiry / Request Quotation
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="w-full py-2 px-4 text-xs font-medium text-[#0B1F33] border border-[#0B1F33]/30 hover:bg-white/50 rounded-md transition-colors"
                >
                  Admin CMS: Edit Service Pricing & Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-12">
      {/* Header */}
      <div className="border-b border-stone-300 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 max-w-3xl">
          <div className="text-xs text-[#4778A8] font-mono-tabular">
            PART I SECTION 5 · CENTRAL SERVICES CATALOGUE & COMMERCIAL MODELS
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
            Avichas Services & Intelligent Business Solutions
          </h1>
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
            Every service engagement begins with business problem diagnosis and measurable performance indicators. Select
            any service below to review its complete 9-point architectural specification, implementation timeline, Naira
            pricing, and FAQs.
          </p>
        </div>

        {/* Interactive Filter Controls (Allowed by Zero-Pill Discipline as functional <button> elements) */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-md self-start">
          {['ALL', 'Operations & Sales', 'Corporate Intelligence', 'Education & Schools'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? 'bg-[#0B1F33] text-white'
                  : 'text-stone-700 hover:text-[#0B1F33]'
              }`}
            >
              {cat === 'ALL' ? 'All 6 Services' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Commercial Models Comparison Strip (Section 5A & 5B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-md p-6 space-y-2">
          <div className="text-xs font-mono-tabular text-[#4778A8]">COMMERCIAL MODEL A · FIXED OR CUSTOMISED</div>
          <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
            Consultation, Diagnostic Assessment & Custom Implementation
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            For enterprise BI, Execution Intelligence, and custom workflow engineering, clients submit an assessment
            enquiry or request a scoped quotation tailored to their infrastructure.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-6 space-y-2">
          <div className="text-xs font-mono-tabular text-[#B5965A]">COMMERCIAL MODEL B · SUBSCRIPTION PRODUCTS</div>
          <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
            Standardised Recurring & Termly Product Plans
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            For School AI Licensing and standardized Sales/Productivity suites, customers review Naira plans, pay online
            with server-side webhook verification, and receive immediate portal entitlement.
          </p>
        </div>
      </div>

      {/* Services Catalogue List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-stone-200 rounded-md p-8 flex flex-col justify-between hover:border-[#0B1F33] transition-colors"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono-tabular">
                <span>
                  {service.indexNumber} · {service.category}
                </span>
                <span>
                  {service.commercialModel} · {service.availabilityStatus}
                </span>
              </div>

              <h3 className="text-2xl font-semibold text-[#0B1F33] font-editorial">{service.title}</h3>

              <p className="text-sm text-stone-600 leading-relaxed">{service.shortSummary}</p>

              <div className="pt-3 border-t border-stone-100 space-y-2">
                <div className="text-xs font-semibold text-[#0B1F33]">Core Problem Solved:</div>
                <p className="text-xs text-stone-600 leading-relaxed">{service.businessProblem}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {service.expectedBenefits.slice(0, 2).map((ben, idx) => (
                  <div key={idx} className="p-3 rounded bg-stone-50 border border-stone-200/80">
                    <div className="text-[11px] text-stone-500">{ben.metric}</div>
                    <div className="text-xs font-semibold text-[#0B1F33] font-mono-tabular mt-0.5">
                      {ben.indicator}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-stone-500">Indicative Investment</div>
                <div className="text-base font-semibold text-[#0B1F33] font-mono-tabular">
                  From ₦{service.startingPriceNgn.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>Full Service Specification</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
