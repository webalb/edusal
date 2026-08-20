export type RegulatorType = 'NUC' | 'NBTE' | 'NCCE';
export type InstitutionType = 'UNIVERSITY' | 'POLYTECHNIC' | 'COLLEGE_OF_EDUCATION' | 'MONOTECHNIC';
export type TierTwoTerm = 'FACULTY' | 'SCHOOL' | 'COLLEGE';
export type AwardLevel = 'BSC' | 'BTECH' | 'BENG' | 'BA' | 'BED' | 'LLB' | 'MBBS' | 'ND' | 'HND' | 'NCE' | 'PGD' | 'MSC';
export type DocumentType = 'STUDENT_HANDBOOK' | 'SIWES_CALENDAR' | 'CURRICULUM_BMAS' | 'EMPLOYER_BRIEF' | 'POLICY';

export type SiwesPattern =
  | 'SPLIT_200L_300L'
  | 'SEM2_300L'
  | 'YEAR4_400L_EXTENDED'
  | 'ND_VACATION'
  | 'POST_ND_MANDATORY'
  | 'TEACHING_PRACTICE'
  | 'EXEMPT';

export type SiwesAcademicImpact =
  | 'VACATION_ONLY'
  | 'SECOND_SEMESTER_SUBSTITUTE'
  | 'FULL_SESSION_ATTACHMENT'
  | 'EXEMPT';

