/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Central Entity Mappers
 * Maps snake_case PostgreSQL database rows to camelCase TypeScript interfaces.
 */

import {
  AcademyCourse,
  AuditLogEntry,
  BlogPost,
  CustomerSubscription,
  EnquirySubmission,
  InvoiceRecord,
  LearnerEnrolment,
  LegalPolicyDocument,
  PreLaunchConfirmationItem,
  SchoolLicence,
  ServiceItem,
  SubscriptionPlan,
  UserProfile,
} from '../types';

export function mapServiceRow(row: any): ServiceItem {
  return {
    id: row.id,
    indexNumber: row.index_number,
    slug: row.slug,
    title: row.title,
    category: row.category,
    shortSummary: row.short_summary,
    businessProblem: row.business_problem,
    designedFor: Array.isArray(row.designed_for) ? row.designed_for : [],
    whatAvichasProvides: Array.isArray(row.what_avichas_provides) ? row.what_avichas_provides : [],
    howItWorks: Array.isArray(row.how_it_works) ? row.how_it_works : [],
    expectedBenefits: Array.isArray(row.expected_benefits)
      ? row.expected_benefits
      : typeof row.expected_benefits === 'string'
      ? JSON.parse(row.expected_benefits)
      : [],
    implementationProcess: Array.isArray(row.implementation_process) ? row.implementation_process : [],
    commercialModel: row.commercial_model,
    startingPriceNgn: Number(row.starting_price_ngn) || 0,
    billingCadence: row.billing_cadence,
    availabilityStatus: row.availability_status || 'Production Verified',
    ctaLabel: row.cta_label,
    ctaAction: row.cta_action || 'assessment',
    faqs: Array.isArray(row.faqs)
      ? row.faqs
      : typeof row.faqs === 'string'
      ? JSON.parse(row.faqs)
      : [],
  };
}

export function mapPlanRow(row: any): SubscriptionPlan {
  let features = row.features;
  if (typeof features === 'string') {
    try {
      features = JSON.parse(features);
    } catch {
      features = [];
    }
  }

  return {
    id: row.id,
    name: row.name,
    code: row.code,
    targetAudience: row.target_audience || '',
    category: row.category || 'Corporate',
    priceNgn: Number(row.price_ngn) || 0,
    billingInterval: row.billing_interval || 'Monthly',
    durationDays: Number(row.duration_days) || 30,
    creditAllowance: Number(row.credit_allowance) || 0,
    creditUnitDefinition: row.credit_unit_definition || 'credits',
    features: Array.isArray(features) ? features : [],
    permittedWorkflows: Array.isArray(row.permitted_workflows) ? row.permitted_workflows : [],
    active: row.is_active !== false,
  };
}

export function mapCourseRow(row: any, modules: any[] = []): AcademyCourse {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    intendedAudience: row.intended_audience || '',
    duration: row.duration || '',
    instructor: row.instructor || '',
    instructorRole: row.instructor_role || '',
    priceNgn: Number(row.price_ngn) || 0,
    isFree: Boolean(row.is_free),
    enrolmentRequirements: Array.isArray(row.enrolment_requirements) ? row.enrolment_requirements : [],
    learningObjectives: Array.isArray(row.learning_objectives) ? row.learning_objectives : [],
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: Array.isArray(m.lessons)
        ? m.lessons.map((l: any) => ({
            id: l.id,
            title: l.title,
            durationMinutes: Number(l.duration_minutes) || 30,
            format: l.format || 'Video Briefing',
            summary: l.summary || '',
            resourceName: l.resource_name || '',
          }))
        : [],
    })),
    certificateSupported: row.certificate_supported !== false,
    published: row.is_published !== false,
  };
}

export function mapBlogPostRow(row: any): BlogPost {
  let sourceAttribution = row.source_attribution;
  if (typeof sourceAttribution === 'string') {
    try {
      sourceAttribution = JSON.parse(sourceAttribution);
    } catch {
      sourceAttribution = undefined;
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category || 'AI & Technology',
    excerpt: row.excerpt || row.short_excerpt || '',
    content: Array.isArray(row.content)
      ? row.content
      : typeof row.content === 'string'
      ? [row.content]
      : [],
    author: row.author || row.author_name || 'Avichas Editorial Board',
    authorRole: row.author_role || 'Avichas Insights Staff',
    publishedAt: row.published_at ? new Date(row.published_at).toISOString().split('T')[0] : '',
    readTimeMinutes: Number(row.read_time_minutes || row.reading_time_minutes) || 5,
    featured: Boolean(row.is_featured || row.featured),
    status: row.status || 'Published',
    imageUrl:
      (typeof row.image_url === 'string' && row.image_url.trim()) ||
      '/src/assets/images/insights_executive_operations_1791644616154.jpg',
    sourceAttribution,
  };
}

export function mapSubscriptionRow(row: any): CustomerSubscription {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    organisationName: row.organisation_name || 'Subscriber Organisation',
    customerEmail: row.customer_email || '',
    planId: row.plan_id || '',
    planName: row.plan_name || 'Active Plan',
    amountNgn: Number(row.price_ngn || row.amount_ngn) || 0,
    billingInterval: row.billing_interval || 'Monthly',
    status: row.status || 'Active',
    startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : '',
    expiryDate: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : '',
    paymentProvider: row.payment_provider || 'Paystack',
    paymentReference: row.payment_reference || '',
    webhookVerified: row.webhook_verified !== false,
    autoRenew: Boolean(row.auto_renew),
  };
}

