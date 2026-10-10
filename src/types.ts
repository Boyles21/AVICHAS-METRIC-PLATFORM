export type UserRole = 'admin' | 'editor' | 'customer' | 'school_admin' | 'learner';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organisationName: string;
  organisationId: string;
  phone: string;
  status: 'Active' | 'Pending Verification' | 'Suspended';
  createdAt: string;
}

export interface ServiceFAQ {
  question: string;
  answer: string;
}

export interface ServiceItem {
  id: string;
  indexNumber: string;
  slug: string;
  title: string;
  category: 'Corporate Intelligence' | 'Operations & Sales' | 'Education & Schools';
  shortSummary: string;
  businessProblem: string;
  designedFor: string[];
  whatAvichasProvides: string[];
  howItWorks: string[];
  expectedBenefits: { metric: string; indicator: string }[];
  implementationProcess: string[];
  commercialModel: 'Fixed / Customised Enquiry' | 'Standardised Subscription' | 'Hybrid (Assessment + Subscription)';
  startingPriceNgn: number;
  billingCadence: string;
  availabilityStatus: 'Production Verified' | 'Pilot Validation' | 'Custom Consultation';
  ctaLabel: string;
  ctaAction: 'assessment' | 'subscribe' | 'school_portal';
  faqs: ServiceFAQ[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  targetAudience: string;
  category: 'Corporate' | 'School Licensing' | 'Enterprise';
  priceNgn: number;
  billingInterval: 'Monthly' | 'Termly (4 Months)' | 'Annual' | 'One-Time';
  durationDays: number;
  creditAllowance: number;
  creditUnitDefinition: string;
  features: string[];
  permittedWorkflows: string[];
  active: boolean;
}

export interface CustomerSubscription {
  id: string;
  organisationId: string;
  organisationName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  amountNgn: number;
  billingInterval: string;
  status: 'Active' | 'Pending Verification' | 'Past Due' | 'Expired' | 'Cancelled' | 'Suspended';
  startDate: string;
  expiryDate: string;
  paymentProvider: 'Paystack' | 'Flutterwave' | 'Bank Transfer Verified';
  paymentReference: string;
  webhookVerified: boolean;
  autoRenew: boolean;
}

export interface InvoiceRecord {
  id: string;
  subscriptionId: string;
  organisationId: string;
  organisationName: string;
  amountNgn: number;
  issuedAt: string;
  status: 'Paid (Verified)' | 'Pending Webhook' | 'Failed' | 'Refunded';
  providerReference: string;
  description: string;
}

export type SchoolLicenceState =
  | 'Pending activation'
  | 'Active'
  | 'Suspended'
  | 'Expired'
  | 'Cancelled';

export interface SchoolVerificationLog {
  id: string;
  timestamp: string;
  workflowType: 'result_analysis' | 'lesson_planning' | 'report_preparation' | 'admin_workflow' | 'performance_summary';
  idempotencyKey: string;
  outcome: 'ALLOW' | 'DENY';
  reason: string;
  creditsDeducted: number;
  remainingCredits: number;
  schoolInstanceIp: string;
}

export interface SchoolLicence {
  id: string;
  schoolId: string;
  schoolName: string;
  stateLocation: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  licenceKey: string;
  planId: string;
  planName: string;
  status: SchoolLicenceState;
  activationDate: string;
  expiryDate: string;
  creditAllowance: number;
  creditsUsed: number;
  creditUnit: string;
  lastSuccessfulVerification: string;
  permittedFeatures: ('result_analysis' | 'lesson_planning' | 'report_preparation' | 'admin_workflow' | 'performance_summary')[];
  deploymentStatus: 'Not Installed' | 'Local n8n Configured' | 'Verified & Active' | 'Offline Cache Mode';
  n8nInstanceVersion: string;
  aiProviderConfigured: boolean;
  aiProviderName?: 'Google Gemini API' | 'OpenAI API' | 'Anthropic Claude API';
  maskedApiKey?: string;
  verificationLogs: SchoolVerificationLog[];
}

export interface AcademyLesson {
  id: string;
  title: string;
  durationMinutes: number;
  format: 'Video Briefing' | 'Practical Lab' | 'Executive Template' | 'Assessment Quiz';
  summary: string;
  resourceName: string;
}

export interface AcademyModule {
  id: string;
  title: string;
  lessons: AcademyLesson[];
}

export interface AcademyCourse {
  id: string;
  slug: string;
  title: string;
  category:
    | 'Artificial intelligence fundamentals'
    | 'Practical AI for business'
    | 'Workflow automation'
    | 'AI-assisted productivity'
    | 'Business data and performance intelligence'
    | 'Responsible use of AI'
    | 'Relevant school or education-focused AI training';
  intendedAudience: string;
  duration: string;
  instructor: string;
  instructorRole: string;
  priceNgn: number;
  isFree: boolean;
  enrolmentRequirements: string[];
  learningObjectives: string[];
  modules: AcademyModule[];
  certificateSupported: boolean;
  published: boolean;
}

export interface LearnerEnrolment {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  organisationName: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  paymentStatus: 'Paid (Verified)' | 'Complimentary' | 'Pending';
  completedLessonIds: string[];
  progressPercent: number;
  quizScore?: number;
  certificateIssued: boolean;
  certificateSerial?: string;
}

export type BlogCategory =
  | 'AI & Technology'
  | 'Business & Productivity'
  | 'Sales & Marketing'
  | 'Automation & Operations'
  | 'Data & Business Intelligence'
  | 'Education & AI'
  | 'Trust, Ethics & the Future'
  | 'Avichas News';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: BlogCategory;
  excerpt: string;
  content: string[];
  author: string;
  authorRole: string;
  publishedAt: string;
  readTimeMinutes: number;
  featured: boolean;
  status: 'Published' | 'Draft' | 'Scheduled' | 'Review Required (AI Sourced)';
  imageUrl: string;
  sourceAttribution?: {
    sourceName: string;
    sourceUrl: string;
    originalDate: string;
    editorialReviewedBy: string;
  };
}

export interface LegalPolicyDocument {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  lastUpdated: string;
  counselApprovalStatus: 'Draft — Pending Nigerian Legal Counsel Review' | 'Reviewed & Approved';
  regulatoryFramework: string;
  summary: string;
  sections: { heading: string; body: string }[];
}

export interface PreLaunchConfirmationItem {
  id: string;
  item: string;
  partReference: string;
  requiredDecisionEvidence: string;
  currentResolutionNotes: string;
  status: 'Open' | 'In Review' | 'Confirmed';
  owner: string;
}

export interface EnquirySubmission {
  id: string;
  type: 'Service Assessment' | 'Custom Quotation' | 'School Onboarding Enquiry' | 'Support Ticket';
  fullName: string;
  organisation: string;
  email: string;
  phone: string;
  serviceInterest: string;
  message: string;
  createdAt: string;
  status: 'New' | 'In Progress' | 'Resolved';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  ipAddress: string;
}

export interface DevelopmentPhaseSpec {
  phaseNumber: number;
  name: string;
  scope: string;
  objective: string;
  estimatedDuration: string;
  estimatedInvestmentNgn: string;
  dependencies: string[];
  acceptanceCriteria: string[];
}
