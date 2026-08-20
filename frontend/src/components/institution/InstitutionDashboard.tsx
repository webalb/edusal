import { useState, useEffect, useRef, type FC } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type {
  InstitutionSummary,
  InstitutionHierarchyTree,
  GovernanceSummary,
  InstitutionalDocument,
  AcademicSession,
  LoginResponse,
  AuthUser,
} from '../../types/institution';
import { institutionApi } from '../../services/institutionApi';
import { InstitutionLogin } from './InstitutionLogin';
import { GovernancePulse } from './GovernancePulse';
import { AcademicHierarchyTree } from './AcademicHierarchyTree';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';
import { LearningResourcesManager } from './LearningResourcesManager';
import { StaffDirectory } from './StaffDirectory';
import { StudentRoster } from './StudentRoster';
import { PathwaysManager } from './PathwaysManager';
import { StudentDashboard } from '../student/StudentDashboard';
import { InstitutionalPaymentHub } from './InstitutionalPaymentHub';
import { PlatformAdminDashboard } from '../admin/PlatformAdminDashboard';
import { AddDivisionModal } from './AddDivisionModal';
import { AddDepartmentModal } from './AddDepartmentModal';
import { AddProgramModal } from './AddProgramModal';
import { SenateReportModal } from './SenateReportModal';
import { AcademicSessionsModal } from './AcademicSessionsModal';
import { HierarchyBulkImportModal } from './HierarchyBulkImportModal';
import { DashboardTheme, LoadingBlock } from './Shared';
import {
  Chip,
  Drawer,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  AccountTree as AccountTreeIcon,
  MenuBook as MenuBookIcon,
  Group as GroupIcon,
  NotificationsNone as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
  Logout as LogoutIcon,
  Public as PublicIcon,
  Verified as VerifiedIcon,
  School as GraduationCapIcon,
  Explore as CompassIcon,
  SmartDisplay as SmartDisplayIcon,
} from '@mui/icons-material';

interface InstitutionDashboardProps {
  initialRole?: 'student' | 'staff';
  onBackToLanding: () => void;
}

type TabKey = 'pulse' | 'tree' | 'kb' | 'resources' | 'staff' | 'students' | 'pathways';

const TAB_PATHS: Record<TabKey, string> = {
  pulse: 'governance-pulse',
  tree: 'hierarchy-explorer',
  kb: 'knowledge-base',
  resources: 'learning-resources',
  students: 'student-roster',
  pathways: 'career-pathways',
  staff: 'staff-evaluators',
};

const PATH_TO_TAB: Record<string, TabKey> = Object.fromEntries(
  (Object.entries(TAB_PATHS) as [TabKey, string][]).map(([key, path]) => [path, key])
);

const NavSections: {
  label: string;
  items: { key: TabKey; label: string; icon: typeof DashboardIcon }[];
}[] = [
  {
    label: 'Overview',
    items: [{ key: 'pulse', label: 'Dashboard Pulse', icon: DashboardIcon }],
  },
  {
    label: 'Academics',
    items: [
      { key: 'tree', label: 'Academic Structure', icon: AccountTreeIcon },
      { key: 'students', label: 'Student Roster', icon: GraduationCapIcon },
    ],
  },
  {
    label: 'Resources',
    items: [
      { key: 'kb', label: 'Knowledge Base', icon: MenuBookIcon },
      { key: 'resources', label: 'Learning Resources', icon: SmartDisplayIcon },
      { key: 'pathways', label: 'Career Pathways', icon: CompassIcon },
    ],
  },
  {
    label: 'Administration',
    items: [{ key: 'staff', label: 'Staff Directory', icon: GroupIcon }],
  },
];

