import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  KeyRound,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import {
  CustomerSubscription,
  InvoiceRecord,
  SubscriptionPlan,
  UserProfile,
} from '../types';

interface CustomerPortalViewProps {
  currentUser: UserProfile;
  plans: SubscriptionPlan[];
  subscriptions: CustomerSubscription[];
  invoices: InvoiceRecord[];
  initialTab?: 'plans' | 'dashboard' | 'invoices' | 'register' | 'support';
  onRefreshData: () => Promise<void>;
  onSwitchUser: (userId: string) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  currentUser,
  plans,
  subscriptions,
  invoices,
  initialTab = 'plans',
  onRefreshData,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<'plans' | 'dashboard' | 'invoices' | 'register' | 'support'>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Checkout & Server Verification State (Section 7)
  const [checkoutPlan, setCheckoutPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'Paystack' | 'Flutterwave'>('Paystack');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verificationReceipt, setVerificationReceipt] = useState<{
    reference: string;
    signature: string;
    planName: string;
    amountNgn: number;
    expiryDate: string;
  } | null>(null);

  // Registration State (Section 6)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'customer' | 'school_admin' | 'learner'>('customer');
  const [regStatusMessage, setRegStatusMessage] = useState<string | null>(null);

  // Support Request State (Section 6)
  const [supportSubject, setSupportSubject] = useState('Subscription Billing / Workflow Integration Support');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportConfirmation, setSupportConfirmation] = useState<string | null>(null);

  const visiblePlans =
    categoryFilter === 'ALL' ? plans : plans.filter((p) => p.category === categoryFilter);

  const handleVerifyAndActivatePlan = async (plan: SubscriptionPlan) => {
    setIsVerifyingPayment(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-avichas-user-id': currentUser.id,
        },
        body: JSON.stringify({
          planId: plan.id,
          provider: paymentGateway,
          organisationName: currentUser.organisationName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerificationReceipt({
          reference: data.subscription.paymentReference,
          signature: data.webhookSignatureHash,
          planName: plan.name,
          amountNgn: plan.priceNgn,
          expiryDate: data.subscription.expiryDate,
        });
        setCheckoutPlan(null);
        await onRefreshData();
      }
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    await fetch(`/api/subscriptions/${subId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({ status: 'Cancelled' }),
    });
    await onRefreshData();
  };

  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegStatusMessage(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        organisationName: regOrg,
        phone: regPhone,
        role: regRole,
      }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      setRegStatusMessage(`Account created and verified for ${data.user.name} (${data.user.organisationName}).`);
      setRegName('');
      setRegEmail('');
      setRegOrg('');
      setRegPhone('');
      await onRefreshData();
      onSwitchUser(data.user.id);
    } else {
      setRegStatusMessage(data.error || 'Registration failed.');
    }
  };

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Support Ticket',
        fullName: currentUser.name,
        organisation: currentUser.organisationName,
        email: currentUser.email,
        phone: currentUser.phone,
        serviceInterest: supportSubject,
        message: supportMessage,
      }),
    });
    if (res.ok) {
      setSupportMessage('');
      setSupportConfirmation(
        'Support request logged. An automated confirmation has been recorded and dispatched to our engineering support desk.'
      );
      await onRefreshData();
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-10">
      {/* Portal Header */}
      <div className="bg-[#0B1F33] text-white rounded-md p-8 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs text-[#C9B58B] font-mono-tabular">
              PART I SECTIONS 6 & 7 · CLIENT PORTAL, NAIRA SUBSCRIPTIONS & SERVER-VERIFIED PAYMENTS
            </div>
            <h1 className="text-3xl font-semibold font-editorial tracking-tight">
              Subscriptions & Client Portal
            </h1>
            <div className="text-xs text-stone-300 font-mono-tabular">
              Signed in as: <strong className="text-white">{currentUser.name}</strong> ·{' '}
              <span>{currentUser.organisationName}</span> · Role: <span>{currentUser.role.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-md">
            {[
              { id: 'plans', label: 'Subscription Plans (₦)' },
              { id: 'dashboard', label: 'My Subscriptions & Access' },
              { id: 'invoices', label: 'Invoices & Receipts' },
              { id: 'register', label: 'Register / Account' },
              { id: 'support', label: 'Request Support' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === t.id ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold' : 'text-stone-200 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Receipt Banner */}
      {verificationReceipt && (
        <div className="bg-emerald-950 text-white border border-emerald-500/40 rounded-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-emerald-300 font-mono-tabular">
              SERVER-SIDE PAYMENT & WEBHOOK VERIFIED · PAID ACCESS PROVISIONED
            </div>
            <div className="text-base font-semibold">
              {verificationReceipt.planName} — ₦{verificationReceipt.amountNgn.toLocaleString()}
            </div>
            <div className="text-xs text-stone-300 font-mono-tabular">
              Ref: {verificationReceipt.reference} · Valid Until: {verificationReceipt.expiryDate} · HMAC:{' '}
              {verificationReceipt.signature.slice(0, 20)}...
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 text-xs font-semibold bg-white text-[#0B1F33] rounded-md whitespace-nowrap shrink-0"
          >
            View Active Entitlement →
          </button>
        </div>
      )}

      {/* TAB 1: SUBSCRIPTION CATALOGUE & CHECKOUT (Section 7) */}
      {activeTab === 'plans' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-300 pb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
                Nigerian Naira Subscription & Licensing Plans
              </h2>
              <p className="text-xs text-stone-600">
                Lifecycle: Plan selected → Checkout → Server payment verification → Subscription activated → Access
                provisioned → Renewal reminders.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-md self-start">
              {['ALL', 'School Licensing', 'Corporate', 'Enterprise'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                    categoryFilter === cat ? 'bg-[#0B1F33] text-white' : 'text-stone-700 hover:text-[#0B1F33]'
                  }`}
                >
                  {cat === 'ALL' ? 'All Plans' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visiblePlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-mono-tabular">
                    <span>
                      {plan.category} · {plan.code}
                    </span>
                    <span>{plan.billingInterval}</span>
                  </div>

                  <h3 className="text-2xl font-semibold text-[#0B1F33] font-editorial">{plan.name}</h3>
                  <p className="text-xs text-stone-600">{plan.targetAudience}</p>

                  <div className="text-3xl font-semibold text-[#0B1F33] font-mono-tabular">
                    ₦{plan.priceNgn.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-stone-500">/ {plan.billingInterval}</span>
                  </div>

                  <div className="p-3 rounded bg-stone-50 border border-stone-200 text-xs font-mono-tabular text-[#0B1F33]">
                    {plan.creditAllowance.toLocaleString()} Credits · {plan.creditUnitDefinition}
                  </div>

                  <ul className="space-y-2 text-xs text-stone-700 pt-2">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0B1F33] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-200 flex items-center justify-between gap-4">
                  <span className="text-xs text-stone-500 font-mono-tabular">
                    Duration: {plan.durationDays} days
                  </span>
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan(plan)}
                    className="px-5 py-2.5 text-xs font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    Select Plan & Checkout →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Server-Side Payment Checkout Modal / Drawer */}
          {checkoutPlan && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white border border-stone-300 rounded-md max-w-lg w-full p-6 sm:p-8 space-y-6">
                <div className="space-y-1 border-b border-stone-200 pb-4">
                  <div className="text-xs font-mono-tabular text-[#4778A8]">
                    SECTION 7 · NIGERIAN PAYMENT GATEWAY & WEBHOOK VERIFICATION
                  </div>
                  <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                    Complete Subscription Checkout
                  </h3>
                </div>

                <div className="p-4 rounded bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
                  <div className="font-semibold text-[#0B1F33]">{checkoutPlan.name}</div>
                  <div className="font-mono-tabular text-lg font-semibold text-[#0B1F33]">
                    ₦{checkoutPlan.priceNgn.toLocaleString()} ({checkoutPlan.billingInterval})
                  </div>
                  <div className="text-stone-600">
                    Subscriber Organisation: <strong>{currentUser.organisationName}</strong> ({currentUser.email})
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#0B1F33]">
                    Select Nigerian Payment Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Paystack', 'Flutterwave'] as const).map((prov) => (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => setPaymentGateway(prov)}
                        className={`py-2.5 px-3 text-xs font-semibold rounded border ${
                          paymentGateway === prov
                            ? 'bg-[#0B1F33] text-white border-[#0B1F33]'
                            : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {prov} (NGN Checkout)
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-stone-600 bg-stone-100 p-3 rounded border border-stone-200 leading-relaxed">
                  <strong>Security Guarantee (Section 7):</strong> Raw card numbers are handled exclusively by{' '}
                  {paymentGateway} and never touch Avichas servers. Paid access is provisioned only after our backend
                  verifies the signed webhook & transaction reference.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan(null)}
                    className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-[#0B1F33]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isVerifyingPayment}
                    onClick={() => handleVerifyAndActivatePlan(checkoutPlan)}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md"
                  >
                    {isVerifyingPayment
                      ? 'Verifying Server Signature...'
                      : `Pay ₦${checkoutPlan.priceNgn.toLocaleString()} & Verify Webhook`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER DASHBOARD & SUBSCRIPTIONS (Section 6) */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-md p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-stone-500 font-mono-tabular">
                ORGANISATION ISOLATION ENFORCED ON SERVER (/api/bootstrap)
              </div>
              <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                Active Subscriptions & Authorised Products for {currentUser.organisationName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md whitespace-nowrap shrink-0"
            >
              Purchase or Renew Plan
            </button>
          </div>

          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Subscription & Plan</th>
                    <th className="py-3 px-4">Organisation</th>
                    <th className="py-3 px-4 text-right">Amount (NGN)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Start & Expiry</th>
                    <th className="py-3 px-4">Webhook Reference</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 text-xs">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0B1F33]">{sub.planName}</div>
                        <div className="text-stone-500 font-mono-tabular">{sub.billingInterval}</div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">{sub.organisationName}</td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0B1F33]">
                        ₦{sub.amountNgn.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular">
                        <span
                          className={
                            sub.status === 'Active'
                              ? 'text-emerald-700 font-semibold'
                              : sub.status === 'Expired' || sub.status === 'Cancelled'
                                ? 'text-red-700 font-semibold'
                                : 'text-amber-700 font-semibold'
                          }
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-stone-600">
                        {sub.startDate} → {sub.expiryDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-stone-600">
                        {sub.paymentProvider} · {sub.paymentReference}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {sub.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="text-xs font-medium text-red-700 hover:underline"
                          >
                            Cancel Auto-Renew
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INVOICES & PAYMENT HISTORY */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <div className="p-6 border-b border-stone-200">
            <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">
              Verified Invoices & Naira Payment Receipts
            </h2>
            <p className="text-xs text-stone-500">
              Official transaction records verified against Paystack and Flutterwave webhooks.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Organisation</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-xs">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50">
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#0B1F33]">{inv.id}</td>
                    <td className="py-3.5 px-4 text-stone-700">{inv.description}</td>
                    <td className="py-3.5 px-4 text-stone-600">{inv.organisationName}</td>
                    <td className="py-3.5 px-4 font-mono-tabular text-stone-600">{inv.issuedAt}</td>
                    <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#0B1F33]">
                      ₦{inv.amountNgn.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-emerald-700">
                      {inv.status} ({inv.providerReference})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMER REGISTRATION & ACCOUNT SETTINGS */}
      {activeTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
            <div className="space-y-1 border-b border-stone-200 pb-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                SECTION 6 · CUSTOMER REGISTRATION & ORGANISATION ONBOARDING
              </div>
              <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
                Create a New Customer, School or Learner Account
              </h2>
            </div>

            <form onSubmit={handleRegisterAccount} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g., Chief Emeka Obi"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Corporate or School Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="emeka@company.ng"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Company or School Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regOrg}
                    onChange={(e) => setRegOrg(e.target.value)}
                    placeholder="e.g., Zenith Logistics Nigeria Ltd"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Account Category</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as typeof regRole)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md bg-white"
                >
                  <option value="customer">Corporate Customer Account</option>
                  <option value="school_admin">School Administrator (School AI Licensing)</option>
                  <option value="learner">Avichas Academy Learner</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md"
              >
                Register Account & Sign In Immediately
              </button>
            </form>

            {regStatusMessage && (
              <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                {regStatusMessage}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-[#EDE7D9] border border-stone-300 rounded-md p-6 sm:p-8 space-y-4">
            <div className="text-xs font-mono-tabular text-[#0B1F33]">ACTIVE PROFILE & ORGANISATION DETAILS</div>
            <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">{currentUser.name}</h3>
            <div className="space-y-2 text-xs text-[#2E3A44] font-mono-tabular">
              <div>Organisation: {currentUser.organisationName}</div>
              <div>Organisation ID: {currentUser.organisationId}</div>
              <div>Email: {currentUser.email}</div>
              <div>Phone: {currentUser.phone}</div>
              <div>Server Role: {currentUser.role.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER SUPPORT DESK */}
      {activeTab === 'support' && (
        <div className="max-w-2xl bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-5">
          <div className="space-y-1 border-b border-stone-200 pb-4">
            <div className="text-xs font-mono-tabular text-[#4778A8]">SECTION 6 & 12 · CLIENT SUPPORT TICKET</div>
            <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">
              Submit a Technical or Billing Support Request
            </h2>
          </div>

          <form onSubmit={handleSubmitSupport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Support Topic</label>
              <input
                type="text"
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                Detailed Description (Include Invoice or School ID if applicable)
              </label>
              <textarea
                rows={4}
                required
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe how our engineering or billing team can assist..."
                className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md"
            >
              Submit Support Ticket
            </button>
          </form>

          {supportConfirmation && (
            <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              {supportConfirmation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
