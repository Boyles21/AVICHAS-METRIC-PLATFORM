/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AcademyView } from './components/AcademyView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CustomerPortalView } from './components/CustomerPortalView';
import { HomeView } from './components/HomeView';
import { InsightsView } from './components/InsightsView';
import { ActivePage, Footer, Navbar } from './components/Navbar';
import { SchoolPortalView } from './components/SchoolPortalView';
import { ServicesView } from './components/ServicesView';
import { SpecAndLegalView } from './components/SpecAndLegalView';
import {
  DEVELOPMENT_PHASES,
  INITIAL_AUDIT_LOGS,
  INITIAL_BLOG_POSTS,
  INITIAL_CONFIRMATIONS,
  INITIAL_COURSES,
  INITIAL_ENQUIRIES,
  INITIAL_ENROLMENTS,
  INITIAL_INVOICES,
  INITIAL_PLANS,
  INITIAL_POLICIES,
  INITIAL_SCHOOL_LICENCES,
  INITIAL_SERVICES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USERS,
} from './data/seedData';
import {
  AcademyCourse,
  AuditLogEntry,
  BlogPost,
  CustomerSubscription,
  DevelopmentPhaseSpec,
  EnquirySubmission,
  InvoiceRecord,
  LearnerEnrolment,
  LegalPolicyDocument,
  PreLaunchConfirmationItem,
  SchoolLicence,
  ServiceItem,
  SubscriptionPlan,
  UserProfile,
} from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [brandTheme, setBrandTheme] = useState<'part-ii' | 'part-i'>('part-ii');

  // Persona / Role Switcher State (Demonstrating Server-Side RBAC & Organisation Isolation)
  const [activeUserId, setActiveUserId] = useState<string>(INITIAL_USERS[0].id);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);

  // Platform Entities State
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>(INITIAL_SUBSCRIPTIONS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [schoolLicences, setSchoolLicences] = useState<SchoolLicence[]>(INITIAL_SCHOOL_LICENCES);
  const [courses, setCourses] = useState<AcademyCourse[]>(INITIAL_COURSES);
  const [enrolments, setEnrolments] = useState<LearnerEnrolment[]>(INITIAL_ENROLMENTS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<string | undefined>(undefined);
  const [policies, setPolicies] = useState<LegalPolicyDocument[]>(INITIAL_POLICIES);
  const [selectedPolicySlug, setSelectedPolicySlug] = useState<string>('terms-and-conditions');
  const [confirmations, setConfirmations] = useState<PreLaunchConfirmationItem[]>(INITIAL_CONFIRMATIONS);
  const [enquiries, setEnquiries] = useState<EnquirySubmission[]>(INITIAL_ENQUIRIES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [developmentPhases, setDevelopmentPhases] = useState<DevelopmentPhaseSpec[]>(DEVELOPMENT_PHASES);

  // Assessment Modal State
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [modalServiceInterest, setModalServiceInterest] = useState(
    'AI-Powered Sales Efficiency & Business Productivity'
  );
  const [modalFullName, setModalFullName] = useState('');
  const [modalOrg, setModalOrg] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalSubmitted, setModalSubmitted] = useState(false);

  const fetchPlatformBootstrap = useCallback(async (userIdToUse = activeUserId) => {
    try {
      const res = await fetch('/api/bootstrap', {
        headers: {
          'x-avichas-user-id': userIdToUse,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.currentUser) setCurrentUser(data.currentUser);
      if (Array.isArray(data.users) && data.users.length > 1) {
        setAllUsers(data.users);
      }
      if (data.services) setServices(data.services);
      if (data.plans) setPlans(data.plans);
      if (data.subscriptions) setSubscriptions(data.subscriptions);
      if (data.invoices) setInvoices(data.invoices);
      if (data.schoolLicences) setSchoolLicences(data.schoolLicences);
      if (data.courses) setCourses(data.courses);
      if (data.enrolments) setEnrolments(data.enrolments);
      if (data.blogPosts) setBlogPosts(data.blogPosts);
      if (data.policies) setPolicies(data.policies);
      if (data.confirmations) setConfirmations(data.confirmations);
      if (data.enquiries) setEnquiries(data.enquiries);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.developmentPhases) setDevelopmentPhases(data.developmentPhases);
    } catch {
      // Fallback to seeded state if offline
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchPlatformBootstrap(activeUserId);
  }, [activeUserId, fetchPlatformBootstrap]);

  const handleNavigate = (page: ActivePage, subTarget?: string) => {
    setActivePage(page);
    if (page !== 'services') {
      setSelectedService(null);
    }
    if (page === 'insights' && subTarget) {
      setSelectedPostId(subTarget);
    } else if (page === 'insights') {
      setSelectedPostId(undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectServiceFromHome = (service: ServiceItem) => {
    setSelectedService(service);
    setActivePage('services');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPolicy = (policySlug: string) => {
    setSelectedPolicySlug(policySlug);
    setActivePage('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchUser = (newUserId: string) => {
    setActiveUserId(newUserId);
    const found = allUsers.find((u) => u.id === newUserId) || INITIAL_USERS.find((u) => u.id === newUserId);
    if (found) setCurrentUser(found);
  };

  const handleOpenAssessmentModal = (defaultService?: string) => {
    if (defaultService) setModalServiceInterest(defaultService);
    setModalSubmitted(false);
    setAssessmentModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Service Assessment',
        fullName: modalFullName,
        organisation: modalOrg,
        email: modalEmail,
        phone: modalPhone,
        serviceInterest: modalServiceInterest,
        message: modalMessage,
      }),
    });
    if (res.ok) {
      setModalSubmitted(true);
      setModalFullName('');
      setModalOrg('');
      setModalEmail('');
      setModalPhone('');
      setModalMessage('');
      await fetchPlatformBootstrap();
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${
        brandTheme === 'part-ii' ? 'theme-part-ii bg-[#F9F8F5]' : 'theme-part-i bg-[#EDE7D9]/45'
      }`}
    >
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        allPersonaUsers={INITIAL_USERS}
        onSwitchUser={handleSwitchUser}
        brandTheme={brandTheme}
        onToggleBrandTheme={() => setBrandTheme((prev) => (prev === 'part-ii' ? 'part-i' : 'part-ii'))}
        onOpenAssessmentModal={handleOpenAssessmentModal}
      />

      <main className="flex-1">
        {activePage === 'home' && (
          <HomeView
            services={services}
            courses={courses}
            blogPosts={blogPosts}
            onNavigate={handleNavigate}
            onSelectService={handleSelectServiceFromHome}
            onOpenAssessmentModal={handleOpenAssessmentModal}
          />
        )}

        {activePage === 'services' && (
          <ServicesView
            services={services}
            selectedService={selectedService}
            onSelectService={setSelectedService}
            onNavigate={handleNavigate}
            onOpenAssessmentModal={handleOpenAssessmentModal}
          />
        )}

        {activePage === 'schools' && (
          <SchoolPortalView
            currentUser={currentUser}
            schoolLicences={schoolLicences}
            plans={plans}
            onRefreshData={() => fetchPlatformBootstrap(activeUserId)}
          />
        )}

        {activePage === 'subscriptions' && (
          <CustomerPortalView
            currentUser={currentUser}
            plans={plans}
            subscriptions={subscriptions}
            invoices={invoices}
            initialTab="plans"
            onRefreshData={() => fetchPlatformBootstrap(activeUserId)}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {activePage === 'portal' && (
          <CustomerPortalView
            currentUser={currentUser}
            plans={plans}
            subscriptions={subscriptions}
            invoices={invoices}
            initialTab="dashboard"
            onRefreshData={() => fetchPlatformBootstrap(activeUserId)}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {activePage === 'academy' && (
          <AcademyView
            currentUser={currentUser}
            courses={courses}
            enrolments={enrolments}
            onRefreshData={() => fetchPlatformBootstrap(activeUserId)}
          />
        )}

        {activePage === 'insights' && (
          <InsightsView blogPosts={blogPosts} initialPostId={selectedPostId} />
        )}

        {activePage === 'admin' && (
          <AdminDashboardView
            currentUser={currentUser}
            users={allUsers}
            services={services}
            plans={plans}
            subscriptions={subscriptions}
            invoices={invoices}
            schoolLicences={schoolLicences}
            courses={courses}
            enrolments={enrolments}
            blogPosts={blogPosts}
            policies={policies}
            enquiries={enquiries}
            auditLogs={auditLogs}
            onRefreshData={() => fetchPlatformBootstrap(activeUserId)}
          />
        )}

        {(activePage === 'about' ||
          activePage === 'contact' ||
          activePage === 'legal' ||
          activePage === 'register_spec') && (
          <SpecAndLegalView
            mode={activePage}
            currentUser={currentUser}
            policies={policies}
            selectedPolicySlug={selectedPolicySlug}
            confirmations={confirmations}
            developmentPhases={developmentPhases}
            brandTheme={brandTheme}
            onToggleBrandTheme={() => setBrandTheme((prev) => (prev === 'part-ii' ? 'part-i' : 'part-ii'))}
            onRefreshData={() => fetchPlatformBootstrap(activeUserId)}
          />
        )}
      </main>

      <Footer
        policies={policies}
        onNavigate={handleNavigate}
        onOpenPolicy={handleOpenPolicy}
      />

      {/* Global Assessment / Diagnostic Modal */}
      {assessmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-md max-w-lg w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#4778A8]">
                  AVICHAS DIAGNOSTIC ASSESSMENT REQUEST
                </div>
                <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial mt-0.5">
                  Start a Business or School AI Assessment
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAssessmentModalOpen(false)}
                className="text-stone-400 hover:text-[#0B1F33]"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSubmitted ? (
              <div className="space-y-4 py-4">
                <div className="p-4 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="font-semibold">Assessment Request Confirmed</div>
                  <p>
                    Your assessment request has been validated and logged in the Avichas Central Administration
                    Dashboard. You may also call Ava, our AI Receptionist, directly at +1 (234) 815-6687.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssessmentModalOpen(false)}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#0B1F33] mb-1">Service Area</label>
                  <select
                    value={modalServiceInterest}
                    onChange={(e) => setModalServiceInterest(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.indexNumber}. {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#0B1F33] mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={modalFullName}
                      onChange={(e) => setModalFullName(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0B1F33] mb-1">Organisation / School *</label>
                    <input
                      type="text"
                      required
                      value={modalOrg}
                      onChange={(e) => setModalOrg(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#0B1F33] mb-1">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      value={modalEmail}
                      onChange={(e) => setModalEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0B1F33] mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={modalPhone}
                      onChange={(e) => setModalPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono-tabular"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#0B1F33] mb-1">
                    Business Problem & Measurable Target *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={modalMessage}
                    onChange={(e) => setModalMessage(e.target.value)}
                    placeholder="What operational or commercial bottleneck should we diagnose first?"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssessmentModalOpen(false)}
                    className="px-4 py-2 text-stone-600 hover:text-[#0B1F33]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md"
                  >
                    Submit Assessment Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