export const InstitutionDashboard: FC<InstitutionDashboardProps> = ({
  initialRole = 'student',
  onBackToLanding,
}) => {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('nexus_auth_token') || null;
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('nexus_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Institution State locked to the logged-in staff member's institution
  const [institution, setInstitution] = useState<InstitutionSummary | null>(null);
  const selectedInstId = currentUser?.staff_profile?.institution || '';
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Refresh the cached user once after mount so role fields (e.g. is_superuser)
  // stay current even when localStorage holds an older auth payload.
  const refreshedProfileRef = useRef(false);
  useEffect(() => {
    if (authToken && currentUser && !refreshedProfileRef.current) {
      refreshedProfileRef.current = true;
      institutionApi
        .getMe(authToken)
        .then((me) => {
          setCurrentUser(me);
          localStorage.setItem('nexus_auth_user', JSON.stringify(me));
        })
        .catch(() => {});
    }
  }, [authToken, currentUser]);

  const pathSeg = location.pathname.split('/').filter(Boolean).pop() || '';
  const activeTab: TabKey = PATH_TO_TAB[pathSeg] || 'pulse';

  useEffect(() => {
    const isStaff = !!currentUser && !currentUser.student_profile;
    if (isStaff && !PATH_TO_TAB[pathSeg]) {
      navigate(`/portal/institution/${TAB_PATHS.pulse}`, { replace: true });
    }
  }, [pathSeg, navigate, currentUser]);

  // Hierarchy & Governance Data
  const [tree, setTree] = useState<InstitutionHierarchyTree | null>(null);
  const [summary, setSummary] = useState<GovernanceSummary | null>(null);
  const [documents, setDocuments] = useState<InstitutionalDocument[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedDivisionForDept, setSelectedDivisionForDept] = useState<string>('');
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [selectedDeptForProg, setSelectedDeptForProg] = useState<string>('');
  const [showSenateModal, setShowSenateModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  // Handle Login Success
  const handleLoginSuccess = (authData: LoginResponse) => {
    setAuthToken(authData.token);
    setCurrentUser(authData.user);
    localStorage.setItem('nexus_auth_token', authData.token);
    localStorage.setItem('nexus_auth_user', JSON.stringify(authData.user));
  };

  // Handle Logout
  const handleLogout = async () => {
    if (authToken) {
      institutionApi.logout(authToken).catch(() => {});
    }
    setAuthToken(null);
    setCurrentUser(null);
    setInstitution(null);
    setTree(null);
    setSummary(null);
    setDocuments([]);
    setSessions([]);
    localStorage.removeItem('nexus_auth_token');
    localStorage.removeItem('nexus_auth_user');
  };

  // Load single institution data strictly matching current logged-in user
  const loadInstitutionData = async (instId: string) => {
    if (!instId) return;
    setLoading(true);
    try {
      const [treeData, summaryData, docsData, instList, sessionsData] = await Promise.all([
        institutionApi.getInstitutionTree(instId),
        institutionApi.getGovernanceSummary(instId),
        institutionApi.getDocuments(instId),
        institutionApi.getInstitutions({ id: instId }),
        institutionApi.getSessions(instId),
      ]);
      setTree(treeData);
      setSummary(summaryData);
      setDocuments(docsData);
      setSessions(sessionsData);
      if (instList && instList.length > 0) {
        setInstitution(instList.find((i) => i.id === instId) || instList[0]);
      }
    } catch (err) {
      console.error('Failed to fetch institution dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstId && authToken) {
      loadInstitutionData(selectedInstId);
    }
  }, [selectedInstId, authToken]);

  // If not logged in, render the login view
  if (!authToken || !currentUser) {
    return (
      <InstitutionLogin
        initialRole={initialRole}
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={onBackToLanding}
      />
    );
  }

  // Platform super administrators always land on the Platform Admin dashboard
  // to manage all tenants, invoices and payments.
  if (currentUser.is_superuser) {
    return (
      <PlatformAdminDashboard
        currentUser={currentUser}
        token={authToken}
        onLogout={handleLogout}
        onBackToLanding={onBackToLanding}
      />
    );
  }

  // If user is a student, render the dedicated Student Dashboard
  if (currentUser.student_profile) {
    return (
      <StudentDashboard
        currentUser={currentUser}
        authToken={authToken}
        onLogout={handleLogout}
      />
    );
  }

  // If institution is PENDING_PAYMENT or PAYMENT_SUBMITTED or status !== 'ACTIVE', render InstitutionalPaymentHub
  const institutionStatus = institution?.status || currentUser.staff_profile?.institution_status || 'PENDING_PAYMENT';
  if (institutionStatus !== 'ACTIVE') {
    return (
      <InstitutionalPaymentHub
        currentUser={currentUser}
        token={authToken}
        onLogout={handleLogout}
        onActivated={async () => {
          if (selectedInstId) {
            await loadInstitutionData(selectedInstId);
          }
          if (authToken) {
            try {
              const me = await institutionApi.getMe(authToken);
              if (me) {
                setCurrentUser(me);
                localStorage.setItem('nexus_auth_user', JSON.stringify(me));
              }
            } catch (e) {
              console.error('Failed to refresh user profile:', e);
            }
          }
        }}
      />
    );
  }

  // Handlers for adding division/department/program
  const handleAddDivision = async (data: {
    institution: string;
    name: string;
    code: string;
    division_type: 'FACULTY' | 'SCHOOL' | 'COLLEGE';
    dean_name?: string;
    dean_email?: string;
  }) => {
    await institutionApi.createDivision(data);
    await loadInstitutionData(selectedInstId);
  };

  const handleAddDepartment = async (data: {
    institution: string;
    division: string;
    name: string;
    code: string;
    hod_name?: string;
    hod_email?: string;
    siwes_eligible: boolean;
  }) => {
    await institutionApi.createDepartment(data);
    await loadInstitutionData(selectedInstId);
  };

  const handleAddProgram = async (data: {
    institution: string;
    department: string;
    name: string;
    program_code: string;
    award_level: string;
    duration_years: number;
    siwes_duration_months: number;
  }) => {
    await institutionApi.createProgram(data);
    await loadInstitutionData(selectedInstId);
  };

  const handleDeleteDivision = async (divisionId: string) => {
    await institutionApi.deleteDivision(divisionId, authToken || undefined);
    await loadInstitutionData(selectedInstId);
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    await institutionApi.deleteDepartment(departmentId, authToken || undefined);
    await loadInstitutionData(selectedInstId);
  };

  const handleDeleteProgram = async (programId: string) => {
    await institutionApi.deleteProgram(programId, authToken || undefined);
    await loadInstitutionData(selectedInstId);
  };

  const handleCreateSession = async (data: {
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
  }) => {
    await institutionApi.createSession(data, authToken || undefined);
    if (selectedInstId) {
      await loadInstitutionData(selectedInstId);
    }
  };

  const handleSetCurrentSession = async (
    sessionId: string,
    currentSemester?: 'FIRST_SEMESTER' | 'SECOND_SEMESTER'
  ) => {
    await institutionApi.setCurrentSession(sessionId, currentSemester, authToken || undefined);
    if (selectedInstId) {
      await loadInstitutionData(selectedInstId);
    }
  };

  const handleUpdateSession = async (
    sessionId: string,
    data: Partial<AcademicSession>
  ) => {
    await institutionApi.updateSession(sessionId, data, authToken || undefined);
    if (selectedInstId) {
      await loadInstitutionData(selectedInstId);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await institutionApi.deleteSession(sessionId, authToken || undefined);
    if (selectedInstId) {
      await loadInstitutionData(selectedInstId);
    }
  };

  const selectedInst = institution || (tree ? {
    id: tree.id,
    name: tree.name,
    short_name: tree.short_name,
    slug: tree.short_name.toLowerCase(),
    institution_type: tree.institution_type,
    institution_type_display: tree.institution_type,
    ownership: 'FEDERAL',
    regulator: tree.regulator,
    regulator_display: `${tree.regulator} Regulated`,
    tier_two_term: tree.tier_two_term,
    state: 'Nigeria',
    is_founding_partner: true,
    status: 'ACTIVE',
    divisions_count: tree.divisions_count,
    departments_count: 0,
    programs_count: 0,
    documents_count: 0,
    created_at: '',
  } : null);

  const displayName = currentUser.name || currentUser.email;
  const displayRole = currentUser.staff_profile?.role_display || 'Institutional Staff';
  const t2Label =
    selectedInst?.tier_two_term === 'SCHOOL'
      ? 'School'
      : selectedInst?.tier_two_term === 'COLLEGE'
        ? 'College'
        : 'Faculty';

  const renderSidebar = (collapsed: boolean, isMobile = false) => (
    <div className="flex h-full flex-col bg-charcoal text-white select-none">
      {/* Header / Logo */}
      <div className={`flex h-16 items-center border-b border-white/10 ${collapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-6'}`}>
        {isMobile ? (
          <>
            <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
              <img src="/logo-white.png" alt="Nexus Edutech" className="h-8 w-auto object-contain" />
            </Link>
            <IconButton
              onClick={() => setSidebarOpen(false)}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
              aria-label="Close menu"
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </>
        ) : collapsed ? (
          <Tooltip title="Expand Sidebar" placement="right" arrow>
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);
                try { localStorage.setItem('nexus_sidebar_collapsed', 'false'); } catch {}
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-white transition-colors hover:bg-white/[0.15]"
            >
              <img src="/alogo-white.png" alt="Nexus" className="h-6 w-6 object-contain" />
            </button>
          </Tooltip>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-white.png" alt="Nexus Edutech" className="h-8 w-auto object-contain" />
            </Link>
            <Tooltip title="Collapse Sidebar" placement="left" arrow>
              <IconButton
                onClick={() => {
                  setIsCollapsed(true);
                  try { localStorage.setItem('nexus_sidebar_collapsed', 'true'); } catch {}
                }}
                size="small"
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                aria-label="Collapse sidebar"
              >
                <ChevronLeftIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </div>

      {/* User / Institution Info */}
      <div className={`mx-3 mt-3 rounded-[15px] bg-white/[0.06] ${collapsed && !isMobile ? 'p-2 flex flex-col items-center' : 'p-3.5'}`}>
        {collapsed && !isMobile ? (
          <Tooltip
            title={
              <div className="text-xs py-0.5">
                <p className="font-bold">{displayName}</p>
                <p className="text-white/70">{displayRole}</p>
                {selectedInst && <p className="text-emerald-300 mt-1 font-semibold">{selectedInst.name}</p>}
              </div>
            }
            placement="right"
            arrow
          >
            <span className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white shadow-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          </Tooltip>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <p className="truncate text-xs text-white/60">{displayRole}</p>
              </div>
            </div>
            {selectedInst && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <Chip
                  size="small"
                  icon={<VerifiedIcon sx={{ fontSize: 13, color: '#7FB69A' }} />}
                  label={`${selectedInst.regulator} Regulated`}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#E6F2EC',
                    height: 22,
                    '& .MuiChip-label': { fontSize: 10, fontWeight: 700, px: 1 },
                  }}
                />
                {selectedInst.is_founding_partner && (
                  <Chip
                    size="small"
                    label="Charter"
                    sx={{
                      bgcolor: 'rgba(20,107,74,0.55)',
                      color: '#fff',
                      height: 22,
                      '& .MuiChip-label': { fontSize: 10, fontWeight: 700, px: 1 },
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-6 space-y-4">
        {NavSections.map((s) => (
          <div key={s.label}>
            {!collapsed || isMobile ? (
              <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                {s.label}
              </p>
            ) : (
              <div className="my-2 border-t border-white/10" />
            )}
            <div className="space-y-1">
              {s.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                const buttonContent = (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      navigate(`/portal/institution/${TAB_PATHS[item.key]}`);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center rounded-[12px] transition-all ${
                      collapsed && !isMobile
                        ? 'h-11 w-11 justify-center mx-auto'
                        : 'gap-3 px-3 py-2.5 text-[13px] font-semibold'
                    } ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-white/65 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <Icon sx={{ fontSize: 20 }} />
                    {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                  </button>
                );

                return collapsed && !isMobile ? (
                  <Tooltip key={item.key} title={item.label} placement="right" arrow>
                    <div>{buttonContent}</div>
                  </Tooltip>
                ) : (
                  buttonContent
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {collapsed && !isMobile ? (
          <>
            <Tooltip title="Back to Landing" placement="right" arrow>
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white mx-auto"
              >
                <PublicIcon sx={{ fontSize: 20 }} />
              </Link>
            </Tooltip>
            <Tooltip title="Sign out" placement="right" arrow>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white mx-auto"
              >
                <LogoutIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-[13px] font-semibold text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <span className="flex items-center gap-3">
                <PublicIcon sx={{ fontSize: 18 }} />
                Back to Landing
              </span>
              <ArrowForwardIcon sx={{ fontSize: 15 }} />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-semibold text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <LogoutIcon sx={{ fontSize: 18 }} />
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <DashboardTheme>
      <div className="min-h-screen bg-bgsoft">
        <aside
          className={`fixed inset-y-0 left-0 z-30 hidden transition-all duration-300 ease-in-out lg:block ${
            isCollapsed ? 'w-20' : 'w-72'
          }`}
        >
          {renderSidebar(isCollapsed, false)}
        </aside>

        {/* Mobile-only slideout drawer */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: 288, boxSizing: 'border-box' },
          }}
        >
          {renderSidebar(false, true)}
        </Drawer>

        <div
          className={`min-h-screen transition-all duration-300 ease-in-out ${
            isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
          }`}
        >
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Responsive Sidebar Toggle */}
              <Tooltip title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                <IconButton
                  aria-label="Toggle navigation menu"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setSidebarOpen((prev) => !prev);
                    } else {
                      setIsCollapsed((prev) => {
                        const next = !prev;
                        try { localStorage.setItem('nexus_sidebar_collapsed', String(next)); } catch {}
                        return next;
                      });
                    }
                  }}
                  sx={{
                    color: 'charcoal.main',
                    '&:hover': { color: 'primary.main', bgcolor: 'primary.soft' },
                  }}
                >
                  {isCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                </IconButton>
              </Tooltip>

              <div className="hidden items-center gap-1.5 text-sm text-charcoal-faint sm:flex">
                <span className="font-semibold text-charcoal">
                  {selectedInst?.name || 'Institution'}
                </span>
                <span>/</span>
                <span className="font-semibold text-primary">Institution Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Tooltip title={`Nigeria · Tier-2 Native: ${selectedInst?.tier_two_term || ''}`}>
                <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold text-primary md:inline-flex">
                  <PublicIcon sx={{ fontSize: 13 }} />
                  {selectedInst?.state || 'Nigeria'} State, Nigeria
                </span>
              </Tooltip>
              <Tooltip title="Notifications">
                <IconButton aria-label="Notifications">
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-3 pl-1.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
                  {displayName.slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-charcoal">{displayName}</span>
                  <span className="block text-[11px] text-charcoal-faint">{displayRole}</span>
                </span>
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            {loading && !tree && !summary ? (
              <LoadingBlock
                label="Loading your institution workspace…"
                sub="Please wait a moment while we fetch your latest information."
              />
            ) : (
              <>
                {activeTab === 'pulse' && (
              <GovernancePulse
                summary={summary}
                tree={tree}
                documents={documents}
                loading={loading}
                onGenerateReport={() => setShowSenateModal(true)}
                onManageSessions={() => setShowSessionsModal(true)}
              />
            )}

            {activeTab === 'tree' && (
              <AcademicHierarchyTree
                tree={tree}
                loading={loading}
                onAddDivision={() => setShowDivisionModal(true)}
                onOpenBulkImport={() => setShowBulkImportModal(true)}
                onAddDepartment={(divId) => {
                  setSelectedDivisionForDept(divId);
                  setShowDepartmentModal(true);
                }}
                onAddProgram={(deptId) => {
                  setSelectedDeptForProg(deptId);
                  setShowProgramModal(true);
                }}
                onDeleteDivision={handleDeleteDivision}
                onDeleteDepartment={handleDeleteDepartment}
                onDeleteProgram={handleDeleteProgram}
              />
            )}

            {activeTab === 'kb' && selectedInst && (
              <KnowledgeBaseManager
                institutionId={selectedInst.id}
                institutionName={selectedInst.name}
                tierTwoTerm={t2Label}
                tree={tree}
                sessions={sessions}
                documents={documents}
                loading={loading}
                authToken={authToken}
                onRefresh={() => loadInstitutionData(selectedInst.id)}
              />
            )}

            {activeTab === 'resources' && selectedInst && (
              <LearningResourcesManager
                institutionId={selectedInst.id}
                institutionName={selectedInst.name}
                tierTwoTerm={t2Label}
                tree={tree}
                sessions={sessions}
                authToken={authToken}
                onRefresh={() => loadInstitutionData(selectedInst.id)}
              />
            )}

            {activeTab === 'staff' && selectedInst && (
              <StaffDirectory
                institutionId={selectedInst.id}
                institutionName={selectedInst.name}
                tierTwoTerm={t2Label}
              />
            )}

            {activeTab === 'students' && selectedInst && (
              <StudentRoster
                institutionId={selectedInst.id}
                institutionName={selectedInst.name}
                tree={tree}
                sessions={sessions}
                authToken={authToken}
              />
            )}

            {activeTab === 'pathways' && selectedInst && (
              <PathwaysManager
                institutionId={selectedInst.id}
                institutionName={selectedInst.name}
                tierTwoTerm={t2Label}
                tree={tree}
                authToken={authToken}
              />
            )}
              </>
            )}
          </main>
        </div>
      </div>

      {selectedInst && (
        <>
          <AddDivisionModal
            isOpen={showDivisionModal}
            onClose={() => setShowDivisionModal(false)}
            institutionId={selectedInst.id}
            tierTwoTerm={selectedInst.tier_two_term}
            onSubmit={handleAddDivision}
          />

          <AddDepartmentModal
            isOpen={showDepartmentModal}
            onClose={() => setShowDepartmentModal(false)}
            institutionId={selectedInst.id}
            divisionId={selectedDivisionForDept}
            onSubmit={handleAddDepartment}
          />

          <AddProgramModal
            isOpen={showProgramModal}
            onClose={() => setShowProgramModal(false)}
            institutionId={selectedInst.id}
            departmentId={selectedDeptForProg}
            onSubmit={handleAddProgram}
          />

          <SenateReportModal
            isOpen={showSenateModal}
            onClose={() => setShowSenateModal(false)}
            summary={summary}
          />

          <AcademicSessionsModal
            open={showSessionsModal}
            onClose={() => setShowSessionsModal(false)}
            institutionId={selectedInst.id}
            institutionName={selectedInst.name}
            sessions={sessions}
            token={authToken || undefined}
            onCreateSession={handleCreateSession}
            onSetCurrentSession={handleSetCurrentSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
          />

          <HierarchyBulkImportModal
            open={showBulkImportModal}
            onClose={() => setShowBulkImportModal(false)}
            institutionId={selectedInst.id}
            institutionName={selectedInst.name}
            token={authToken || undefined}
            onSuccess={async () => {
              await loadInstitutionData(selectedInst.id);
            }}
          />
        </>
      )}
    </DashboardTheme>
  );
};