import React, { useState } from 'react';
import {
  AlertCircle,
  Download,
  FileText,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Lock,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  AcademyCourse,
  AuditLogEntry,
  BlogCategory,
  BlogPost,
  CustomerSubscription,
  EnquirySubmission,
  InvoiceRecord,
  LearnerEnrolment,
  LegalPolicyDocument,
  SchoolLicence,
  ServiceItem,
  SubscriptionPlan,
  UserProfile,
} from '../types';

interface AdminDashboardViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  services: ServiceItem[];
  plans: SubscriptionPlan[];
  subscriptions: CustomerSubscription[];
  invoices: InvoiceRecord[];
  schoolLicences: SchoolLicence[];
  courses: AcademyCourse[];
  enrolments: LearnerEnrolment[];
  blogPosts: BlogPost[];
  policies: LegalPolicyDocument[];
  enquiries: EnquirySubmission[];
  auditLogs: AuditLogEntry[];
  onRefreshData: () => Promise<void>;
}

type AdminModule =
  | 'customers'
  | 'subscriptions'
  | 'school_licensing'
  | 'academy'
  | 'blog_content'
  | 'payments_reports'
  | 'system_settings';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentUser,
  users,
  services,
  plans,
  subscriptions,
  invoices,
  schoolLicences,
  courses,
  enrolments,
  blogPosts,
  policies,
  enquiries,
  auditLogs,
  onRefreshData,
}) => {
  const [activeModule, setActiveModule] = useState<AdminModule>(
    currentUser.role === 'editor' ? 'blog_content' : 'customers'
  );
  const [rbacErrorBanner, setRbacErrorBanner] = useState<string | null>(null);

  // Blog Editor State (Section 10 & 11)
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<BlogCategory>('AI & Technology');
  const [newPostExcerpt, setNewPostExcerpt] = useState('');
  const [newPostSourceName, setNewPostSourceName] = useState('');
  const [newPostSourceUrl, setNewPostSourceUrl] = useState('');

  // Service CMS Editor State (Section 5: Admin can manage service descriptions, pricing, availability & CTAs without code edit)
  const [editingServiceId, setEditingServiceId] = useState<string>(services[0]?.id || '');
  const selectedServiceForEdit = services.find((s) => s.id === editingServiceId) || services[0];
  const [editServicePrice, setEditServicePrice] = useState<number>(selectedServiceForEdit?.startingPriceNgn || 250000);
  const [editServiceCta, setEditServiceCta] = useState<string>(selectedServiceForEdit?.ctaLabel || '');
  const [editServiceStatus, setEditServiceStatus] = useState<ServiceItem['availabilityStatus']>(
    selectedServiceForEdit?.availabilityStatus || 'Production Verified'
  );
  const [cmsSavedNotice, setCmsSavedNotice] = useState<string | null>(null);

  // Export State (Section 20)
  const [exportedJsonPreview, setExportedJsonPreview] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'editor';

  const totalRevenueNgn = invoices
    .filter((i) => i.status === 'Paid (Verified)')
    .reduce((acc, item) => acc + item.amountNgn, 0);

  const handleAdminStatusChange = async (url: string, body: object) => {
    setRbacErrorBanner(null);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      setRbacErrorBanner(data.message || data.error || 'Permission denied on server.');
    } else {
      await onRefreshData();
    }
  };

  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setRbacErrorBanner(null);
    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({
        title: newPostTitle,
        category: newPostCategory,
        excerpt: newPostExcerpt,
        content: [newPostExcerpt],
        status: 'Published',
        sourceName: newPostSourceName || undefined,
        sourceUrl: newPostSourceUrl || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRbacErrorBanner(data.message || data.error);
    } else {
      setNewPostTitle('');
      setNewPostExcerpt('');
      setNewPostSourceName('');
      setNewPostSourceUrl('');
      await onRefreshData();
    }
  };

  const handleSaveServiceCms = async (e: React.FormEvent) => {
    e.preventDefault();
    setRbacErrorBanner(null);
    setCmsSavedNotice(null);
    const res = await fetch(`/api/services/${editingServiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({
        startingPriceNgn: Number(editServicePrice),
        ctaLabel: editServiceCta,
        availabilityStatus: editServiceStatus,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRbacErrorBanner(data.message || data.error);
    } else {
      setCmsSavedNotice(`Updated ${data.service.title} live without editing source code.`);
      await onRefreshData();
    }
  };

  const handleTriggerDataExport = async (entity: string) => {
    setRbacErrorBanner(null);
    const res = await fetch(`/api/export/${entity}`, {
      headers: { 'x-avichas-user-id': currentUser.id },
    });
    const data = await res.json();
    if (!res.ok) {
      setRbacErrorBanner(data.message || data.error);
      return;
    }
    const formatted = JSON.stringify(data, null, 2);
    setExportedJsonPreview(formatted);
    const blob = new Blob([formatted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avichas-${entity}-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isStaff) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-16">
        <div className="bg-white border border-red-300 rounded-md p-8 space-y-4">
          <div className="text-xs font-mono-tabular text-red-700">
            SERVER & CLIENT ROLE-BASED ACCESS CONTROL (SECTION 11 & 14)
          </div>
          <h1 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
            Central Administration Dashboard Restricted to Authorised Avichas Personnel
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            You are currently viewing the platform as <strong>{currentUser.name}</strong> with role{' '}
            <code className="font-mono-tabular">{currentUser.role.toUpperCase()}</code>. Customers, School Principals,
            and Academy Learners are isolated from the Central Administration Dashboard. Use the{' '}
            <strong>Role Switcher</strong> in the top toolbar to switch to{' '}
            <code className="font-mono-tabular">ADMIN (Tunde Adeyemi)</code> or{' '}
            <code className="font-mono-tabular">EDITOR (Amaka Nwosu)</code> to inspect the 7 Admin Modules.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-8">
      {/* Header & Role Context */}
      <div className="bg-[#0B1F33] text-white rounded-md p-6 sm:p-8 border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="text-xs text-[#C9B58B] font-mono-tabular">
            PART I SECTION 11 · CENTRAL ADMINISTRATION DASHBOARD · 7 CONSOLIDATED MODULES
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold font-editorial">
            Avichas Central Administration & Governance Console
          </h1>
          <div className="text-xs text-stone-300 font-mono-tabular">
            Personnel: <strong className="text-white">{currentUser.name}</strong> · Role:{' '}
            <span className="text-[#C9B58B]">{currentUser.role.toUpperCase()}</span>
            {currentUser.role === 'editor' &&
              ' (Restricted Role: Content Editor cannot issue school licences or access billing controls)'}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-right font-mono-tabular shrink-0">
          <div className="p-3 rounded bg-white/5 border border-white/10">
            <div className="text-[11px] text-stone-400">Verified Revenue</div>
            <div className="text-lg font-semibold text-white">₦{totalRevenueNgn.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded bg-white/5 border border-white/10">
            <div className="text-[11px] text-stone-400">School Licences</div>
            <div className="text-lg font-semibold text-white">{schoolLicences.length}</div>
          </div>
          <div className="p-3 rounded bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-stone-400">Enquiries</div>
            <div className="text-lg font-semibold text-[#C9B58B]">{enquiries.length}</div>
          </div>
        </div>
      </div>

      {/* RBAC Enforcement Alert */}
      {rbacErrorBanner && (
        <div className="p-4 rounded-md bg-red-50 border border-red-300 text-xs text-red-900 flex items-center justify-between">
          <div>
            <strong>Server RBAC Enforcement (HTTP 403):</strong> {rbacErrorBanner}
          </div>
          <button type="button" onClick={() => setRbacErrorBanner(null)} className="font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 7 Required Modules Navigation (Section 11 Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-white border border-stone-200 rounded-md p-3 space-y-1">
          {[
            { id: 'customers', label: '01. Customers & Enquiries', adminOnly: false },
            { id: 'subscriptions', label: '02. Subscriptions', adminOnly: true },
            { id: 'school_licensing', label: '03. School Licensing', adminOnly: true },
            { id: 'academy', label: '04. Academy LMS', adminOnly: false },
            { id: 'blog_content', label: '05. Blog and Content', adminOnly: false },
            { id: 'payments_reports', label: '06. Payments & Reports', adminOnly: true },
            { id: 'system_settings', label: '07. System Settings & CMS', adminOnly: true },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveModule(m.id as AdminModule)}
              className={`w-full text-left px-3.5 py-2.5 rounded text-xs font-medium flex items-center justify-between transition-colors ${
                activeModule === m.id
                  ? 'bg-[#0B1F33] text-white font-semibold'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span>{m.label}</span>
              {m.adminOnly && !isSuperAdmin && <Lock className="w-3.5 h-3.5 text-amber-600" />}
            </button>
          ))}
        </aside>

        {/* Main Admin Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {/* MODULE 1: CUSTOMERS & ENQUIRIES */}
          {activeModule === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
                <div className="p-5 border-b border-stone-200">
                  <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                    Customer Records & Organisation Directory
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase">
                        <th className="py-3 px-4">Name & Email</th>
                        <th className="py-3 px-4">Organisation</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#0B1F33]">{u.name}</div>
                            <div className="text-stone-500">{u.email}</div>
                          </td>
                          <td className="py-3 px-4 text-stone-700">{u.organisationName}</td>
                          <td className="py-3 px-4 font-mono-tabular uppercase">{u.role}</td>
                          <td className="py-3 px-4 font-mono-tabular">{u.phone}</td>
                          <td className="py-3 px-4 text-emerald-700 font-semibold">{u.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
                <div className="p-5 border-b border-stone-200">
                  <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                    Inbound Assessment Requests, Custom Quotations & Support History
                  </h3>
                </div>
                <div className="divide-y divide-stone-200">
                  {enquiries.map((enq) => (
                    <div key={enq.id} className="p-5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-mono-tabular text-stone-500">
                        <span>
                          {enq.type} · {enq.serviceInterest}
                        </span>
                        <span>{enq.createdAt.split('T')[0]}</span>
                      </div>
                      <div className="font-semibold text-[#0B1F33]">
                        {enq.fullName} — {enq.organisation} ({enq.email} · {enq.phone})
                      </div>
                      <p className="text-stone-600">{enq.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: SUBSCRIPTIONS */}
          {activeModule === 'subscriptions' && (
            <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
              <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                    Subscription Lifecycle Administration (Section 7)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Manually activate, suspend, or review Naira subscriptions. (Restricted by role: Super Admin only)
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase">
                      <th className="py-3 px-4">Organisation</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4 text-right">Admin Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td className="py-3 px-4 font-semibold text-[#0B1F33]">{sub.organisationName}</td>
                        <td className="py-3 px-4">{sub.planName}</td>
                        <td className="py-3 px-4 text-right font-mono-tabular">₦{sub.amountNgn.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono-tabular font-semibold">{sub.status}</td>
                        <td className="py-3 px-4 font-mono-tabular">{sub.expiryDate}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminStatusChange(`/api/subscriptions/${sub.id}/status`, { status: 'Active' })
                            }
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded"
                          >
                            Activate
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminStatusChange(`/api/subscriptions/${sub.id}/status`, { status: 'Suspended' })
                            }
                            className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 3: SCHOOL LICENSING */}
          {activeModule === 'school_licensing' && (
            <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
              <div className="p-5 border-b border-stone-200">
                <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                  Central School Licensing & Entitlement Governance (Section 8)
                </h2>
                <p className="text-xs text-stone-500">
                  Note: Content Editors are blocked by server RBAC from issuing or modifying school licences.
                </p>
              </div>
              {schoolLicences.length === 0 ? (
                <div className="p-6 text-xs text-amber-900 bg-amber-50">
                  Role Restriction Active: As a Content Editor ({currentUser.name}), sensitive school licensing keys and
                  billing records are hidden and blocked on the server (Section 11). Switch to Role: ADMIN to manage
                  licences.
                </div>
              ) : (
                <div className="divide-y divide-stone-200">
                  {schoolLicences.map((lic) => (
                    <div key={lic.id} className="p-5 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-[#0B1F33]">{lic.schoolName}</div>
                          <div className="font-mono-tabular text-stone-500">
                            {lic.schoolId} · Key: <strong className="text-[#0B1F33]">{lic.licenceKey}</strong> · Status:{' '}
                            {lic.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminStatusChange(`/api/schools/${lic.id}/status`, { status: 'Active' })
                            }
                            className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded"
                          >
                            Set Active
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminStatusChange(`/api/schools/${lic.id}/status`, { status: 'Suspended' })
                            }
                            className="px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded"
                          >
                            Suspend Licence
                          </button>
                        </div>
                      </div>
                      <div className="font-mono-tabular text-stone-600">
                        Credits Used: {lic.creditsUsed.toLocaleString()} / {lic.creditAllowance.toLocaleString()} ·
                        Expiry: {lic.expiryDate} · AI Key: {lic.maskedApiKey || 'Bundled Avichas Credits'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MODULE 4: ACADEMY MANAGEMENT */}
          {activeModule === 'academy' && (
            <div className="bg-white border border-stone-200 rounded-md p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                    Avichas Academy Courses & Learner Progress Registry
                  </h2>
                  <p className="text-xs text-stone-500">
                    {courses.length} active courses · {enrolments.length} enrolled learners
                  </p>
                </div>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => handleTriggerDataExport('academy')}
                    className="px-3.5 py-2 text-xs font-semibold bg-[#0B1F33] text-white rounded-md inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Enrolment Report</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase">
                      <th className="py-3 px-4">Learner</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4 text-right">Progress</th>
                      <th className="py-3 px-4">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {enrolments.map((enr) => (
                      <tr key={enr.id}>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#0B1F33]">{enr.learnerName}</div>
                          <div className="text-stone-500">{enr.organisationName}</div>
                        </td>
                        <td className="py-3 px-4">{enr.courseTitle}</td>
                        <td className="py-3 px-4 font-mono-tabular">{enr.paymentStatus}</td>
                        <td className="py-3 px-4 text-right font-mono-tabular font-semibold">
                          {enr.progressPercent}%
                        </td>
                        <td className="py-3 px-4 font-mono-tabular">
                          {enr.certificateIssued ? enr.certificateSerial : 'In Progress'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 5: BLOG AND CONTENT CMS (Accessible to both Admin & Editor) */}
          {activeModule === 'blog_content' && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
                <div className="text-xs font-mono-tabular text-[#4778A8]">
                  SECTION 10 · EDITORIAL CMS & CONTROLLED AI NEWS SOURCING
                </div>
                <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                  Publish Original Article or Reviewed AI News Summary
                </h2>
                <form onSubmit={handleCreateBlogPost} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      required
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Article Headline..."
                      className="sm:col-span-2 px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                    />
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value as BlogCategory)}
                      className="px-3 py-2 text-xs border border-stone-300 rounded-md bg-white"
                    >
                      <option value="AI & Technology">AI & Technology</option>
                      <option value="Business & Productivity">Business & Productivity</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Automation & Operations">Automation & Operations</option>
                      <option value="Data & Business Intelligence">Data & Business Intelligence</option>
                      <option value="Education & AI">Education & AI</option>
                      <option value="Trust, Ethics & the Future">Trust, Ethics & the Future</option>
                      <option value="Avichas News">Avichas News</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={newPostExcerpt}
                    onChange={(e) => setNewPostExcerpt(e.target.value)}
                    placeholder="Article summary & executive commentary..."
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newPostSourceName}
                      onChange={(e) => setNewPostSourceName(e.target.value)}
                      placeholder="Optional Source Attribution (e.g., NDPC / Financial Times)"
                      className="px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                    />
                    <input
                      type="url"
                      value={newPostSourceUrl}
                      onChange={(e) => setNewPostSourceUrl(e.target.value)}
                      placeholder="Optional Source URL (https://...)"
                      className="px-3.5 py-2 text-xs border border-stone-300 rounded-md"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
                  >
                    Approve & Publish Article
                  </button>
                </form>
              </div>

              <div className="bg-white border border-stone-200 rounded-md divide-y divide-stone-200">
                {blogPosts.map((post) => (
                  <div key={post.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <div className="font-semibold text-[#0B1F33]">{post.title}</div>
                      <div className="text-stone-500 font-mono-tabular">
                        {post.category} · {post.publishedAt} · Status: {post.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 6: PAYMENTS, REPORTS & FULL DATA EXPORT (Section 11 & 20) */}
          {activeModule === 'payments_reports' && (
            <div className="bg-white border border-stone-200 rounded-md p-6 space-y-6">
              <div className="space-y-1 border-b border-stone-200 pb-4">
                <div className="text-xs font-mono-tabular text-[#4778A8]">
                  SECTION 11 & SECTION 20 · REVENUE REPORTING & DATA OWNERSHIP EXPORT
                </div>
                <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                  Export Customer, Subscription, School Licence, Academy & Content Data
                </h2>
                <p className="text-xs text-stone-600">
                  Per Section 20: Avichas Metrics retains full administrative ownership and can export all operational
                  records at any time.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'all', label: 'Export Complete Platform Database (JSON)' },
                  { id: 'customers', label: 'Export Customers' },
                  { id: 'subscriptions', label: 'Export Subscriptions' },
                  { id: 'schools', label: 'Export School Licences' },
                  { id: 'audit', label: 'Export Security Audit Logs' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => handleTriggerDataExport(btn.id)}
                    className="px-4 py-2 text-xs font-semibold text-[#0B1F33] bg-[#EDE7D9] hover:bg-[#C9B58B] rounded-md inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{btn.label}</span>
                  </button>
                ))}
              </div>

              {exportedJsonPreview && (
                <pre className="p-4 rounded bg-[#0B1F33] text-stone-200 text-xs font-mono-tabular overflow-x-auto max-h-72">
                  {exportedJsonPreview}
                </pre>
              )}
            </div>
          )}

          {/* MODULE 7: SYSTEM SETTINGS, LIVE SERVICE CATALOGUE CMS & AUDIT LOGS (Section 5, 11, 14) */}
          {activeModule === 'system_settings' && (
            <div className="space-y-6">
              {/* Dynamic Service Catalogue CMS (Section 5 Requirement) */}
              <div className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
                <div className="text-xs font-mono-tabular text-[#4778A8]">
                  SECTION 5 REQUIREMENT · MANAGE SERVICE PRICING, AVAILABILITY & CTAS WITHOUT CODE EDITS
                </div>
                <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                  Live Service Catalogue Configuration
                </h2>

                <form onSubmit={handleSaveServiceCms} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Select Service to Edit</label>
                    <select
                      value={editingServiceId}
                      onChange={(e) => {
                        const s = services.find((item) => item.id === e.target.value);
                        setEditingServiceId(e.target.value);
                        if (s) {
                          setEditServicePrice(s.startingPriceNgn);
                          setEditServiceCta(s.ctaLabel);
                          setEditServiceStatus(s.availabilityStatus);
                        }
                      }}
                      className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md bg-white"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.indexNumber}. {s.title} (₦{s.startingPriceNgn.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Starting Price (NGN ₦)</label>
                      <input
                        type="number"
                        value={editServicePrice}
                        onChange={(e) => setEditServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Availability Status</label>
                      <select
                        value={editServiceStatus}
                        onChange={(e) =>
                          setEditServiceStatus(e.target.value as ServiceItem['availabilityStatus'])
                        }
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md bg-white"
                      >
                        <option value="Production Verified">Production Verified</option>
                        <option value="Pilot Validation">Pilot Validation</option>
                        <option value="Custom Consultation">Custom Consultation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Primary CTA Button Text</label>
                      <input
                        type="text"
                        value={editServiceCta}
                        onChange={(e) => setEditServiceCta(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
                  >
                    Save Service Configuration Live
                  </button>
                </form>

                {cmsSavedNotice && (
                  <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    {cmsSavedNotice}
                  </div>
                )}
              </div>

              {/* Security Audit Logs (Section 14) */}
              <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
                <div className="p-5 border-b border-stone-200">
                  <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                    Immutable Administrative & Security Audit Logs (Section 14)
                  </h3>
                </div>
                <div className="divide-y divide-stone-200 max-h-80 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 px-5 text-xs flex items-center justify-between gap-4 font-mono-tabular">
                      <div>
                        <span className="font-semibold text-[#0B1F33]">{log.action}</span> · {log.target}
                      </div>
                      <div className="text-stone-500 shrink-0">
                        {log.actorName} ({log.actorRole}) · {log.timestamp.slice(0, 19).replace('T', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
