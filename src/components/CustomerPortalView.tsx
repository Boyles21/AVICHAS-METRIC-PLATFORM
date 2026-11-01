import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  LifeBuoy,
  Lock,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  CustomerSubscription,
  InvoiceRecord,
  SubscriptionPlan,
  UserProfile,
} from '../types';

interface CustomerPortalViewProps {
  currentUser: UserProfile | null;
  plans: SubscriptionPlan[];
  subscriptions: CustomerSubscription[];
  invoices: InvoiceRecord[];
  onRefreshData: () => Promise<void>;
  onSignInSuccess?: (profile: UserProfile, token: string) => void;
  onSignOut?: () => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  currentUser,
  plans,
  subscriptions,
  invoices,
  onRefreshData,
  onSignInSuccess,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'invoices' | 'support'>('overview');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin');

  // Auth Form Inputs
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authOrgName, setAuthOrgName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAccountRole, setAuthAccountRole] = useState<'customer' | 'school_admin' | 'learner'>('customer');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Support Form Inputs
  const [supportSubject, setSupportSubject] = useState('General Support Enquiry');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  // Real Express + Neon Email + Password Sign In (Session Cookie Based)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage({
          type: 'error',
          text: data?.error || 'Invalid email or password. Please check your credentials.',
        });
        return;
      }

      // Fetch verified profile from Express backend with session cookie
      const meRes = await fetch('/api/portal/me', {
        credentials: 'include',
      });

      if (meRes.ok) {
        const portalData = await meRes.json();
        if (onSignInSuccess) {
          onSignInSuccess(portalData.profile, data.sessionId || 'session');
        }
        await onRefreshData();
      } else {
        if (onSignInSuccess && data.user) {
          onSignInSuccess(data.user, data.sessionId || 'session');
        }
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Sign in failed.' });
    } finally {
      setAuthLoading(false);
    }
  };

  // Real Express + Neon Email + Password Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          fullName: authFullName.trim(),
          organisationName: authOrgName.trim(),
          phone: authPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage({ type: 'error', text: data.error || 'Registration failed.' });
        return;
      }

      setAuthMessage({
        type: 'success',
        text: 'Account created! Please check your email inbox to verify your email address before signing in.',
      });
      setAuthMode('signin');
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Sign up failed.' });
    } finally {
      setAuthLoading(false);
    }
  };

  // Real Express + Neon Password Reset Email Dispatch
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: authEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage({ type: 'error', text: data.error || 'Password reset request failed.' });
        return;
      }

      setAuthMessage({
        type: 'success',
        text: 'Password reset instructions have been dispatched to your email address.',
      });
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err?.message || 'Password reset request failed.' });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Support Ticket',
        fullName: currentUser?.name || 'Portal User',
        organisation: currentUser?.organisationName || 'Client Organisation',
        email: currentUser?.email || authEmail,
        phone: currentUser?.phone || '',
        serviceInterest: supportSubject,
        message: supportMessage,
      }),
    });
    if (res.ok) {
      setSupportSent(true);
      setSupportMessage('');
    }
  };

  // IF NOT AUTHENTICATED: Render Real Email + Password Auth Portal
  if (!currentUser) {
    return (
      <div className="max-w-[540px] mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs text-[#4778A8] font-mono-tabular">
            ENTERPRISE AUTHENTICATION · ROLE-BASED ACCESS CONTROL
          </div>
          <h1 className="text-3xl font-semibold text-[#0B1F33] font-editorial tracking-tight">
            Avichas Client & School Portal
          </h1>
          <p className="text-xs text-stone-600">
            Secure client authentication. Organisation data is isolated and protected server-side via Row Level
            Security (RLS).
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-md p-8 shadow-sm space-y-6">
          {/* Auth Mode Tabs */}
          <div className="flex border-b border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthMessage(null);
              }}
              className={`flex-1 py-2.5 font-medium border-b-2 text-center transition-colors ${
                authMode === 'signin' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setAuthMessage(null);
              }}
              className={`flex-1 py-2.5 font-medium border-b-2 text-center transition-colors ${
                authMode === 'signup' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
              }`}
            >
              Register Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('reset');
                setAuthMessage(null);
              }}
              className={`flex-1 py-2.5 font-medium border-b-2 text-center transition-colors ${
                authMode === 'reset' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
              }`}
            >
              Reset Password
            </button>
          </div>

          {authMessage && (
            <div
              className={`p-3.5 rounded text-xs leading-relaxed ${
                authMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-red-50 text-red-900 border border-red-200'
              }`}
            >
              {authMessage.text}
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Corporate or School Email</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@organisation.ng"
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-md focus:outline-none focus:border-[#0B1F33]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-md focus:outline-none focus:border-[#0B1F33]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors"
              >
                {authLoading ? 'Verifying credentials...' : 'Sign In to Client Portal'}
              </button>
            </form>
          )}

          {/* REGISTER ACCOUNT FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={authFullName}
                  onChange={(e) => setAuthFullName(e.target.value)}
                  placeholder="e.g. Dr. Folake Balogun"
                  className="w-full px-3 py-2 border border-stone-300 rounded-md"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Company or School Name *</label>
                <input
                  type="text"
                  required
                  value={authOrgName}
                  onChange={(e) => setAuthOrgName(e.target.value)}
                  placeholder="e.g. Lagoon Greenfield College"
                  className="w-full px-3 py-2 border border-stone-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0B1F33] mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@school.edu.ng"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0B1F33] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="+234 800..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-md font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Account Category</label>
                <select
                  value={authAccountRole}
                  onChange={(e) => setAuthAccountRole(e.target.value as typeof authAccountRole)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-md bg-white"
                >
                  <option value="customer">Corporate Customer (Sales / BI / Operations)</option>
                  <option value="school_admin">School Administrator (AI Solutions for Schools)</option>
                  <option value="learner">Avichas Academy Learner</option>
                </select>
                <p className="text-[11px] text-stone-500 mt-1">
                  Note: Administrator accounts can only be provisioned directly in the database.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Password (min 8 chars) *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Create secure password..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors"
              >
                {authLoading ? 'Creating secure account...' : 'Register Secure Account'}
              </button>
            </form>
          )}

          {/* PASSWORD RESET FORM */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0B1F33] mb-1">Account Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@organisation.ng"
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors"
              >
                {authLoading ? 'Sending Reset Instructions...' : 'Send Password Reset Email'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: Render Authenticated Client Portal Dashboard
  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="bg-[#0B1F33] text-white rounded-md p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="text-xs text-[#C9B58B] font-mono-tabular">
              AUTHENTICATED CLIENT PORTAL · ROW LEVEL SECURITY ACTIVE
            </div>
            <h1 className="text-3xl font-semibold font-editorial tracking-tight">
              {currentUser.organisationName || currentUser.name}
            </h1>
            <div className="text-xs text-stone-300 font-mono-tabular">
              Authorized Contact: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}) ·
              Role: <span className="text-[#C9B58B] font-semibold">{currentUser.role.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="px-3.5 py-2 text-xs font-medium text-stone-300 hover:text-white border border-white/20 rounded-md inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-300 gap-6 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
          }`}
        >
          My Subscriptions ({subscriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'plans' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
          }`}
        >
          Subscription Catalogue (₦)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'invoices' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
          }`}
        >
          Invoices & Receipts ({invoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`py-3 border-b-2 transition-colors ${
            activeTab === 'support' ? 'border-[#0B1F33] text-[#0B1F33] font-semibold' : 'border-transparent text-stone-500'
          }`}
        >
          Support Requests
        </button>
      </div>

      {/* TAB 1: ACTIVE SUBSCRIPTIONS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {subscriptions.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-md p-10 text-center space-y-3">
              <div className="text-base font-semibold text-[#0B1F33] font-editorial">
                No active subscription found for your organisation
              </div>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Explore our Nigerian Naira corporate or school licensing plans to activate workflow and analytics access.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('plans')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
              >
                View Subscription Plans →
              </button>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase">
                      <th className="py-3 px-4">Plan Name</th>
                      <th className="py-3 px-4">Billing Cadence</th>
                      <th className="py-3 px-4 text-right">Amount (NGN)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Validity Period</th>
                      <th className="py-3 px-4">Payment Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {subscriptions.map((sub) => (
                      <tr key={sub.id}>
                        <td className="py-3.5 px-4 font-semibold text-[#0B1F33]">{sub.planName}</td>
                        <td className="py-3.5 px-4 font-mono-tabular">{sub.billingInterval}</td>
                        <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold">
                          ₦{sub.amountNgn.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular">
                          <span
                            className={
                              sub.status === 'Active'
                                ? 'text-emerald-700 font-semibold'
                                : 'text-stone-500 font-semibold'
                            }
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-stone-600">
                          {sub.startDate} → {sub.expiryDate}
                        </td>
                        <td className="py-3.5 px-4 font-mono-tabular text-stone-500">
                          {sub.paymentProvider}: {sub.paymentReference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PLANS CATALOGUE */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-white border border-stone-200 rounded-md p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500 font-mono-tabular">
                <span>{p.category}</span>
                <span>{p.billingInterval}</span>
              </div>
              <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">{p.name}</h2>
              <p className="text-xs text-stone-600">{p.targetAudience}</p>
              <div className="text-2xl font-semibold text-[#0B1F33] font-mono-tabular">
                ₦{p.priceNgn.toLocaleString()}{' '}
                <span className="text-xs font-normal text-stone-500">/ {p.billingInterval}</span>
              </div>
              <div className="text-xs font-mono-tabular text-[#4778A8] bg-stone-50 p-2.5 rounded border border-stone-200">
                {p.creditAllowance.toLocaleString()} Credits · {p.creditUnitDefinition}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-semibold text-stone-600 uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#0B1F33]">{inv.id}</td>
                    <td className="py-3.5 px-4 text-stone-700">{inv.description}</td>
                    <td className="py-3.5 px-4 font-mono-tabular text-stone-600">{inv.issuedAt}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold">
                      ₦{inv.amountNgn.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-emerald-700">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUPPORT DESK */}
      {activeTab === 'support' && (
        <div className="max-w-xl bg-white border border-stone-200 rounded-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0B1F33] font-editorial">
            Submit a Support or Billing Enquiry
          </h2>
          <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0B1F33] mb-1">Subject</label>
              <input
                type="text"
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F33] mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="How can our technical or billing team assist?"
                className="w-full px-3 py-2 border border-stone-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 font-semibold text-white bg-[#0B1F33] rounded-md"
            >
              Submit Ticket
            </button>
          </form>
          {supportSent && (
            <div className="p-3 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs">
              Support request logged. An Avichas engineer will review your ticket within 1 business day.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
