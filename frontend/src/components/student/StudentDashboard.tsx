import { useState, useEffect, type FC } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { StudentDashboardData, AuthUser } from '../../types/institution';
import { institutionApi } from '../../services/institutionApi';
import { EmployabilityGaugeCard } from './EmployabilityGaugeCard';
import { StudentRoadmapTimeline } from './StudentRoadmapTimeline';
import { AssessmentCatalog } from './AssessmentCatalog';
import { AICareerCoachChat } from './AICareerCoachChat';
import { CounsellingSessionsTab } from './CounsellingSessionsTab';
import { StudentLearningResources } from './StudentLearningResources';
import { DashboardTheme, PageHead, Panel, StatCard, Badge, LoadingBlock } from '../institution/Shared';
import { Chip, Drawer, IconButton, Tooltip } from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  ArrowForward as ArrowForwardIcon,
  Logout as LogoutIcon,
  Public as PublicIcon,
  School as SchoolIcon,
  Refresh as RefreshIcon,
  Explore as CompassIcon,
  Verified as VerifiedIcon,
  EmojiEvents as EmojiEventsIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  SupportAgent as SupportAgentIcon,
  SmartDisplay as SmartDisplayIcon,
} from '@mui/icons-material';

interface StudentDashboardProps {
  currentUser: AuthUser;
  authToken: string;
  onLogout: () => void;
}

type TabKey = 'overview' | 'employability' | 'roadmap' | 'diagnostics' | 'ai_coach' | 'counselling' | 'resources';

const TAB_PATHS: Record<TabKey, string> = {
  overview: 'overview',
  employability: 'employability',
  roadmap: 'career-roadmap',
  diagnostics: 'diagnostics',
  ai_coach: 'ai-career-coach',
  counselling: 'counselling',
  resources: 'learning-resources',
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
    items: [{ key: 'overview', label: 'Career Overview', icon: DashboardIcon }],
  },
  {
    label: 'My Record',
    items: [
      { key: 'employability', label: 'Employability Quotient', icon: WorkspacePremiumIcon },
      { key: 'roadmap', label: 'Career Roadmap', icon: TimelineIcon },
    ],
  },
  {
    label: 'Career Growth',
    items: [
      { key: 'diagnostics', label: 'Diagnostic Assessments', icon: PsychologyIcon },
      { key: 'ai_coach', label: 'AI Career Coach', icon: AutoAwesomeIcon },
      { key: 'counselling', label: 'Counsellor Sessions', icon: SupportAgentIcon },
    ],
  },
  {
    label: 'Learning',
    items: [{ key: 'resources', label: 'Learning Resources', icon: SmartDisplayIcon }],
  },
];