export interface AcademicProgram {
  id: string;
  institution: string;
  department: string;
  department_name?: string;
  name: string;
  program_code: string;
  award_level: AwardLevel;
  award_level_display?: string;
  duration_years: number;
  siwes_duration_months: number;
  siwes_pattern?: SiwesPattern;
  siwes_pattern_display?: string;
  siwes_academic_impact?: SiwesAcademicImpact;
  siwes_academic_impact_display?: string;
  siwes_target_levels?: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlueprintProgram {
  name: string;
  code: string;
  award_level: AwardLevel;
  duration_years: number;
  siwes_pattern: SiwesPattern;
  siwes_academic_impact: SiwesAcademicImpact;
  siwes_duration_months: number;
  siwes_target_levels: number[];
}

export interface BlueprintDepartment {
  name: string;
  code: string;
  siwes_eligible: boolean;
  programs: BlueprintProgram[];
}

export interface BlueprintFaculty {
  key: string;
  name: string;
  code: string;
  division_type: 'FACULTY' | 'SCHOOL' | 'COLLEGE';
  archetypes: string[];
  departments_count: number;
  programs_count: number;
  siwes_departments_count: number;
  departments: BlueprintDepartment[];
}

export interface HierarchyBlueprintsResponse {
  archetype: string;
  total_faculties: number;
  blueprints: BlueprintFaculty[];
}

export interface BulkImportHierarchyResult {
  success: boolean;
  message: string;
  stats: {
    created_divisions: number;
    created_departments: number;
    created_programs: number;
    total_rows_processed: number;
  };
  errors: string[];
}

export interface Department {
  id: string;
  institution: string;
  institution_name?: string;
  division: string;
  division_name?: string;
  name: string;
  code: string;
  hod_name: string;
  hod_email: string;
  siwes_eligible: boolean;
  is_active: boolean;
  programs_count?: number;
  programs?: AcademicProgram[];
  created_at: string;
  updated_at: string;
}

export interface AcademicDivision {
  id: string;
  institution: string;
  institution_name?: string;
  name: string;
  code: string;
  division_type: 'FACULTY' | 'SCHOOL' | 'COLLEGE';
  division_type_display?: string;
  dean_name: string;
  dean_email: string;
  is_active: boolean;
  departments_count?: number;
  departments?: Department[];
  created_at: string;
  updated_at: string;
}

export interface AcademicSession {
  id: string;
  institution: string;
  session_label: string;
  start_date?: string;
  end_date?: string;
  first_semester_start_date?: string;
  first_semester_end_date?: string;
  second_semester_start_date?: string;
  second_semester_end_date?: string;
  current_semester: 'FIRST_SEMESTER' | 'SECOND_SEMESTER';
  current_semester_display?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionalDocumentChunk {
  id: string;
  document: string;
  chunk_index: number;
  page_number: number;
  section_reference: string;
  content: string;
  created_at: string;
}

export interface InstitutionalDocument {
  id: string;
  institution: string;
  division?: string;
  division_name?: string;
  department?: string;
  department_name?: string;
  session?: string;
  session_label?: string;
  title: string;
  doc_type: DocumentType;
  doc_type_display?: string;
  file?: string;
  file_url?: string;
  file_path: string;
  content_hash: string;
  chunk_count: number;
  embedding_status: 'PENDING' | 'INDEXED' | 'FAILED';
  embedding_status_display?: string;
  raw_text?: string;
  chunks?: InstitutionalDocumentChunk[];
  created_at: string;
  updated_at: string;
}

export type LearningResourceType = 'VIDEO' | 'DOCUMENT' | 'WORKSHOP';

export interface LearningResource {
  id: string;
  institution: string;
  division?: string;
  division_name?: string;
  department?: string;
  department_name?: string;
  session?: string;
  session_label?: string;
  title: string;
  description?: string;
  resource_type: LearningResourceType;
  resource_type_display?: string;
  youtube_url?: string;
  youtube_video_id?: string;
  youtube_embed_url?: string;
  file?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIAdvisorCitation {
  source_index: number;
  citation_label: string;
  chunk_id: string;
  document_id: string;
  document_title: string;
  doc_type_display: string;
  page_number: number;
  section_reference: string;
  content_snippet: string;
  relevance_score: number;
}

export interface AIAdvisorResponse {
  answer: string;
  citations: AIAdvisorCitation[];
  telemetry: {
    model: string;
    latency_ms: number;
    total_tokens: number;
    chunks_retrieved: number;
  };
  scope: {
    institution: string;
    division?: string | null;
    department?: string | null;
  };
}

export interface InstitutionSummary {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  institution_type: InstitutionType;
  institution_type_display: string;
  ownership: string;
  regulator: RegulatorType;
  regulator_display: string;
  tier_two_term: TierTwoTerm;
  state: string;
  is_founding_partner: boolean;
  status: string;
  divisions_count: number;
  departments_count: number;
  programs_count: number;
  documents_count: number;
  created_at: string;
}

export interface TreeProgram {
  id: string;
  name: string;
  program_code: string;
  award_level: AwardLevel;
  award_level_display: string;
  duration_years: number;
  siwes_duration_months: number;
  siwes_pattern?: SiwesPattern;
  siwes_pattern_display?: string;
  siwes_academic_impact?: SiwesAcademicImpact;
  siwes_academic_impact_display?: string;
}

export interface TreeDepartment {
  id: string;
  name: string;
  code: string;
  hod_name: string;
  siwes_eligible: boolean;
  programs: TreeProgram[];
}

export interface TreeDivision {
  id: string;
  name: string;
  code: string;
  division_type: string;
  dean_name: string;
  departments: TreeDepartment[];
}

export interface InstitutionHierarchyTree {
  id: string;
  name: string;
  short_name: string;
  regulator: RegulatorType;
  institution_type: InstitutionType;
  tier_two_term: TierTwoTerm;
  divisions_count: number;
  divisions: TreeDivision[];
}

export interface GovernanceSummary {
  institution: {
    id: string;
    name: string;
    short_name: string;
    regulator: RegulatorType;
    tier_two_term: TierTwoTerm;
    is_founding_partner: boolean;
  };
  hierarchy_metrics: {
    total_divisions: number;
    total_departments: number;
    total_programs: number;
    siwes_eligible_departments: number;
    siwes_eligibility_percentage: number;
  };
  knowledge_base: {
    total_documents: number;
    total_indexed_chunks: number;
    grounding_status: string;
  };
  active_session: {
    label: string;
    semester: string;
  };
  accreditation_readiness: {
    regulator: string;
    taxonomy_aligned: boolean;
    curriculum_mapped: boolean;
    handbook_ingested: boolean;
  };
}

export interface DocumentSearchResultItem {
  chunk_id: string;
  document_id: string;
  document_title: string;
  doc_type: string;
  doc_type_display: string;
  page_number: number;
  section_reference: string;
  content: string;
  relevance_score: number;
  citation: string;
}

export interface DocumentSearchResponse {
  query: string;
  institution_id: string;
  institution_name: string;
  total_matches: number;
  results: DocumentSearchResultItem[];
}

export type InstitutionRole =
  | 'SUPERADMIN'
  | 'DIRECTOR_CAREER_SERVICES'
  | 'DEAN'
  | 'HOD'
  | 'COUNSELLOR';

export interface InstitutionStaff {
  id: string;
  user: number;
  user_email: string;
  user_name: string;
  institution: string;
  institution_name: string;
  institution_short_name: string;
  institution_status?: InstitutionStatus;
  division?: string;
  division_name?: string;
  department?: string;
  department_name?: string;
  role: InstitutionRole;
  role_display: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StaffRoleAtUnit =
  | 'DEAN'
  | 'SUB_DEAN'
  | 'HOD'
  | 'DEPARTMENTAL_COUNSELLOR'
  | 'FACULTY_COUNSELLOR'
  | 'SIWES_COORDINATOR'
  | 'ACADEMIC_ADVISER'
  | 'FACULTY_EVALUATOR'
  | 'DIRECTOR_CAREER_SERVICES'
  | 'SUPERADMIN';

export interface StaffAssignment {
  id: string;
  user: number;
  user_email: string;
  user_name: string;
  institution: string;
  institution_name: string;
  institution_short_name: string;
  institution_status?: InstitutionStatus;
  division?: string;
  division_name?: string;
  department?: string;
  department_name?: string;
  role_at_unit: StaffRoleAtUnit;
  role_at_unit_display: string;
  official_title: string;
  assigned_years_of_study: number[];
  can_evaluate_milestones: boolean;
  can_manage_waivers: boolean;
  max_caseload: number;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type EntryMode = 'UTME' | 'DIRECT_ENTRY' | 'TRANSFER' | 'CONVERSION';

export type AcademicStanding =
  | 'IN_GOOD_STANDING'
  | 'PROBATION'
  | 'SIWES_SUSPENDED'
  | 'GRADUATED'
  | 'ALUMNI'
  | 'DEFERRED';

export type SIWESClearanceStatus =
  | 'NOT_ELIGIBLE'
  | 'QUALIFYING'
  | 'CLEARED'
  | 'ON_ATTACHMENT'
  | 'COMPLETED';

export interface StudentProfile {
  id: string;
  user: number;
  user_email: string;
  user_name: string;
  institution: string;
  institution_name: string;
  institution_short_name: string;
  program: string;
  program_name: string;
  program_code: string;
  program_duration_years: number;
  award_level_display: string;
  department_id: string;
  department_name: string;
  division_id: string;
  division_name: string;
  matric_number: string;
  jamb_reg_number?: string;
  entry_session: string;
  entry_session_label: string;
  entry_mode: EntryMode;
  entry_mode_display: string;
  year_of_study: number;
  level_code: string;
  level_display: string;
  is_final_year: boolean;
  is_siwes_year: boolean;
  is_spillover: boolean;
  active_pathway?: string | null;
  active_pathway_title?: string | null;
  active_pathway_career_role?: string | null;
  employability_score: number;
  verified_points_total: number;
  milestones_completed_count: number;
  cgpa?: number | null;
  academic_standing: AcademicStanding;
  academic_standing_display: string;
  siwes_clearance_status: SIWESClearanceStatus;
  siwes_clearance_status_display: string;
  phone_number?: string;
  state_of_origin?: string;
  gender?: string;
  bio?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  is_verified_student: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  is_superuser: boolean;
  is_staff: boolean;
  staff_profile: InstitutionStaff | null;
  staff_assignments?: StaffAssignment[];
  student_profile?: StudentProfile | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  requires_otp?: boolean;
  email?: string;
  resend_after?: number;
  expires_in?: number;
}

export interface OtpResponse {
  token: string;
  user: AuthUser;
}

export interface OtpChallenge {
  requires_otp: boolean;
  email: string;
  resend_after: number;
  expires_in: number;
}

export type TemplateVisibility = 'DEPARTMENT' | 'INSTITUTION' | 'NATIONAL_CATALOG';

export type MilestoneType =
  | 'FOUNDATIONAL_COURSEWORK'
  | 'TECHNICAL_SKILL'
  | 'GITHUB_PROJECT'
  | 'INDUSTRY_CERTIFICATION'
  | 'SIWES_PREREQUISITE'
  | 'INTERNSHIP_EXPERIENCE'
  | 'CAPSTONE_PROJECT'
  | 'CAREER_READINESS';

export type VerificationMethod =
  | 'SUPERVISOR_SIGN_OFF'
  | 'URL_VERIFICATION'
  | 'DOCUMENT_UPLOAD'
  | 'AUTOMATED_ASSESSMENT';

export type RequiredEvidenceType =
  | 'GITHUB_REPO'
  | 'LIVE_URL'
  | 'CERTIFICATE_PDF'
  | 'PORTFOLIO_LINK'
  | 'SUPERVISOR_ENDORSEMENT';

export interface PathwayMilestone {
  id: string;
  pathway: string;
  order_index: number;
  year_of_study: number;
  target_level_code: string;
  target_semester: 'FIRST' | 'SECOND' | 'BOTH';
  title: string;
  description: string;
  milestone_type: MilestoneType;
  milestone_type_display?: string;
  points: number;
  is_mandatory: boolean;
  verification_method: VerificationMethod;
  verification_method_display?: string;
  required_evidence_type: RequiredEvidenceType;
  required_evidence_type_display?: string;
  competency_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Pathway {
  id: string;
  institution: string;
  program: string;
  program_name: string;
  program_code: string;
  award_level: string;
  award_level_display: string;
  duration_years: number;
  department_id: string;
  department_name: string;
  division_name: string;
  title: string;
  career_role: string;
  industry_sector?: string;
  description: string;
  target_cgpa_recommendation?: number | null;
  total_milestones_count: number;
  total_points: number;
  is_active: boolean;
  is_template: boolean;
  template_visibility: TemplateVisibility;
  cloned_from?: string | null;
  cloned_from_title?: string | null;
  version: number;
  created_by?: number | null;
  created_by_name?: string | null;
  milestones?: PathwayMilestone[];
  created_at: string;
  updated_at: string;
}

export interface PathwayCreatePayload {
  institution: string;
  program: string;
  title: string;
  career_role: string;
  industry_sector?: string;
  description: string;
  target_cgpa_recommendation?: number | null;
  is_active?: boolean;
  is_template?: boolean;
  template_visibility?: TemplateVisibility;
}

export interface PathwayClonePayload {
  target_program: string;
  custom_title?: string;
  custom_description?: string;
}

export type SubmissionStatus =
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'CHANGES_REQUESTED'
  | 'REJECTED';

export interface StudentMilestoneSubmission {
  id: string;
  student: string;
  student_matric: string;
  student_name: string;
  milestone: string;
  milestone_title: string;
  milestone_points: number;
  milestone_type: MilestoneType;
  milestone_type_display?: string;
  year_of_study: number;
  target_level_code: string;
  target_semester: string;
  required_evidence_type: RequiredEvidenceType;
  verification_method: VerificationMethod;
  status: SubmissionStatus;
  status_display: string;
  evidence_url?: string | null;
  evidence_file?: string | null;
  submission_notes?: string;
  points_awarded: number;
  reviewed_by?: number | null;
  reviewed_by_name?: string | null;
  reviewed_at?: string | null;
  review_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentSubmissionCreatePayload {
  milestone: string;
  evidence_url?: string;
  submission_notes?: string;
}

export interface StudentSubmissionReviewPayload {
  status: 'VERIFIED' | 'CHANGES_REQUESTED' | 'REJECTED';
  points_awarded?: number;
  review_feedback?: string;
}

export interface StudentCredentialResult {
  student_id: string;
  matric_number: string;
  email: string;
  plain_password: string;
  email_sent: boolean;
  recipient: string;
}

export interface EmployabilitySummary {
  employability_score: number;
  tier: string;
  milestone_component: number;
  cgpa_component: number;
  verified_points: number;
  target_points: number;
  milestones_completed: number;
}

export interface StudentDashboardData {
  profile: StudentProfile;
  active_pathway: Pathway | null;
  submissions: StudentMilestoneSubmission[];
  employability_summary: EmployabilitySummary;
}

// =============================================================================
// Diagnostic Assessments & Psychometrics
// =============================================================================

export type AssessmentType =
  | 'BIG_FIVE'
  | 'HOLLAND_RIASEC'
  | 'NUMERICAL_REASONING'
  | 'DIGITAL_SKILLS';

export interface DiagnosticQuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

export interface DiagnosticQuestion {
  id: string;
  order_index: number;
  prompt: string;
  dimension: string;
  is_reverse_scored: boolean;
  question_type: 'LIKERT_5' | 'MULTIPLE_CHOICE';
  options: DiagnosticQuestionOption[];
  explanation?: string;
}

export interface DiagnosticAssessment {
  id: string;
  institution: string | null;
  assessment_type: AssessmentType;
  assessment_type_display: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  estimated_minutes: number;
  total_questions: number;
  questions_count?: number;
  questions?: DiagnosticQuestion[];
  is_active: boolean;
  created_at: string;
}

export interface StudentAssessmentSession {
  id: string;
  student: string;
  student_matric: string;
  student_name: string;
  assessment: string;
  assessment_title: string;
  assessment_type: AssessmentType;
  assessment_type_display: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  raw_responses: Record<string, number | string>;
  dimension_scores: Record<string, number>;
  summary_code: string;
  percentile_rank: number | null;
  summary_report: string;
  career_recommendations: string[];
  started_at: string;
  completed_at: string | null;
}

// =============================================================================
// 24/7 AI Career Coach
// =============================================================================

export interface GroundedCitation {
  source_index: number;
  citation_label: string;
  chunk_id: string;
  document_title: string;
  section_reference?: string;
  page_number?: number;
  similarity_score?: number;
}

export interface AICoachTelemetry {
  model: string;
  latency_ms: number;
  total_tokens: number;
  chunks_retrieved: number;
}

export interface AICoachMessage {
  id: string;
  conversation: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: GroundedCitation[];
  telemetry?: AICoachTelemetry;
  created_at: string;
}

export interface AICoachConversation {
  id: string;
  student: string;
  title: string;
  is_active: boolean;
  case_summary: string;
  messages_count: number;
  last_message?: AICoachMessage | null;
  messages?: AICoachMessage[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Seamless Counsellor Handoff & Booking
// =============================================================================

export type CounsellingTopic =
  | 'PATHWAY_ALIGNMENT'
  | 'SIWES_CLEARANCE'
  | 'ASSESSMENT_DEBRIEF'
  | 'RESUME_CV_REVIEW'
  | 'EMPLOYER_PLACEMENT'
  | 'ACADEMIC_STANDING';

export type CounsellingSessionStatus =
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export interface ActionItem {
  task: string;
  due_date?: string;
  done: boolean;
}

export interface CounsellingCaseNote {
  id: string;
  session?: string | null;
  student: string;
  student_matric: string;
  author: string;
  author_name: string;
  author_title: string;
  summary: string;
  action_items: ActionItem[];
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
}

export interface CounsellingSession {
  id: string;
  student: string;
  student_matric: string;
  student_name: string;
  student_program: string;
  student_level: string;
  counsellor?: string | null;
  counsellor_name?: string | null;
  counsellor_title?: string | null;
  topic: CounsellingTopic;
  topic_display: string;
  student_notes: string;
  status: CounsellingSessionStatus;
  status_display: string;
  preferred_date: string;
  preferred_time_slot: string;
  scheduled_datetime?: string | null;
  meeting_mode: 'IN_PERSON' | 'VIRTUAL_CALL';
  meeting_mode_display: string;
  meeting_location: string;
  case_notes?: CounsellingCaseNote[];
  created_at: string;
  updated_at: string;
}

export interface AvailableCounsellor {
  id: string;
  name: string;
  email: string;
  title: string;
  phone?: string;
  office_location?: string;
  institution: string;
}

export interface StudentDossier {
  profile: StudentProfile;
  active_pathway: Pathway | null;
  submissions: StudentMilestoneSubmission[];
  assessments: StudentAssessmentSession[];
  counselling_sessions: CounsellingSession[];
  case_notes: CounsellingCaseNote[];
  ai_coach_summary: string;
  employability_summary: EmployabilitySummary;
}

export type InstitutionStatus =
  | 'ACTIVE'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'PROVISIONING'
  | 'SUSPENDED'
  | 'REJECTED';

export type InvoiceStatus =
  | 'UNPAID'
  | 'PAYMENT_SUBMITTED'
  | 'PAID'
  | 'VOID'
  | 'REJECTED';

export interface CompanyBankDetail {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  sort_code_or_swift?: string;
  currency: string;
  payment_instructions: string;
  support_email: string;
  support_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  id: string;
  code: string;
  name: string;
  target_institution_type?: string;
  description?: string;
  base_fee: string | number;
  setup_onboarding_fee: string | number;
  per_student_fee?: string | number;
  max_students: number;
  features: string[];
  currency: string;
  billing_cycle: string;
  is_active: boolean;
}

export interface InvoiceLineItem {
  description: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
}

export interface InstitutionInvoice {
  id: string;
  invoice_number: string;
  institution: string;
  institution_name: string;
  institution_short_name: string;
  institution_status: InstitutionStatus;
  plan?: string | null;
  plan_name: string;
  issued_to_name: string;
  issued_to_email: string;
  subtotal_amount: string;
  setup_fee: string;
  vat_rate?: string | number;
  vat_amount?: string | number;
  discount_amount: string;
  total_amount: string;
  currency: string;
  status: InvoiceStatus;
  status_display: string;
  bank_details_snapshot: {
    account_name: string;
    bank_name: string;
    account_number: string;
    sort_code_or_swift?: string;
    currency: string;
    payment_instructions?: string;
    support_email?: string;
    support_phone?: string;
  };
  items_breakdown: InvoiceLineItem[];
  due_date: string;
  payment_reference?: string;
  payment_receipt_url?: string | null;
  payer_bank_name?: string;
  payer_account_name?: string;
  payment_date?: string | null;
  payment_notes?: string;
  payment_submitted_at?: string | null;
  confirmed_at?: string | null;
  confirmed_by_name?: string | null;
  confirmed_by_email?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstitutionRegistrationPayload {
  legal_name: string;
  short_name: string;
  institution_type: string;
  ownership: string;
  regulator: string;
  state: string;
  city?: string;
  address?: string;
  website?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  designation?: string;
  password: string;
  tier: string;
  faculties?: string[];
  counsellor_seats?: number;
  modules?: string[];
  add_ons?: string[];
  dpo_name?: string;
  dpo_email?: string;
}

export type User = AuthUser;

export interface InstitutionRegistrationResponse {
  token: string;
  user: AuthUser;
  institution: InstitutionSummary;
  invoice: InstitutionInvoice;
  message: string;
}

export interface AdminInstitutionRow {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  institution_type: string;
  institution_type_display: string;
  ownership: string;
  ownership_display: string;
  regulator: string;
  regulator_display: string;
  state: string;
  status: string;
  status_display: string;
  is_founding_partner: boolean;
  created_at: string;
  students_count: number;
  staff_count: number;
  divisions_count: number;
  departments_count: number;
  programs_count: number;
  latest_invoice: {
    invoice_number: string;
    total_amount: number;
    currency: string;
    status: string;
    status_display: string;
  } | null;
}

export interface AdminInvoiceRow {
  id: string;
  invoice_number: string;
  institution: string;
  institution_name: string;
  institution_short_name: string;
  institution_status: string;
  plan_name: string;
  total_amount: number;
  currency: string;
  status: string;
  status_display: string;
  due_date?: string | null;
  payment_reference?: string | null;
  payment_submitted_at?: string | null;
  confirmed_at?: string | null;
  created_at: string;
}

export interface PlatformAdminOverview {
  totals: {
    institutions: number;
    users: number;
    staff: number;
    students: number;
    divisions: number;
    departments: number;
    programs: number;
    pathways: number;
    invoices: number;
  };
  institutions_by_status: Record<string, number>;
  invoices_by_status: Record<string, number>;
  plans: Record<string, number>;
  revenue: {
    total_billed: number;
    total_paid: number;
    outstanding: number;
    currency: string;
  };
  institutions: AdminInstitutionRow[];
  recent_invoices: AdminInvoiceRow[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string | null;
  staff_profile: {
    institution: string | null;
    institution_name?: string | null;
    role: string | null;
    role_display: string | null;
    title: string;
  } | null;
  student_profile: {
    institution: string | null;
    institution_name?: string | null;
    program?: string | null;
    matric_number?: string | null;
    year_of_study?: number | null;
  } | null;
}

export interface AdminInstitutionDetail {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  institution_type: string;
  institution_type_display: string;
  ownership: string;
  ownership_display: string;
  regulator: string;
  regulator_display: string;
  tier_two_term: string;
  state: string;
  address: string;
  domain_whitelist: string[];
  is_founding_partner: boolean;
  status: InstitutionStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
  totals: {
    students: number;
    staff: number;
    divisions: number;
    departments: number;
    programs: number;
    pathways: number;
    invoices: number;
  };
  students: StudentProfile[];
  staff: InstitutionStaff[];
  divisions: AcademicDivision[];
  programs: AcademicProgram[];
  pathways: Pathway[];
  invoices: InstitutionInvoice[];
}






