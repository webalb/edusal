import type {
  InstitutionSummary,
  InstitutionHierarchyTree,
  GovernanceSummary,
  AcademicDivision,
  Department,
  AcademicProgram,
  AcademicSession,
  InstitutionalDocument,
  DocumentSearchResponse,
} from '../types/institution';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

async function adminFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Token ${token}`,
  };
  const res = await fetch(`${API_BASE}${url}`, { ...init, headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Request failed`);
  }
  return res.json();
}

export const institutionApi = {
  // Institutions List & Summary
  async getInstitutions(params?: Record<string, string>): Promise<InstitutionSummary[]> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/api/institutions/${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch institutions`);
    return res.json();
  },

  // 4-Tier Hierarchy Tree
  async getInstitutionTree(id: string): Promise<InstitutionHierarchyTree> {
    const res = await fetch(`${API_BASE}/api/institutions/${id}/tree/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch institution tree`);
    return res.json();
  },

  // Governance Metrics & Executive Summary
  async getGovernanceSummary(id: string): Promise<GovernanceSummary> {
    const res = await fetch(`${API_BASE}/api/institutions/${id}/governance-summary/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch governance summary`);
    return res.json();
  },

  // Document Citation Search
  async searchDocuments(
    institutionId: string,
    query: string,
    topK: number = 5,
    docType?: string
  ): Promise<DocumentSearchResponse> {
    const payload: { query: string; top_k: number; doc_type?: string } = {
      query,
      top_k: topK,
    };
    if (docType) payload.doc_type = docType;

    const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/search-documents/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Document search failed`);
    return res.json();
  },

  // Divisions CRUD
  async getDivisions(institutionId: string): Promise<AcademicDivision[]> {
    const res = await fetch(`${API_BASE}/api/divisions/?institution=${institutionId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch divisions`);
    return res.json();
  },

  async createDivision(data: {
    institution: string;
    name: string;
    code: string;
    division_type: 'FACULTY' | 'SCHOOL' | 'COLLEGE';
    dean_name?: string;
    dean_email?: string;
  }): Promise<AcademicDivision> {
    const res = await fetch(`${API_BASE}/api/divisions/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create division`);
    return res.json();
  },

  async deleteDivision(divisionId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/divisions/${divisionId}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`HTTP ${res.status}: Failed to delete division`);
    }
  },

  // Departments CRUD
  async getDepartments(institutionId: string, divisionId?: string): Promise<Department[]> {
    let url = `${API_BASE}/api/departments/?institution=${institutionId}`;
    if (divisionId) url += `&division=${divisionId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch departments`);
    return res.json();
  },

  async createDepartment(data: {
    institution: string;
    division: string;
    name: string;
    code: string;
    hod_name?: string;
    hod_email?: string;
    siwes_eligible: boolean;
  }): Promise<Department> {
    const res = await fetch(`${API_BASE}/api/departments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create department`);
    return res.json();
  },

  async deleteDepartment(departmentId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/departments/${departmentId}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`HTTP ${res.status}: Failed to delete department`);
    }
  },

  // Programs CRUD
  async getPrograms(institutionId: string, departmentId?: string): Promise<AcademicProgram[]> {
    let url = `${API_BASE}/api/programs/?institution=${institutionId}`;
    if (departmentId) url += `&department=${departmentId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch programs`);
    return res.json();
  },

  async createProgram(data: {
    institution: string;
    department: string;
    name: string;
    program_code: string;
    award_level: string;
    duration_years: number;
    siwes_duration_months: number;
    siwes_pattern?: string;
    siwes_academic_impact?: string;
    siwes_target_levels?: number[];
  }): Promise<AcademicProgram> {
    const res = await fetch(`${API_BASE}/api/programs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create program`);
    return res.json();
  },

  async deleteProgram(programId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/programs/${programId}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`HTTP ${res.status}: Failed to delete program`);
    }
  },

  // Master Blueprints & Bulk Importer
  async getHierarchyBlueprints(archetype?: string): Promise<{ archetype: string; total_faculties: number; blueprints: any[] }> {
    let url = `${API_BASE}/api/institutions/hierarchy-blueprints/`;
    if (archetype) url += `?archetype=${archetype}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch master hierarchy blueprints`);
    return res.json();
  },

  getDownloadHierarchyTemplateUrl(prepopulate: boolean = true, archetype?: string, format: 'excel' | 'csv' = 'excel'): string {
    let url = `${API_BASE}/api/institutions/download-hierarchy-template/?prepopulate=${prepopulate}&export_format=${format}`;
    if (archetype) url += `&archetype=${archetype}`;
    return url;
  },

  async importHierarchyBlueprint(
    institutionId: string,
    divisionKeys: string[],
    token?: string
  ): Promise<{ success: boolean; message: string; stats: Record<string, number> }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/import-blueprint/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ division_keys: divisionKeys }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `HTTP ${res.status}: Failed to import master blueprint`);
    }
    return res.json();
  },

  async bulkImportHierarchy(
    institutionId: string,
    payload: { file?: File; rows?: Record<string, unknown>[] },
    token?: string
  ): Promise<{
    success: boolean;
    message: string;
    stats: { created_divisions: number; created_departments: number; created_programs: number; total_rows_processed: number };
    errors: string[];
  }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;

    let body: BodyInit;
    if (payload.file) {
      const formData = new FormData();
      formData.append('file', payload.file);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({ rows: payload.rows });
    }

    const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/bulk-import-hierarchy/`, {
      method: 'POST',
      headers,
      body,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `HTTP ${res.status}: Failed to bulk import hierarchy`);
    }
    return res.json();
  },

  // Sessions CRUD
  async getSessions(institutionId: string, token?: string): Promise<AcademicSession[]> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/sessions/?institution=${institutionId}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch sessions`);
    return res.json();
  },

  async createSession(
    data: {
      institution: string;
      session_label: string;
      current_semester: string;
      start_date?: string | null;
      end_date?: string | null;
      first_semester_start_date?: string | null;
      first_semester_end_date?: string | null;
      second_semester_start_date?: string | null;
      second_semester_end_date?: string | null;
      is_current?: boolean;
    },
    token?: string
  ): Promise<AcademicSession> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/sessions/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const msg = errData.session_label || errData.non_field_errors || errData.detail || `HTTP ${res.status}: Failed to create academic session`;
      throw new Error(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
    return res.json();
  },

  async updateSession(
    sessionId: string,
    data: Partial<AcademicSession>,
    token?: string
  ): Promise<AcademicSession> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update academic session`);
    return res.json();
  },

  async setCurrentSession(
    sessionId: string,
    currentSemester?: 'FIRST_SEMESTER' | 'SECOND_SEMESTER',
    token?: string
  ): Promise<{ status: string; message: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/set-current/`, {
      method: 'POST',
      headers,
      body: currentSemester ? JSON.stringify({ current_semester: currentSemester }) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to set session as current`);
    return res.json();
  },

  async deleteSession(sessionId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete academic session`);
  },

  // Documents CRUD & Text Ingestion
  async getDocuments(institutionId: string): Promise<InstitutionalDocument[]> {
    const res = await fetch(`${API_BASE}/api/documents/?institution=${institutionId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch documents`);
    return res.json();
  },

  async createDocument(data: {
    institution: string;
    title: string;
    doc_type: string;
    raw_text: string;
  }): Promise<InstitutionalDocument> {
    const res = await fetch(`${API_BASE}/api/documents/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create document`);
    return res.json();
  },

  async ingestDocumentText(documentId: string, rawText: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/documents/${documentId}/ingest-text/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Ingestion failed`);
  },

  async uploadDocumentFile(
    formData: FormData,
    token?: string
  ): Promise<InstitutionalDocument> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/documents/upload/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to upload document`);
    }
    const data = await res.json();
    return data.document || data;
  },

  async listLearningResources(
    institutionId: string,
    resourceType?: string,
    token?: string
  ): Promise<import('../types/institution').LearningResource[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const params = new URLSearchParams({ institution: institutionId });
    if (resourceType) params.set('resource_type', resourceType);

    const res = await fetch(`${API_BASE}/api/learning-resources/?${params.toString()}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to load learning resources`);
    }
    return res.json();
  },

  async createLearningResource(
    payload: {
      institution: string;
      title: string;
      description?: string;
      resource_type: string;
      youtube_url?: string;
      division?: string;
      department?: string;
      session?: string;
      is_published?: boolean;
    },
    token?: string
  ): Promise<import('../types/institution').LearningResource> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/learning-resources/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to create resource`);
    }
    return res.json();
  },

  async uploadLearningResourceFile(
    formData: FormData,
    token?: string
  ): Promise<import('../types/institution').LearningResource> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/learning-resources/upload/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to upload resource`);
    }
    const data = await res.json();
    return data.resource || data;
  },

  async deleteLearningResource(id: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/learning-resources/${id}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to delete resource`);
    }
  },

  async askAdvisor(
    institutionId: string,
    payload: {
      query: string;
      division?: string;
      department?: string;
      session?: string;
      doc_type?: string;
      top_k?: number;
    },
    token?: string
  ): Promise<import('../types/institution').AIAdvisorResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/ask-advisor/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Advisor query failed`);
    }
    return res.json();
  },


  // Authentication Endpoints
  async login(email: string, password: string):Promise<import('../types/institution').LoginResponse> {
    const res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Login failed (HTTP ${res.status})`);
    }
    return res.json();
  },

  async verifyOtp(email: string, code: string): Promise<import('../types/institution').OtpResponse> {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Verification failed (HTTP ${res.status})`);
    }
    return res.json();
  },

  async resendOtp(email: string): Promise<import('../types/institution').OtpChallenge> {
    const res = await fetch(`${API_BASE}/api/auth/resend-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Resend failed (HTTP ${res.status})`);
    }
    return res.json();
  },

  async forgotPassword(email: string): Promise<import('../types/institution').OtpChallenge> {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to send reset code (HTTP ${res.status})`);
    }
    return res.json();
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/api/auth/reset-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Password reset failed (HTTP ${res.status})`);
    }
    return res.json();
  },

  async getMe(token: string): Promise<import('../types/institution').AuthUser> {
    const res = await fetch(`${API_BASE}/api/auth/me/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to authenticate`);
    return res.json();
  },

  async logout(token: string): Promise<void> {
    await fetch(`${API_BASE}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    }).catch(() => {});
  },

  // Platform Admin Overview (super admins only)
  async getAdminOverview(
    token: string
  ): Promise<import('../types/institution').PlatformAdminOverview> {
    const res = await fetch(`${API_BASE}/api/admin/overview/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${res.status}: Failed to fetch platform overview`);
    }
    return res.json();
  },

  // ---- Platform Admin Console: Bank Details ----
  getAdminBankDetails(token: string) {
    return adminFetch<import('../types/institution').CompanyBankDetail[]>(
      '/api/admin/bank-details/', token
    );
  },
  createAdminBankDetail(token: string, data: Record<string, unknown>) {
    return adminFetch<import('../types/institution').CompanyBankDetail>(
      '/api/admin/bank-details/', token, { method: 'POST', body: JSON.stringify(data) }
    );
  },
  updateAdminBankDetail(token: string, id: string, data: Record<string, unknown>) {
    return adminFetch<import('../types/institution').CompanyBankDetail>(
      `/api/admin/bank-details/${id}/`, token, { method: 'PUT', body: JSON.stringify(data) }
    );
  },
  deleteAdminBankDetail(token: string, id: string) {
    return adminFetch<{ message?: string }>(
      `/api/admin/bank-details/${id}/`, token, { method: 'DELETE' }
    );
  },

  // ---- Platform Admin Console: Pricing Plans ----
  getAdminPricingPlans(token: string) {
    return adminFetch<import('../types/institution').PricingPlan[]>(
      '/api/admin/pricing-plans/', token
    );
  },
  createAdminPricingPlan(token: string, data: Record<string, unknown>) {
    return adminFetch<import('../types/institution').PricingPlan>(
      '/api/admin/pricing-plans/', token, { method: 'POST', body: JSON.stringify(data) }
    );
  },
  updateAdminPricingPlan(token: string, id: string, data: Record<string, unknown>) {
    return adminFetch<import('../types/institution').PricingPlan>(
      `/api/admin/pricing-plans/${id}/`, token, { method: 'PUT', body: JSON.stringify(data) }
    );
  },
  deleteAdminPricingPlan(token: string, id: string) {
    return adminFetch<{ message?: string }>(
      `/api/admin/pricing-plans/${id}/`, token, { method: 'DELETE' }
    );
  },

  // ---- Platform Admin Console: Invoices ----
  getAdminInvoices(token: string) {
    return adminFetch<import('../types/institution').InstitutionInvoice[]>(
      '/api/admin/invoices/', token
    );
  },
  confirmAdminInvoice(token: string, id: string, admin_notes?: string) {
    return adminFetch<import('../types/institution').InstitutionInvoice>(
      `/api/admin/invoices/${id}/confirm/`, token, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: admin_notes || '' }),
      }
    );
  },
  rejectAdminInvoice(token: string, id: string, admin_notes?: string) {
    return adminFetch<import('../types/institution').InstitutionInvoice>(
      `/api/admin/invoices/${id}/reject/`, token, {
        method: 'POST',
        body: JSON.stringify({ admin_notes: admin_notes || '' }),
      }
    );
  },
  async downloadAdminInvoicePdf(token: string, id: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/api/admin/invoices/${id}/pdf/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to generate invoice PDF`);
    return res.blob();
  },

  // ---- Platform Admin Console: Users ----
  getAdminUsers(token: string, search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return adminFetch<import('../types/institution').AdminUser[]>(
      `/api/admin/users/${q}`, token
    );
  },

  // ---- Platform Admin Console: Institution Drill-Down ----
  getAdminInstitutionDetail(token: string, id: string) {
    return adminFetch<import('../types/institution').AdminInstitutionDetail>(
      `/api/admin/institutions/${id}/`, token
    );
  },
  setAdminInstitutionStatus(token: string, id: string, action: 'deactivate' | 'reactivate') {
    return adminFetch<{ detail: string; status: import('../types/institution').InstitutionStatus; status_display: string }>(
      `/api/admin/institutions/${id}/${action}/`, token, { method: 'POST' }
    );
  },

  // Staff & Faculty Directory
  async getStaff(institutionId: string): Promise<import('../types/institution').InstitutionStaff[]> {
    const res = await fetch(`${API_BASE}/api/staff/?institution=${institutionId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch staff directory`);
    return res.json();
  },

  async createStaff(data: {
    institution: string;
    email: string;
    name: string;
    role: string;
    title?: string;
    division?: string;
    department?: string;
  }): Promise<import('../types/institution').InstitutionStaff> {
    const res = await fetch(`${API_BASE}/api/staff/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}: Failed to assign staff`);
    }
    return res.json();
  },

  // Scoped Staff Assignments
  async getStaffAssignments(params?: {
    institution?: string;
    division?: string;
    department?: string;
  }): Promise<import('../types/institution').StaffAssignment[]> {
    const query = new URLSearchParams();
    if (params?.institution) query.append('institution', params.institution);
    if (params?.division) query.append('division', params.division);
    if (params?.department) query.append('department', params.department);
    const res = await fetch(`${API_BASE}/api/staff-assignments/?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch staff assignments`);
    return res.json();
  },

  async createStaffAssignment(data: {
    user: number;
    institution: string;
    division?: string;
    department?: string;
    role_at_unit: string;
    official_title?: string;
    assigned_years_of_study?: number[];
  }): Promise<import('../types/institution').StaffAssignment> {
    const res = await fetch(`${API_BASE}/api/staff-assignments/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create staff assignment`);
    return res.json();
  },

  async getMyCaseload(token: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/staff-assignments/my-caseload/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch caseload`);
    return res.json();
  },

  // Student Directory & Cohorts
  async getStudents(params?: {
    institution?: string;
    department?: string;
    program?: string;
    year_of_study?: number;
    search?: string;
  }, token?: string): Promise<import('../types/institution').StudentProfile[]> {
    const query = new URLSearchParams();
    if (params?.institution) query.append('institution', params.institution);
    if (params?.department) query.append('department', params.department);
    if (params?.program) query.append('program', params.program);
    if (params?.year_of_study) query.append('year_of_study', String(params.year_of_study));
    if (params?.search) query.append('search', params.search);

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Token ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/students/?${query.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch students`);
    return res.json();
  },

  async createStudent(data: {
    email: string;
    name: string;
    institution: string;
    program: string;
    matric_number: string;
    jamb_reg_number?: string;
    entry_session: string;
    entry_mode?: string;
    year_of_study?: number;
    cgpa?: number | null;
    phone_number?: string;
  }, token?: string): Promise<import('../types/institution').StudentProfile> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers.Authorization = `Token ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/students/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Failed to register student`);
    }
    return res.json();
  },

  getDownloadStudentTemplateUrl(institutionId: string, programId: string, format: 'excel' | 'csv' = 'excel'): string {
    return `${API_BASE}/api/institutions/${institutionId}/download-student-template/?program_id=${programId}&export_format=${format}`;
  },

  async bulkImportStudents(
    institutionId: string,
    data: {
      file?: File;
      rows?: any[];
      program_id?: string;
      dry_run?: boolean;
      default_password_scheme?: string;
    },
    token?: string
  ): Promise<{
    success: boolean;
    dry_run: boolean;
    can_commit?: boolean;
    message?: string;
    program?: { id: string; name: string; code?: string; duration_years?: number; department_name?: string; division_name?: string };
    stats?: { total_rows: number; valid_count: number; error_count: number; created_users?: number; created_profiles?: number; updated_profiles?: number };
    valid_rows?: any[];
    errors?: Array<{ row_number: number; matric_number: string; name: string; email: string; reasons: string[] }>;
  }> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Token ${token}`;

    let body: BodyInit;
    if (data.file) {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.program_id) formData.append('program_id', data.program_id);
      if (data.dry_run !== undefined) formData.append('dry_run', String(data.dry_run));
      if (data.default_password_scheme) formData.append('default_password_scheme', data.default_password_scheme);
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const res = await fetch(`${API_BASE}/api/institutions/${institutionId}/bulk-import-students/`, {
      method: 'POST',
      headers,
      body,
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok && !result.errors) {
      throw new Error(result.detail || result.error || `HTTP ${res.status}: Failed to process student bulk import`);
    }
    return result;
  },

  // Pathways & Blueprint Templates
  async getPathways(
    params: {
      institution?: string;
      program?: string;
      department?: string;
      division?: string;
      is_template?: boolean;
      search?: string;
    },
    token?: string
  ): Promise<import('../types/institution').Pathway[]> {
    const query = new URLSearchParams();
    if (params.institution) query.append('institution', params.institution);
    if (params.program) query.append('program', params.program);
    if (params.department) query.append('department', params.department);
    if (params.division) query.append('division', params.division);
    if (params.is_template !== undefined) query.append('is_template', String(params.is_template));
    if (params.search) query.append('search', params.search);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/pathways/?${query.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch pathways`);
    return res.json();
  },

  async getPathwayDetail(
    pathwayId: string,
    token?: string
  ): Promise<import('../types/institution').Pathway> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/pathways/${pathwayId}/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch pathway detail`);
    return res.json();
  },

  async createPathway(
    payload: import('../types/institution').PathwayCreatePayload,
    token?: string
  ): Promise<import('../types/institution').Pathway> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/pathways/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Failed to create pathway`);
    }
    return res.json();
  },

  async clonePathway(
    pathwayId: string,
    payload: import('../types/institution').PathwayClonePayload,
    token?: string
  ): Promise<import('../types/institution').Pathway> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/pathways/${pathwayId}/clone/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Failed to clone template`);
    }
    return res.json();
  },

  async publishPathwayTemplate(
    pathwayId: string,
    visibility = 'INSTITUTION',
    token?: string
  ): Promise<import('../types/institution').Pathway> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/pathways/${pathwayId}/publish-as-template/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ visibility }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to publish template`);
    return res.json();
  },

  async getTemplateBlueprints(
    awardLevel?: string,
    token?: string
  ): Promise<import('../types/institution').Pathway[]> {
    const query = new URLSearchParams();
    if (awardLevel) query.append('award_level', awardLevel);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/pathways/templates/?${query.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch template blueprints`);
    return res.json();
  },

  // Milestones CRUD
  async createMilestone(
    payload: Partial<import('../types/institution').PathwayMilestone>,
    token?: string
  ): Promise<import('../types/institution').PathwayMilestone> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/milestones/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Failed to create milestone`);
    }
    return res.json();
  },

  async updateMilestone(
    milestoneId: string,
    payload: Partial<import('../types/institution').PathwayMilestone>,
    token?: string
  ): Promise<import('../types/institution').PathwayMilestone> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/milestones/${milestoneId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to update milestone`);
    return res.json();
  },

  async deleteMilestone(
    milestoneId: string,
    token?: string
  ): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/milestones/${milestoneId}/`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete milestone`);
  },

  // Student Credential Dispatch & Portal
  async generateStudentCredentials(
    studentId: string,
    payload?: { custom_password?: string; login_url?: string },
    token?: string
  ): Promise<import('../types/institution').StudentCredentialResult> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/students/${studentId}/generate-credentials/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Failed to generate credentials`);
    }
    return res.json();
  },

  async enrollStudentPathway(
    studentId: string,
    pathwayId: string,
    token?: string
  ): Promise<import('../types/institution').StudentProfile> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/students/${studentId}/enroll-pathway/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ pathway: pathwayId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to enroll pathway`);
    return res.json();
  },

  async getStudentDashboard(
    token?: string
  ): Promise<import('../types/institution').StudentDashboardData> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/students/me/dashboard/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch student dashboard`);
    return res.json();
  },

  async getStudentSubmissions(
    params?: { student?: string; milestone?: string; pathway?: string; status?: string },
    token?: string
  ): Promise<import('../types/institution').StudentMilestoneSubmission[]> {
    const query = new URLSearchParams();
    if (params?.student) query.append('student', params.student);
    if (params?.milestone) query.append('milestone', params.milestone);
    if (params?.pathway) query.append('pathway', params.pathway);
    if (params?.status) query.append('status', params.status);

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/student-submissions/?${query.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch student submissions`);
    return res.json();
  },

  async submitMilestoneEvidence(
    payload: import('../types/institution').StudentSubmissionCreatePayload,
    token?: string
  ): Promise<import('../types/institution').StudentMilestoneSubmission> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/student-submissions/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || `HTTP ${res.status}: Failed to submit evidence`);
    }
    return res.json();
  },

  async reviewStudentSubmission(
    submissionId: string,
    payload: import('../types/institution').StudentSubmissionReviewPayload,
    token?: string
  ): Promise<import('../types/institution').StudentMilestoneSubmission> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;

    const res = await fetch(`${API_BASE}/api/student-submissions/${submissionId}/review/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to review submission`);
    return res.json();
  },

  // =========================================================================
  // Diagnostic Assessments & Psychometrics API
  // =========================================================================

  async listDiagnosticAssessments(token?: string): Promise<import('../types/institution').DiagnosticAssessment[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/diagnostic-assessments/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch diagnostic assessments`);
    return res.json();
  },

  async getDiagnosticAssessment(slug: string, token?: string): Promise<import('../types/institution').DiagnosticAssessment> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/diagnostic-assessments/${slug}/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch assessment details`);
    return res.json();
  },

  async getAssessmentQuestions(slug: string, token?: string): Promise<import('../types/institution').DiagnosticQuestion[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/diagnostic-assessments/${slug}/questions/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch assessment questions`);
    return res.json();
  },

  async submitAssessment(
    assessmentId: string,
    rawResponses: Record<string, number | string>,
    studentId?: string,
    token?: string
  ): Promise<import('../types/institution').StudentAssessmentSession> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/student-assessments/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ assessment_id: assessmentId, raw_responses: rawResponses, student_id: studentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `HTTP ${res.status}: Failed to evaluate assessment`);
    }
    return res.json();
  },

  async getMyAssessmentResults(token?: string): Promise<import('../types/institution').StudentAssessmentSession[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/student-assessments/my-results/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch student assessment results`);
    return res.json();
  },

  // =========================================================================
  // 24/7 AI Career Coach API
  // =========================================================================

  async listAIConversations(studentId?: string, token?: string): Promise<import('../types/institution').AICoachConversation[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const query = studentId ? `?student_id=${studentId}` : '';
    const res = await fetch(`${API_BASE}/api/ai-coach/conversations/${query}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch AI coach conversations`);
    return res.json();
  },

  async createAIConversation(title?: string, studentId?: string, token?: string): Promise<import('../types/institution').AICoachConversation> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/ai-coach/conversations/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: title || 'Career & SIWES Advisory Session', student_id: studentId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create AI conversation`);
    return res.json();
  },

  async getAIMessages(conversationId: string, token?: string): Promise<import('../types/institution').AICoachMessage[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/ai-coach/${conversationId}/messages/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch AI messages`);
    return res.json();
  },

  async sendAIMessage(conversationId: string, message: string, token?: string): Promise<import('../types/institution').AICoachMessage> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/ai-coach/${conversationId}/messages/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Failed to query AI Coach`);
    }
    return res.json();
  },

  // =========================================================================
  // Seamless Counsellor Handoff & Booking API
  // =========================================================================

  async getMyCounsellingSessions(token?: string): Promise<import('../types/institution').CounsellingSession[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/counselling-sessions/my-sessions/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch counselling sessions`);
    return res.json();
  },

  async getAvailableCounsellors(institutionId?: string, departmentId?: string, token?: string): Promise<import('../types/institution').AvailableCounsellor[]> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const query = new URLSearchParams();
    if (institutionId) query.append('institution', institutionId);
    if (departmentId) query.append('department', departmentId);
    const res = await fetch(`${API_BASE}/api/counselling-sessions/available-counsellors/?${query.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch available counsellors`);
    return res.json();
  },

  async bookCounsellingSession(
    payload: {
      counsellor?: string;
      topic: string;
      student_notes?: string;
      preferred_date: string;
      preferred_time_slot: string;
      meeting_mode: string;
      meeting_location?: string;
      student_id?: string;
    },
    token?: string
  ): Promise<import('../types/institution').CounsellingSession> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/counselling-sessions/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `HTTP ${res.status}: Failed to book counselling session`);
    }
    return res.json();
  },

  async confirmCounsellingSession(
    sessionId: string,
    payload: { status: string; scheduled_datetime?: string; meeting_location?: string },
    token?: string
  ): Promise<import('../types/institution').CounsellingSession> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/counselling-sessions/${sessionId}/confirm/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to confirm counselling session`);
    return res.json();
  },

  async createCaseNote(
    payload: {
      student: string;
      session?: string;
      summary: string;
      action_items?: import('../types/institution').ActionItem[];
      is_confidential?: boolean;
      author_id?: string;
    },
    token?: string
  ): Promise<import('../types/institution').CounsellingCaseNote> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/counselling-case-notes/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to create counselling case note`);
    return res.json();
  },

  async getStudentDossier(studentId: string, token?: string): Promise<import('../types/institution').StudentDossier> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/students/${studentId}/dossier/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch student dossier`);
    return res.json();
  },

  // Institutional Onboarding, Invoices & Banking
  async registerInstitution(
    payload: import('../types/institution').InstitutionRegistrationPayload
  ): Promise<import('../types/institution').InstitutionRegistrationResponse> {
    const res = await fetch(`${API_BASE}/api/institutions/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `HTTP ${res.status}: Registration failed`);
    }
    return res.json();
  },

  async getActiveBankDetails(): Promise<import('../types/institution').CompanyBankDetail> {
    const res = await fetch(`${API_BASE}/api/company-bank-details/active/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch bank details`);
    return res.json();
  },

  async getPricingPlans(): Promise<import('../types/institution').PricingPlan[]> {
    const res = await fetch(`${API_BASE}/api/pricing-plans/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch pricing plans`);
    return res.json();
  },

  async getInvoices(institutionId?: string, token?: string): Promise<import('../types/institution').InstitutionInvoice[]> {
    const query = new URLSearchParams();
    if (institutionId) query.append('institution_id', institutionId);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/invoices/?${query.toString()}`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch invoices`);
    return res.json();
  },

  async getInvoice(id: string, token?: string): Promise<import('../types/institution').InstitutionInvoice> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/invoices/${id}/`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch invoice`);
    return res.json();
  },

  async submitInvoicePayment(
    invoiceId: string,
    formData: FormData,
    token?: string
  ): Promise<import('../types/institution').InstitutionInvoice> {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;
    const res = await fetch(`${API_BASE}/api/invoices/${invoiceId}/submit-payment/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `HTTP ${res.status}: Failed to submit payment`);
    }
    return res.json();
  },
};






