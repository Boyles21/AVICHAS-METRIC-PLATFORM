import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  KeyRound,
  Lock,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { SchoolLicence, SubscriptionPlan, UserProfile } from '../types';

interface SchoolPortalViewProps {
  currentUser: UserProfile;
  schoolLicences: SchoolLicence[];
  plans: SubscriptionPlan[];
  onRefreshData: () => Promise<void>;
}

export const SchoolPortalView: React.FC<SchoolPortalViewProps> = ({
  currentUser,
  schoolLicences,
  plans,
  onRefreshData,
}) => {
  const schoolPlans = plans.filter((p) => p.category === 'School Licensing');
  const [activeTab, setActiveTab] = useState<'overview' | 'onboarding' | 'simulator' | 'privacy_vault'>('overview');

  // Onboarding Form State (9-Step Flow per Section 8A)
  const [schoolName, setSchoolName] = useState('Royal Crest International College, Ikeja');
  const [stateLocation, setStateLocation] = useState('Lagos State');
  const [contactPhone, setContactPhone] = useState('+234 803 900 4411');
  const [selectedPlanId, setSelectedPlanId] = useState(schoolPlans[0]?.id || 'pln-sch-term-standard');
  const [paymentProvider, setPaymentProvider] = useState<'Paystack' | 'Flutterwave'>('Paystack');
  const [onboardingResult, setOnboardingResult] = useState<{
    licenceKey: string;
    schoolId: string;
    webhookHash: string;
    expiryDate: string;
  } | null>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Licensing API & n8n Simulator State (Section 8C & 8D)
  const defaultLicence = schoolLicences[0];
  const [simLicenceKey, setSimLicenceKey] = useState(
    defaultLicence?.licenceKey || 'AVC-SCH-9F4A-77C2-E109-B83D'
  );
  const [simWorkflow, setSimWorkflow] = useState<
    'result_analysis' | 'lesson_planning' | 'report_preparation' | 'admin_workflow' | 'performance_summary'
  >('result_analysis');
  const [simIdempotencyKey, setSimIdempotencyKey] = useState(`idem-n8n-${Date.now().toString().slice(-5)}`);
  const [simBypassAttempt, setSimBypassAttempt] = useState(false);
  const [simResponse, setSimResponse] = useState<Record<string, unknown> | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Encrypted AI Provider Credential Vault State (Section 8F)
  const [selectedVaultLicId, setSelectedVaultLicId] = useState(defaultLicence?.id || 'lic-01');
  const [aiProviderName, setAiProviderName] = useState<'Google Gemini API' | 'OpenAI API' | 'Anthropic Claude API'>(
    'Google Gemini API'
  );
  const [rawApiKeyInput, setRawApiKeyInput] = useState('');
  const [vaultMessage, setVaultMessage] = useState<string | null>(null);

  const handleCompleteSchoolOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOnboarding(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-avichas-user-id': currentUser.id,
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          provider: paymentProvider,
          organisationName: schoolName,
          contactPhone,
          stateLocation,
        }),
      });
      const data = await res.json();
      if (res.ok && data.schoolLicence) {
        setOnboardingResult({
          licenceKey: data.schoolLicence.licenceKey,
          schoolId: data.schoolLicence.schoolId,
          webhookHash: data.webhookSignatureHash,
          expiryDate: data.schoolLicence.expiryDate,
        });
        setSimLicenceKey(data.schoolLicence.licenceKey);
        await onRefreshData();
      }
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleRunLicensingCheck = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/v1/licensing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenceKey: simLicenceKey,
          workflowType: simWorkflow,
          idempotencyKey: simIdempotencyKey,
          creditsRequested: 1,
          simulateBypassAttempt: simBypassAttempt,
        }),
      });
      const data = await res.json();
      setSimResponse({ httpStatus: res.status, ...data });
      await onRefreshData();
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveSchoolAiCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setVaultMessage(null);
    const res = await fetch(`/api/schools/${selectedVaultLicId}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({
        providerName: aiProviderName,
        rawApiKey: rawApiKeyInput,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setRawApiKeyInput('');
      setVaultMessage(data.securityNotice);
      await onRefreshData();
    } else {
      setVaultMessage(data.error || 'Failed to save credential.');
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="bg-[#0B1F33] text-white rounded-md p-8 sm:p-10 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="text-xs text-[#C9B58B] font-mono-tabular">
              PART I SECTION 8 · SCHOOL AI SOLUTIONS, CENTRAL LICENSING API & LOCAL n8n DEPLOYMENT
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold font-editorial tracking-tight">
              Avichas School AI Solutions & Licensing Portal
            </h1>
            <p className="text-sm text-stone-300 leading-relaxed">
              Participating schools run approved academic workflows on their own n8n computer/server while Avichas
              operates the central licensing, credit entitlement, and subscription verification service over HTTPS.
            </p>
          </div>

          {/* Interactive Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'overview' ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold' : 'text-stone-200 hover:text-white'
              }`}
            >
              Licence Records & Plans
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('onboarding')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'onboarding'
                  ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              9-Step School Onboarding
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulator')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'simulator'
                  ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              Live n8n & Licensing API Tester
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy_vault')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'privacy_vault'
                  ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              Data Privacy Map & AI Vault
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & LICENCE MANAGEMENT (Section 8B) */}
      {activeTab === 'overview' && (
        <div className="space-y-10">
          {/* School Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schoolPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-stone-500 font-mono-tabular">
                    <span>{plan.code}</span>
                    <span>{plan.billingInterval}</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">{plan.name}</h2>
                  <p className="text-xs text-stone-600">{plan.targetAudience}</p>
                  <div className="text-3xl font-semibold text-[#0B1F33] font-mono-tabular">
                    ₦{plan.priceNgn.toLocaleString()}{' '}
                    <span className="text-xs font-normal text-stone-500">/ {plan.billingInterval}</span>
                  </div>
                  <div className="text-xs text-[#4778A8] font-mono-tabular bg-stone-50 p-2.5 rounded border border-stone-200">
                    Allowance: {plan.creditAllowance.toLocaleString()} Credits · {plan.creditUnitDefinition}
                  </div>
                  <ul className="space-y-2 text-xs text-stone-700 pt-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0B1F33] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs text-stone-500 font-mono-tabular">
                    Permitted: {plan.permittedWorkflows.join(', ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setActiveTab('onboarding');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    Onboard School on Plan →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active School Licence Records Table */}
          <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
            <div className="p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#0B1F33] font-editorial">
                  School Licence Registry (Section 8B)
                </h3>
                <p className="text-xs text-stone-500">
                  Server-isolated records showing cryptographic licence keys, credit consumption, and local n8n
                  installation status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className="px-4 py-2 text-xs font-semibold text-[#0B1F33] bg-[#EDE7D9] hover:bg-[#C9B58B] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Test Entitlement Verification API →
              </button>
            </div>

            {schoolLicences.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <p className="text-sm text-stone-600">
                  Your current role ({currentUser.role}) is isolated from other schools’ licence records (Section 6 &
                  14). Switch to Role: ADMIN or SCHOOL_ADMIN in the top toolbar, or onboard a new school.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('onboarding')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
                >
                  Register & Onboard a School
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
                      <th className="py-3 px-4">School & ID</th>
                      <th className="py-3 px-4">Cryptographic Licence Key</th>
                      <th className="py-3 px-4">Licence State</th>
                      <th className="py-3 px-4 text-right">Workflow Credits</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">n8n Deployment Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-xs">
                    {schoolLicences.map((lic) => {
                      const remaining = lic.creditAllowance - lic.creditsUsed;
                      return (
                        <tr key={lic.id} className="hover:bg-stone-50/80">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#0B1F33]">{lic.schoolName}</div>
                            <div className="text-stone-500 font-mono-tabular">
                              {lic.schoolId} · {lic.contactPerson}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono-tabular text-[#0B1F33] font-medium">
                            {lic.licenceKey}
                          </td>
                          <td className="py-3.5 px-4 font-mono-tabular">
                            <span
                              className={
                                lic.status === 'Active'
                                  ? 'text-emerald-700 font-semibold'
                                  : lic.status === 'Expired' || lic.status === 'Suspended'
                                    ? 'text-red-700 font-semibold'
                                    : 'text-amber-700 font-semibold'
                              }
                            >
                              {lic.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-tabular">
                            <div className="font-semibold text-[#0B1F33]">
                              {remaining.toLocaleString()} / {lic.creditAllowance.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-stone-500">{lic.creditsUsed} used</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono-tabular text-stone-700">{lic.expiryDate}</td>
                          <td className="py-3.5 px-4 text-stone-700">
                            <div>{lic.deploymentStatus}</div>
                            <div className="text-[11px] text-stone-500 font-mono-tabular">{lic.n8nInstanceVersion}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSimLicenceKey(lic.licenceKey);
                                setActiveTab('simulator');
                              }}
                              className="text-xs font-semibold text-[#4778A8] hover:text-[#0B1F33] whitespace-nowrap"
                            >
                              Verify in API →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 9-STEP SCHOOL ONBOARDING (Section 8A) */}
      {activeTab === 'onboarding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
            <div className="space-y-2 border-b border-stone-200 pb-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                SECTION 8A · AUTOMATED 9-STEP SCHOOL ONBOARDING & LICENCE PROVISIONING
              </div>
              <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
                Register School, Verify Naira Payment & Issue Cryptographic Licence
              </h2>
            </div>

            <form onSubmit={handleCompleteSchoolOnboarding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Step 1 & 2: Registered School Name & State Location
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="sm:col-span-2 px-3.5 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#0B1F33]"
                    placeholder="e.g., Lagoon Greenfield College"
                  />
                  <input
                    type="text"
                    required
                    value={stateLocation}
                    onChange={(e) => setStateLocation(e.target.value)}
                    className="px-3.5 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#0B1F33]"
                    placeholder="State (e.g., Lagos)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Authorised School Contact Phone (Principal / ICT Director)
                </label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md focus:outline-none focus:border-[#0B1F33] font-mono-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Step 3: Select School Subscription Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md bg-white focus:outline-none focus:border-[#0B1F33]"
                >
                  {schoolPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₦{p.priceNgn.toLocaleString()} ({p.creditAllowance.toLocaleString()} Workflow Credits)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Step 4: Nigerian Payment Gateway (Server-Side Webhook Verification)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Paystack', 'Flutterwave'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setPaymentProvider(prov)}
                      className={`py-2.5 px-4 text-xs font-semibold rounded-md border transition-colors ${
                        paymentProvider === prov
                          ? 'bg-[#0B1F33] text-white border-[#0B1F33]'
                          : 'bg-stone-50 text-stone-700 border-stone-300'
                      }`}
                    >
                      Verify via {prov} (NGN)
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-1">
                <div className="font-semibold text-[#0B1F33]">Security Enforcement (Section 7 & 8A):</div>
                <p>
                  Raw payment-card details are never stored on Avichas servers. Cryptographic licence identifiers (
                  <code className="font-mono-tabular">AVC-SCH-XXXX-XXXX-XXXX-XXXX</code>) are generated only after
                  server-side payment signature verification. Easily guessed school names are rejected as authentication.
                </p>
              </div>

              <button
                type="submit"
                disabled={isOnboarding}
                className="w-full py-3 px-5 text-sm font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors"
              >
                {isOnboarding
                  ? 'Verifying Payment Webhook & Generating Cryptographic Licence...'
                  : 'Confirm Server Payment & Issue School Licence Key'}
              </button>
            </form>

            {onboardingResult && (
              <div className="p-6 rounded-md bg-[#0B1F33] text-white space-y-3 border border-[#C9B58B]">
                <div className="text-xs text-[#C9B58B] font-mono-tabular">
                  STEPS 5–9 COMPLETE · SCHOOL ORGANISATION & LICENCE PROVISIONED
                </div>
                <div className="text-lg font-semibold font-editorial">{schoolName}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-tabular bg-white/5 p-3.5 rounded border border-white/10">
                  <div>
                    <span className="text-stone-400 block">School ID:</span>
                    <span className="text-white font-semibold">{onboardingResult.schoolId}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Expiry Date:</span>
                    <span className="text-white font-semibold">{onboardingResult.expiryDate}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-stone-400 block">Issued Cryptographic Licence Key:</span>
                    <span className="text-[#C9B58B] text-sm font-semibold">{onboardingResult.licenceKey}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('simulator')}
                  className="px-4 py-2 text-xs font-semibold bg-[#C9B58B] text-[#0B1F33] rounded-md"
                >
                  Test Issued Licence in n8n Workflow Simulator →
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Step-by-Step Local n8n Onboarding Instructions (Step 8) */}
          <div className="lg:col-span-5 bg-[#EDE7D9] border border-stone-300 rounded-md p-6 sm:p-8 space-y-5">
            <div className="text-xs font-mono-tabular text-[#0B1F33]">
              STEP 8 · SCHOOL-SIDE n8n INSTALLATION & ONBOARDING GUIDE
            </div>
            <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">
              How Your School Connects Its Local n8n Server to Avichas
            </h3>
            <ol className="space-y-3.5 text-xs text-[#2E3A44] leading-relaxed">
              <li>
                <strong className="text-[#0B1F33]">1. Provision School Host:</strong> Install Docker or Node.js LTS on
                the designated school computer/server and run self-hosted <code className="font-mono-tabular">n8n</code>.
              </li>
              <li>
                <strong className="text-[#0B1F33]">2. Import Approved Avichas Workflow Templates:</strong> Load the signed
                workflow JSON packages for Result Analysis, Report Preparation, and Lesson Planning.
              </li>
              <li>
                <strong className="text-[#0B1F33]">3. Configure Environment Variables:</strong> Set{' '}
                <code className="font-mono-tabular">AVICHAS_LICENCE_KEY</code> and{' '}
                <code className="font-mono-tabular">AVICHAS_SCHOOL_ID</code> in the n8n credential store.
              </li>
              <li>
                <strong className="text-[#0B1F33]">4. Verify Entitlement Node:</strong> Every workflow starts by calling{' '}
                <code className="font-mono-tabular">POST /api/v1/licensing/verify</code> over HTTPS with an{' '}
                <code className="font-mono-tabular">idempotencyKey</code>.
              </li>
              <li>
                <strong className="text-[#0B1F33]">5. Offline Cache Behaviour (Section 8D):</strong> Successful checks
                return a signed 72-hour entitlement token. Do not promise immediate stoppage while a school server is
                offline; cached tokens expire strictly after 72 hours or 50 offline runs.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE AVICHAS LICENSING API & n8n WORKFLOW SIMULATOR (Section 8C & 8D) */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6 bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5 border-b border-stone-200 pb-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                SECTION 8C & 8D · LIVE ENDPOINT: POST /api/v1/licensing/verify
              </div>
              <h2 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                School-Side n8n Workflow & Entitlement Tester
              </h2>
              <p className="text-xs text-stone-600">
                Pattern: Trigger → Licence & Entitlement Check → Validate Inputs → Process Authorised Task → Record
                Usage → Return Result.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Select Preset Licence Key or Enter Custom Key (Test School Name Rejection)
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {schoolLicences.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSimLicenceKey(l.licenceKey)}
                      className="px-2.5 py-1 text-[11px] font-mono-tabular bg-stone-100 hover:bg-stone-200 text-[#0B1F33] rounded border border-stone-300"
                    >
                      {l.schoolName.split(',')[0]} ({l.status})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSimLicenceKey('Lagoon Greenfield College')}
                    className="px-2.5 py-1 text-[11px] font-mono-tabular bg-red-50 hover:bg-red-100 text-red-800 rounded border border-red-200"
                  >
                    Test Plain School Name (Must Reject per Sec 8A)
                  </button>
                </div>
                <input
                  type="text"
                  value={simLicenceKey}
                  onChange={(e) => setSimLicenceKey(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 rounded-md font-mono-tabular focus:outline-none focus:border-[#0B1F33]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Requested School Workflow Node
                  </label>
                  <select
                    value={simWorkflow}
                    onChange={(e) => setSimWorkflow(e.target.value as typeof simWorkflow)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md bg-white font-mono-tabular"
                  >
                    <option value="result_analysis">result_analysis (Verified)</option>
                    <option value="report_preparation">report_preparation (Verified)</option>
                    <option value="lesson_planning">lesson_planning (Verified)</option>
                    <option value="admin_workflow">admin_workflow (Institutional Plan Only)</option>
                    <option value="performance_summary">performance_summary (Institutional Plan Only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                    Idempotency Key (Prevents Duplicate Deductions)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={simIdempotencyKey}
                      onChange={(e) => setSimIdempotencyKey(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md font-mono-tabular"
                    />
                    <button
                      type="button"
                      onClick={() => setSimIdempotencyKey(`idem-n8n-${Date.now().toString().slice(-5)}`)}
                      className="px-2.5 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-md text-xs"
                      title="Generate new idempotency key"
                    >
                      New
                    </button>
                  </div>
                </div>
              </div>

              {/* Threat Model Check: Local n8n Bypass Simulation (Section 8D) */}
              <div className="p-3.5 rounded bg-amber-50/80 border border-amber-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simBypassAttempt}
                    onChange={(e) => setSimBypassAttempt(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-amber-950 leading-relaxed">
                    <strong>Simulate Local n8n Node Bypass Attempt (Section 8D Security Test):</strong> Test what
                    happens when a school administrator edits their local n8n workflow to skip the initial check node
                    and calls the server-side AI connector without a signed entitlement token.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleRunLicensingCheck}
                disabled={isSimulating}
                className="w-full py-3 px-5 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-[#C9B58B]" />
                <span>
                  {isSimulating ? 'Executing POST /api/v1/licensing/verify...' : 'Execute n8n Licence & Entitlement Check'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Live API Response & Threat Model Documentation */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#0B1F33] text-stone-100 rounded-md p-6 border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-mono-tabular text-[#C9B58B]">
                  SERVER RESPONSE · /api/v1/licensing/verify
                </span>
                {simResponse && (
                  <span
                    className={`text-xs font-mono-tabular font-semibold ${
                      simResponse.decision === 'ALLOW' ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    HTTP {String(simResponse.httpStatus)} · {String(simResponse.decision)}
                  </span>
                )}
              </div>

              <pre className="text-xs font-mono-tabular text-stone-200 overflow-x-auto leading-relaxed max-h-[340px]">
                {simResponse
                  ? JSON.stringify(simResponse, null, 2)
                  : `// Click "Execute n8n Licence & Entitlement Check" to inspect live server verification:\n// - Authenticates cryptographic licence key\n// - Verifies Active status, expiry date & plan workflow permissions\n// - Deducts 1 workflow credit (or replays idempotently if same idempotencyKey)\n// - Returns signed 72h offline entitlement cache token`}
              </pre>
            </div>

            <div className="bg-white border border-stone-200 rounded-md p-6 space-y-2">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                ARCHITECTURAL CONSTRAINT · SECTION 8D & SECTION 20
              </div>
              <h3 className="text-base font-semibold text-[#0B1F33] font-editorial">
                Why Local n8n Checks Are Paired with Server-Side Signed Connectors
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                As required by Section 8D: A school controlling its own local n8n instance can edit local workflow nodes
                or delete a local HTTP check node. Therefore, Avichas does not rely solely on an editable local check
                node—valuable AI prompt synthesis and broadsheet grading connectors validate a short-lived{' '}
                <code className="font-mono-tabular">avc_sig_*</code> entitlement signature on the Avichas gateway before
                executing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCHOOL DATA PRIVACY MAP & ENCRYPTED AI CREDENTIAL VAULT (Section 8E & 8F) */}
      {activeTab === 'privacy_vault' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Section 8E: School Data Privacy Map */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5 border-b border-stone-200 pb-4">
              <div className="text-xs font-mono-tabular text-[#4778A8]">
                SECTION 8E · TRANSPARENT SCHOOL DATA PRIVACY ARCHITECTURE (NDPA ALIGNED)
              </div>
              <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
                Data Boundary Specification: School Server vs. Avichas vs. AI Providers
              </h2>
              <p className="text-xs text-stone-600">
                Per Section 8E & 20: Avichas never claims school data never leaves school premises unless the deployed
                architecture uses 100% local models. Below is the exact documented data flow:
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="font-semibold text-[#0B1F33]">1. What Remains on School Infrastructure:</div>
                <p className="text-stone-700">
                  Full student admission registers, raw Excel/CSV broadsheets, parent phone directories, disciplinary
                  files, and local n8n workflow execution state remain stored on the school’s local computer or server.
                </p>
              </div>

              <div className="p-4 rounded bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="font-semibold text-[#0B1F33]">
                  2. What Is Transmitted to Avichas Licensing API (/api/v1/licensing/verify):
                </div>
                <p className="text-stone-700">
                  Strictly entitlement telemetry: <code className="font-mono-tabular">schoolId</code>,{' '}
                  <code className="font-mono-tabular">licenceKey</code>,{' '}
                  <code className="font-mono-tabular">workflowType</code>,{' '}
                  <code className="font-mono-tabular">idempotencyKey</code>, timestamp, and credit count. Zero student
                  names or grades are required by the Licensing API.
                </p>
              </div>

              <div className="p-4 rounded bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="font-semibold text-[#0B1F33]">
                  3. What Is Transmitted to Third-Party AI Providers (Google Gemini / OpenAI):
                </div>
                <p className="text-stone-700">
                  When a workflow generates lesson plans, cohort summaries, or report card remarks, the structured prompt
                  payload traverses encrypted HTTPS to the configured AI provider under their API data-processing terms
                  (zero training on paid API payloads). Schools are advised to use student IDs/initials rather than full
                  names in external prompts.
                </p>
              </div>

              <div className="p-4 rounded bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="font-semibold text-[#0B1F33]">
                  4. Logs, Backups, Access Control & Data Deletion:
                </div>
                <p className="text-stone-700">
                  Avichas licensing logs are retained for 12 months for billing reconciliation and can be exported or
                  purged upon written school termination request within 14 business days.
                </p>
              </div>
            </div>
          </div>

          {/* Section 8F: Encrypted AI Provider Credentials Vault */}
          <div className="lg:col-span-5 bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
            <div className="space-y-1.5 border-b border-stone-200 pb-4">
              <div className="text-xs font-mono-tabular text-[#B5965A]">
                SECTION 8F · BRING-YOUR-OWN AI CREDENTIALS VAULT
              </div>
              <h3 className="text-xl font-semibold text-[#0B1F33] font-editorial">
                School AI-Provider API Key Configuration
              </h3>
              <p className="text-xs text-stone-600">
                Where permitted by the plan, schools may supply their own AI provider credentials. Keys are stored
                server-side, masked in all responses, and omitted from ordinary logs.
              </p>
            </div>

            <form onSubmit={handleSaveSchoolAiCredential} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Select School Record</label>
                <select
                  value={selectedVaultLicId}
                  onChange={(e) => setSelectedVaultLicId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md bg-white"
                >
                  {schoolLicences.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.schoolName} ({l.maskedApiKey || 'No Key Set'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">Third-Party AI Provider</label>
                <select
                  value={aiProviderName}
                  onChange={(e) => setAiProviderName(e.target.value as typeof aiProviderName)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md bg-white"
                >
                  <option value="Google Gemini API">Google Gemini API</option>
                  <option value="OpenAI API">OpenAI API</option>
                  <option value="Anthropic Claude API">Anthropic Claude API</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B1F33] mb-1">
                  Enter Provider Secret Key (Never Exposed After Save)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={rawApiKeyInput}
                  onChange={(e) => setRawApiKeyInput(e.target.value)}
                  placeholder="AIzaSy... or sk-proj-..."
                  className="w-full px-3.5 py-2 text-xs border border-stone-300 rounded-md font-mono-tabular"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#0B1F33] hover:bg-[#163452] rounded-md transition-colors"
              >
                Encrypt & Save School AI Provider Key
              </button>
            </form>

            {vaultMessage && (
              <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                {vaultMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