export function mapInvoiceRow(row: any): InvoiceRecord {
  return {
    id: row.id,
    subscriptionId: row.subscription_id || '',
    organisationId: row.organisation_id,
    organisationName: row.organisation_name || 'Customer Organisation',
    amountNgn: Number(row.amount_ngn) || 0,
    issuedAt: row.issue_date || row.issued_at || (row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : ''),
    status: row.status || 'Paid (Verified)',
    providerReference: row.paystack_reference || row.provider_reference || '',
    description: row.description || `Invoice for subscription #${row.id?.slice(0, 8)}`,
  };
}

export function mapLicenceRow(row: any): SchoolLicence {
  return {
    id: row.id,
    schoolId: row.school_id,
    schoolName: row.school_name || 'Registered School',
    stateLocation: row.state_location || row.state || 'Lagos State',
    contactPerson: row.contact_person || 'Principal / Administrator',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    licenceKey: row.licence_key || (row.licence_key_last4 ? `AVC-SCH-••••${row.licence_key_last4}` : 'AVC-SCH-KEY'),
    planId: row.plan_id || '',
    planName: row.plan_name || 'School AI Workflow Licence',
    status: row.status || 'Active',
    activationDate: row.activation_date ? new Date(row.activation_date).toISOString().split('T')[0] : (row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : ''),
    expiryDate: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : '',
    creditAllowance: Number(row.credit_allowance) || 0,
    creditsUsed: Number(row.credits_used) || 0,
    creditUnit: row.credit_unit || 'Workflow Executions',
    lastSuccessfulVerification: row.last_verification_at ? new Date(row.last_verification_at).toISOString() : (row.last_verified_at ? new Date(row.last_verified_at).toISOString() : ''),
    permittedFeatures: Array.isArray(row.permitted_features) ? row.permitted_features : ['result_analysis', 'lesson_planning', 'report_preparation'],
    deploymentStatus: row.deployment_status || 'Local n8n Configured',
    n8nInstanceVersion: row.n8n_instance_version || row.n8n_version || 'n8n@1.62.4 (Self-Hosted)',
    aiProviderConfigured: Boolean(row.ai_provider_configured),
    aiProviderName: row.ai_provider_name,
    maskedApiKey: row.masked_api_key,
    verificationLogs: [],
  };
}

export function mapEnrolmentRow(row: any): LearnerEnrolment {
  return {
    id: row.id,
    learnerId: row.learner_id,
    learnerName: row.learner_name || 'Academy Learner',
    learnerEmail: row.learner_email || '',
    organisationName: row.organisation_name || 'Independent',
    courseId: row.course_id,
    courseTitle: row.course_title || 'Academy Course',
    enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString().split('T')[0] : '',
    paymentStatus: row.payment_status || 'Paid (Verified)',
    completedLessonIds: Array.isArray(row.completed_lesson_ids) ? row.completed_lesson_ids : [],
    progressPercent: Number(row.progress_percent) || 0,
    quizScore: row.quiz_score !== null && row.quiz_score !== undefined ? Number(row.quiz_score) : undefined,
    certificateIssued: Boolean(row.certificate_issued),
    certificateSerial: row.certificate_serial || undefined,
  };
}

export function mapUserProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    name: row.full_name || row.name || '',
    email: row.email,
    role: row.role,
    organisationName: row.organisation_name || 'Independent',
    organisationId: row.organisation_id || '',
    phone: row.phone || '',
    status: row.email_verified ? 'Active' : 'Pending Verification',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export function mapEnquiryRow(row: any): EnquirySubmission {
  return {
    id: row.id,
    type: row.type || 'Service Assessment',
    fullName: row.full_name,
    organisation: row.organisation,
    email: row.email,
    phone: row.phone || '',
    serviceInterest: row.service_interest,
    message: row.message,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    status: row.status || 'New',
  };
}

export function mapAuditLogRow(row: any): AuditLogEntry {
  return {
    id: row.id,
    timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    actorName: row.actor_name,
    actorRole: row.actor_role,
    action: row.action,
    target: row.target,
    ipAddress: row.ip_address || '127.0.0.1',
  };
}

export function mapPolicyRow(row: any): LegalPolicyDocument {
  let sections = row.sections;
  if (typeof sections === 'string') {
    try {
      sections = JSON.parse(sections);
    } catch {
      sections = [];
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortTitle: row.short_title || row.shortTitle || row.title,
    lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString().split('T')[0] : '',
    counselApprovalStatus: row.counsel_approval_status || 'Draft — Pending Nigerian Legal Counsel Review',
    regulatoryFramework: row.regulatory_framework || '',
    summary: row.summary || '',
    sections: Array.isArray(sections) ? sections : [],
  };
}

export function mapConfirmationRow(row: any): PreLaunchConfirmationItem {
  return {
    id: row.id,
    item: row.item,
    partReference: row.part_reference || '',
    requiredDecisionEvidence: row.required_decision_evidence || '',
    currentResolutionNotes: row.current_resolution_notes || '',
    status: row.status || 'Open',
    owner: row.owner || 'Avichas Leadership',
  };
}