export const StudentDashboard: FC<StudentDashboardProps> = ({
  currentUser,
  authToken,
  onLogout,
}) => {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathSeg = location.pathname.split('/').filter(Boolean).pop() || '';
  const activeTab: TabKey = PATH_TO_TAB[pathSeg] || 'overview';

  useEffect(() => {
    if (!PATH_TO_TAB[pathSeg]) {
      navigate(`/portal/institution/${TAB_PATHS.overview}`, { replace: true });
    }
  }, [pathSeg, navigate]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await institutionApi.getStudentDashboard(authToken);
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load student dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [authToken]);

  const displayName = data?.profile.user_name || currentUser.name || 'Student';
  const displayRole =
    data?.profile.level_display || data?.profile.award_level_display || 'Student';
  const initials = displayName.slice(0, 2).toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col bg-charcoal">
      <div className="flex h-16 items-center px-6">
        <img src="/logo-white.png" alt="Nexus Edutech Consult Ltd" className="h-9 w-auto" />
      </div>

      <div className="mx-4 mt-2 rounded-[15px] bg-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="truncate text-xs text-white/60">
              {data?.profile.matric_number || displayRole}
            </p>
          </div>
        </div>
        {data && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Chip
              size="small"
              icon={<VerifiedIcon sx={{ fontSize: 13, color: '#7FB69A' }} />}
              label={data.profile.institution_short_name}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                color: '#E6F2EC',
                '& .MuiChip-label': { fontSize: 11, fontWeight: 700 },
              }}
            />
            <Chip
              size="small"
              label={data.profile.level_display}
              sx={{
                bgcolor: 'rgba(20,107,74,0.55)',
                color: '#fff',
                '& .MuiChip-label': { fontSize: 11, fontWeight: 700 },
              }}
            />
          </div>
        )}
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-4 pb-6">
        {NavSections.map((s) => (
          <div key={s.label} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
              {s.label}
            </p>
            <div className="space-y-1">
              {s.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      navigate(`/portal/institution/${TAB_PATHS[item.key]}`);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[15px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                      activeTab === item.key
                        ? 'bg-primary text-white'
                        : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex w-full items-center justify-between rounded-[15px] px-3 py-2.5 text-[13px] font-semibold text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <span className="flex items-center gap-3">
            <PublicIcon sx={{ fontSize: 18 }} />
            Back to Landing
          </span>
          <ArrowForwardIcon sx={{ fontSize: 15 }} />
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-[15px] px-3 py-2.5 text-[13px] font-semibold text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <LogoutIcon sx={{ fontSize: 18 }} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <DashboardTheme>
      <div className="min-h-screen bg-bgsoft">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
          {SidebarContent}
        </aside>

        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { width: 288, boxSizing: 'border-box' },
          }}
        >
          {SidebarContent}
        </Drawer>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3">
              <IconButton
                sx={{ display: { xs: 'inline-flex', lg: 'none' } }}
                aria-label="Open menu"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              <div className="hidden items-center gap-1.5 text-sm text-charcoal-faint sm:flex">
                <span className="font-semibold text-charcoal">
                  {data?.profile.institution_name || 'Institution'}
                </span>
                <span>/</span>
                <span className="font-semibold text-primary">Student Workspace</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Tooltip title={data?.profile.award_level_display || ''}>
                <span className="hidden items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold text-primary md:inline-flex">
                  <SchoolIcon sx={{ fontSize: 13 }} />
                  {data?.profile.award_level_display || 'Student'}
                </span>
              </Tooltip>
              <Tooltip title="Accredited Employability Quotient">
                <IconButton aria-label="Employability">
                  <WorkspacePremiumIcon />
                </IconButton>
              </Tooltip>
              <button
                type="button"
                className="flex items-center gap-2.5 rounded-full bg-white py-1.5 pr-3 pl-1.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
                  {initials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-bold text-charcoal">{displayName}</span>
                  <span className="block text-[11px] text-charcoal-faint">
                    {data?.profile.matric_number || displayRole}
                  </span>
                </span>
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
            {loading && (
              <LoadingBlock
                label="Loading your dashboard…"
                sub="Please wait while we fetch your latest information."
              />
            )}
  
            {!loading && (error || !data) && (
              <Panel>
                <div className="py-10 text-center">
                  <CompassIcon sx={{ fontSize: 40, color: 'charcoal.faint', mb: 2 }} />
                  <h3 className="text-lg font-bold text-charcoal">Unable to Load Dashboard</h3>
                  <p className="mx-auto mt-1 max-w-md text-sm text-charcoal-faint">
                    {error || 'Student profile data could not be retrieved.'}
                  </p>
                  <button
                    type="button"
                    onClick={loadDashboard}
                    className="mt-5 inline-flex items-center gap-2 rounded-[15px] bg-primary px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  >
                    <RefreshIcon sx={{ fontSize: 16 }} />
                    Retry
                  </button>
                </div>
              </Panel>
            )}

            {!loading && data && (
              <>
                {activeTab === 'overview' && (
                  <>
                    <PageHead
                      eyebrow="Student Career Portal"
                      title={data.profile.program_name}
                      sub={`Matriculation: ${data.profile.matric_number} · Entry Mode: ${data.profile.entry_mode_display} · Session: ${data.profile.entry_session_label}`}
                      actions={
                        <button
                          type="button"
                          onClick={loadDashboard}
                          className="inline-flex items-center gap-2 rounded-[15px] bg-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        >
                          <RefreshIcon sx={{ fontSize: 16 }} />
                          Refresh Dashboard
                        </button>
                      }
                    />

                    <Panel className="mb-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge color="#fff" bg="var(--color-primary)">
                              {data.profile.institution_short_name}
                            </Badge>
                            <Badge color="var(--color-charcoal)" bg="rgba(31,41,51,0.08)">
                              {data.profile.department_name}
                            </Badge>
                            <Badge>{data.profile.level_display}</Badge>
                            {data.profile.is_siwes_year && (
                              <Badge color="#92400e" bg="#fef3c7">
                                SIWES Eligible Cohort
                              </Badge>
                            )}
                          </div>
                          <h2 className="mt-3 text-lg font-bold text-charcoal md:text-xl">
                            {data.profile.program_name}
                          </h2>
                          <p className="mt-1 text-sm text-charcoal-faint">
                            {data.profile.division_name} · {data.profile.department_name}
                          </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div className="rounded-[15px] bg-bgsoft px-4 py-3 text-center">
                            <span className="block text-[11px] font-bold uppercase tracking-wide text-charcoal-faint">
                              Cumulative GPA
                            </span>
                            <span className="mt-1 block text-xl font-extrabold text-charcoal">
                              {data.profile.cgpa ? Number(data.profile.cgpa).toFixed(2) : '3.50'}
                            </span>
                          </div>
                          <div className="rounded-[15px] bg-bgsoft px-4 py-3 text-center">
                            <span className="block text-[11px] font-bold uppercase tracking-wide text-charcoal-faint">
                              SIWES Status
                            </span>
                            <span className="mt-1 block text-sm font-bold text-primary">
                              {data.profile.siwes_clearance_status_display}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Panel>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        icon={WorkspacePremiumIcon}
                        value={`${Number(data.profile.employability_score || 0).toFixed(1)}%`}
                        label="Employability Score"
                        sub="Accredited Employability Quotient"
                      />
                      <StatCard
                        icon={SchoolIcon}
                        value={data.profile.cgpa ? Number(data.profile.cgpa).toFixed(2) : 'N/A'}
                        label="Cumulative GPA"
                        sub={data.profile.academic_standing_display || 'In Good Standing'}
                      />
                      <StatCard
                        icon={VerifiedIcon}
                        value={data.profile.milestones_completed_count}
                        label="Verified Milestones"
                        sub="Deliverables accredited"
                      />
                      <StatCard
                        icon={EmojiEventsIcon}
                        value={data.profile.verified_points_total}
                        label="Accredited Points"
                        sub="Milestone points earned"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'employability' && (
                  <>
                    <PageHead
                      eyebrow="Employability"
                      title="Accredited Employability Quotient"
                      sub="Composite ranking evaluated from verified technical milestones (70%) and academic CGPA (30%)"
                    />
                    <EmployabilityGaugeCard
                      summary={data.employability_summary}
                      profile={data.profile}
                    />
                  </>
                )}

                {activeTab === 'roadmap' && (
                  <>
                    <PageHead
                      eyebrow="Career Roadmap"
                      title="Career Pathway Milestone Roadmap"
                      sub={
                        data.active_pathway
                          ? `Track and complete industry deliverables sequenced for ${data.active_pathway.title}`
                          : 'Your departmental counsellor will assign a career pathway blueprint to your degree program.'
                      }
                    />
                    {data.active_pathway ? (
                      <StudentRoadmapTimeline
                        pathway={data.active_pathway}
                        submissions={data.submissions}
                        studentYearOfStudy={data.profile.year_of_study}
                        authToken={authToken}
                        onRefresh={loadDashboard}
                      />
                    ) : (
                      <Panel>
                        <div className="py-10 text-center">
                          <CompassIcon sx={{ fontSize: 40, color: 'charcoal.faint', mb: 2 }} />
                          <h3 className="text-lg font-bold text-charcoal">
                            No Career Pathway Assigned Yet
                          </h3>
                          <p className="mx-auto mt-1 max-w-md text-sm text-charcoal-faint">
                            Your departmental counsellor will assign a career pathway blueprint to
                            your degree program shortly.
                          </p>
                        </div>
                      </Panel>
                    )}
                  </>
                )}

                {activeTab === 'diagnostics' && (
                  <AssessmentCatalog studentId={data.profile.id} authToken={authToken} />
                )}

                {activeTab === 'ai_coach' && (
                  <AICareerCoachChat
                    studentProfile={data.profile}
                    activePathway={data.active_pathway}
                    authToken={authToken}
                  />
                )}

                {activeTab === 'counselling' && (
                  <CounsellingSessionsTab
                    studentProfile={data.profile}
                    authToken={authToken}
                  />
                )}

                {activeTab === 'resources' && (
                  <StudentLearningResources
                    institutionId={data.profile.institution}
                    authToken={authToken}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </DashboardTheme>
  );
};