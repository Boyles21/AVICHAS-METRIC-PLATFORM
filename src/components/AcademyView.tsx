import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  PlayCircle,
} from 'lucide-react';
import { AcademyCourse, LearnerEnrolment, UserProfile } from '../types';

interface AcademyViewProps {
  currentUser: UserProfile;
  courses: AcademyCourse[];
  enrolments: LearnerEnrolment[];
  onRefreshData: () => Promise<void>;
}

const ACADEMY_CATEGORIES = [
  'All Categories',
  'Artificial intelligence fundamentals',
  'Practical AI for business',
  'Workflow automation',
  'AI-assisted productivity',
  'Business data and performance intelligence',
  'Responsible use of AI',
  'Relevant school or education-focused AI training',
];

export const AcademyView: React.FC<AcademyViewProps> = ({
  currentUser,
  courses,
  enrolments,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'learner_dashboard' | 'lms_recommendation'>('catalogue');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const visibleCourses =
    selectedCategory === 'All Categories'
      ? courses
      : courses.filter((c) => c.category === selectedCategory);

  const handleEnrolInCourse = async (course: AcademyCourse) => {
    setEnrollingId(course.id);
    try {
      const res = await fetch('/api/academy/enrol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-avichas-user-id': currentUser.id,
        },
        body: JSON.stringify({ courseId: course.id }),
      });
      if (res.ok) {
        await onRefreshData();
        setActiveTab('learner_dashboard');
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const handleToggleLessonCompletion = async (enrolmentId: string, lessonId: string) => {
    await fetch(`/api/academy/enrolments/${enrolmentId}/toggle-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-avichas-user-id': currentUser.id,
      },
      body: JSON.stringify({ lessonId }),
    });
    await onRefreshData();
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-12 space-y-10">
      {/* Academy Header */}
      <div className="bg-[#0B1F33] text-white rounded-md p-8 sm:p-10 border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="text-xs text-[#C9B58B] font-mono-tabular">
              PART I SECTION 9 · AVICHAS ACADEMY ONBOARDING, LEARNING PORTAL & CERTIFICATES
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold font-editorial tracking-tight">
              Avichas Academy: Executive & Technical AI Training
            </h1>
            <p className="text-sm text-stone-300 leading-relaxed">
              Structured training programmes for individuals, corporate teams, and educators across Nigeria and
              international markets. Discover a course → Register → Enrol → Learn → Track Progress → Complete.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-md shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('catalogue')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'catalogue'
                  ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              Public Course Catalogue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('learner_dashboard')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'learner_dashboard'
                  ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              Learner Dashboard ({enrolments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lms_recommendation')}
              className={`px-3.5 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'lms_recommendation'
                  ? 'bg-[#C9B58B] text-[#0B1F33] font-semibold'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              LMS Architecture Rationale
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PUBLIC ACADEMY CATALOGUE (Section 9A) */}
      {activeTab === 'catalogue' && (
        <div className="space-y-8">
          {/* Category Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {ACADEMY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#0B1F33] text-white border-[#0B1F33]'
                    : 'bg-white text-stone-700 border-stone-300 hover:border-[#0B1F33]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleCourses.map((course) => {
              const isEnrolled = enrolments.some((e) => e.courseId === course.id);
              return (
                <div
                  key={course.id}
                  className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Zero-Pill Metadata Discipline */}
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono-tabular">
                      <span>{course.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{course.duration}</span>
                    </div>

                    <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">{course.title}</h2>

                    <div className="text-xs text-stone-600">
                      <strong>Intended Audience:</strong> {course.intendedAudience}
                    </div>
                    <div className="text-xs text-stone-600">
                      <strong>Lead Instructor:</strong> {course.instructor} ({course.instructorRole})
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <div className="text-xs font-semibold text-[#0B1F33]">Learning Objectives:</div>
                      <ul className="space-y-1.5 text-xs text-stone-700">
                        {course.learningObjectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0B1F33] shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-stone-500">Enrolment Tuition</div>
                      <div className="text-xl font-semibold text-[#0B1F33] font-mono-tabular">
                        {course.isFree ? 'Complimentary (₦0)' : `₦${course.priceNgn.toLocaleString()}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCourse(selectedCourse?.id === course.id ? null : course)}
                        className="px-3.5 py-2 text-xs font-medium text-[#0B1F33] border border-stone-300 rounded-md hover:border-[#0B1F33]"
                      >
                        {selectedCourse?.id === course.id ? 'Hide Syllabus' : 'View Syllabus'}
                      </button>

                      <button
                        type="button"
                        disabled={enrollingId === course.id}
                        onClick={() =>
                          isEnrolled ? setActiveTab('learner_dashboard') : handleEnrolInCourse(course)
                        }
                        className="px-5 py-2 text-xs font-semibold text-[#0B1F33] bg-[#C9B58B] hover:bg-[#B5965A] rounded-md transition-colors whitespace-nowrap shrink-0"
                      >
                        {isEnrolled
                          ? 'Open in Learner Dashboard →'
                          : enrollingId === course.id
                            ? 'Enrolling...'
                            : 'Enrol Now'}
                      </button>
                    </div>
                  </div>

                  {selectedCourse?.id === course.id && (
                    <div className="mt-6 pt-6 border-t border-stone-200 space-y-4 bg-stone-50 p-4 rounded">
                      <div className="text-xs font-mono-tabular text-[#4778A8]">
                        COURSE MODULES, LESSONS & ENROLMENT REQUIREMENTS
                      </div>
                      {course.modules.map((mod) => (
                        <div key={mod.id} className="space-y-2">
                          <div className="text-xs font-semibold text-[#0B1F33]">{mod.title}</div>
                          <ul className="space-y-1.5 text-xs text-stone-600 pl-3">
                            {mod.lessons.map((les) => (
                              <li key={les.id} className="font-mono-tabular">
                                • {les.title} ({les.format} · {les.durationMinutes}m · {les.resourceName})
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LEARNER DASHBOARD & PROGRESS TRACKING (Section 9C) */}
      {activeTab === 'learner_dashboard' && (
        <div className="space-y-8">
          {enrolments.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-md p-10 text-center space-y-4">
              <div className="text-lg font-semibold text-[#0B1F33] font-editorial">
                No Active Course Enrolments Found for {currentUser.name}
              </div>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                Select any course in the Public Academy Catalogue to enrol, track lesson completion, and earn an
                official Avichas Completion Certificate.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('catalogue')}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0B1F33] rounded-md"
              >
                Browse Course Catalogue
              </button>
            </div>
          ) : (
            enrolments.map((enr) => {
              const course = courses.find((c) => c.id === enr.courseId);
              if (!course) return null;
              return (
                <div key={enr.id} className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-6">
                    <div className="space-y-1">
                      <div className="text-xs text-stone-500 font-mono-tabular">
                        ENROLLED: {enr.enrolledAt} · STATUS: {enr.paymentStatus.toUpperCase()} · LEARNER:{' '}
                        {enr.learnerName}
                      </div>
                      <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">{course.title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right font-mono-tabular">
                        <div className="text-xs text-stone-500">Course Completion</div>
                        <div className="text-2xl font-semibold text-[#0B1F33]">{enr.progressPercent}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Modules & Lessons Checklist */}
                  <div className="space-y-6">
                    {course.modules.map((mod) => (
                      <div key={mod.id} className="space-y-3">
                        <h3 className="text-sm font-semibold text-[#0B1F33]">{mod.title}</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {mod.lessons.map((les) => {
                            const completed = enr.completedLessonIds.includes(les.id);
                            return (
                              <div
                                key={les.id}
                                className="p-4 rounded border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={completed}
                                    onChange={() => handleToggleLessonCompletion(enr.id, les.id)}
                                    className="mt-1 w-4 h-4 accent-[#0B1F33]"
                                  />
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold text-[#0B1F33]">{les.title}</div>
                                    <div className="text-xs text-stone-600">{les.summary}</div>
                                    <div className="text-[11px] text-stone-500 font-mono-tabular">
                                      {les.format} · {les.durationMinutes} mins · Resource: {les.resourceName}
                                    </div>
                                  </div>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleToggleLessonCompletion(enr.id, les.id)}
                                  className={`px-3.5 py-1.5 text-xs font-medium rounded border whitespace-nowrap shrink-0 ${
                                    completed
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-white text-[#0B1F33] border-stone-300 hover:border-[#0B1F33]'
                                  }`}
                                >
                                  {completed ? 'Completed ✓' : 'Mark Lesson Complete'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verifiable Completion Certificate (Issued when 100% complete per Section 9C & 9D) */}
                  {enr.progressPercent === 100 && enr.certificateIssued && (
                    <div className="p-6 rounded-md bg-[#0B1F33] text-white border border-[#C9B58B] flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1.5">
                        <div className="text-xs text-[#C9B58B] font-mono-tabular">
                          AVICHAS ACADEMY COMPLETION CERTIFICATE · VERIFIED CREDENTIAL
                        </div>
                        <div className="text-xl font-semibold font-editorial">
                          Awarded to {enr.learnerName} ({enr.organisationName})
                        </div>
                        <div className="text-xs text-stone-300 font-mono-tabular">
                          Course: {course.title} · Certificate Serial: {enr.certificateSerial}
                        </div>
                      </div>
                      <div className="text-xs font-mono-tabular text-[#C9B58B] border border-[#C9B58B]/40 px-4 py-2 rounded">
                        CAC 9880947 Verified
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: LMS VS CUSTOM MODULE ARCHITECTURAL RECOMMENDATION (Required by Section 9D & Appendix Page 16) */}
      {activeTab === 'lms_recommendation' && (
        <div className="bg-white border border-stone-200 rounded-md p-6 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-stone-200 pb-4">
            <div className="text-xs font-mono-tabular text-[#4778A8]">
              SECTION 9D & PRE-LAUNCH REGISTER · TECHNICAL ARCHITECTURE RECOMMENDATION
            </div>
            <h2 className="text-2xl font-semibold text-[#0B1F33] font-editorial">
              Academy Delivery Decision: Integrated Custom Module vs. Standalone Third-Party LMS
            </h2>
            <p className="text-xs text-stone-600">
              Evaluation based on Total Cost of Ownership (TCO), security, maintainability, Naira payment unification,
              and expected enrolment volume.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 rounded bg-[#0B1F33] text-white space-y-3 border border-[#C9B58B]">
              <div className="text-[#C9B58B] font-mono-tabular">RECOMMENDED FOR PHASE 4 LAUNCH</div>
              <h3 className="text-base font-semibold font-editorial">
                Option 1: Integrated Avichas Academy Module (Implemented Here)
              </h3>
              <p className="text-stone-300 leading-relaxed">
                Uses the same single sign-on (SSO), Naira Paystack/Flutterwave webhook verification, and Central
                Administration Dashboard as Corporate & School customers.
              </p>
              <div className="pt-2 border-t border-white/10 font-mono-tabular text-stone-200">
                Recurring SaaS Cost: $0/month extra · Ideal for 100–5,000 learners
              </div>
            </div>

            <div className="p-5 rounded bg-stone-50 border border-stone-200 space-y-3">
              <div className="text-stone-500 font-mono-tabular">ALTERNATIVE A · CLOUD SAAS LMS</div>
              <h3 className="text-base font-semibold text-[#0B1F33] font-editorial">
                Option 2: Thinkific / Teachable Subdomain
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Fast video hosting, but charges USD monthly fees ($99–$199/mo), splits learner accounts from the Avichas
                Client Portal, and complicates direct Nigerian Naira Paystack checkout.
              </p>
              <div className="pt-2 border-t border-stone-200 font-mono-tabular text-stone-700">
                Recurring Cost: ~$1,200–$2,400 USD/yr + FX friction
              </div>
            </div>

            <div className="p-5 rounded bg-stone-50 border border-stone-200 space-y-3">
              <div className="text-stone-500 font-mono-tabular">ALTERNATIVE B · OPEN-SOURCE SELF-HOSTED</div>
              <h3 className="text-base font-semibold text-[#0B1F33] font-editorial">
                Option 3: Self-Hosted Moodle / Canvas
              </h3>
              <p className="text-stone-600 leading-relaxed">
                Full SCORM support for university-scale cohorts, but introduces high PHP/server patching overhead and a
                fragmented UI aesthetic that clashes with the corporate brand.
              </p>
              <div className="pt-2 border-t border-stone-200 font-mono-tabular text-stone-700">
                Maintenance Overhead: High (Dedicated DevOps required)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
