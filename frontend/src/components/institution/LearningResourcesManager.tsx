import { useCallback, useEffect, useState, type FC } from 'react';
import type { LearningResource, InstitutionHierarchyTree, AcademicSession } from '../../types/institution';
import { institutionApi } from '../../services/institutionApi';
import { UploadLearningResourceModal } from './UploadLearningResourceModal';
import {
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  SmartDisplay as SmartDisplayIcon,
  UploadFile as UploadFileIcon,
  Refresh as RefreshIcon,
  DeleteOutlined as DeleteOutlineIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoLibraryIcon,
  Groups as GroupsIcon,
  OpenInNew as OpenInNewIcon,
  PlayCircleOutlined as PlayCircleOutlineIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { PageHead, StatCard, LoadingBlock } from './Shared';

interface LearningResourcesManagerProps {
  institutionId: string;
  institutionName: string;
  tierTwoTerm: string;
  tree: InstitutionHierarchyTree | null;
  sessions: AcademicSession[];
  authToken?: string | null;
  onRefresh: () => void;
}

type Filter = 'ALL' | 'VIDEO' | 'WORKSHOP' | 'DOCUMENT';

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export const LearningResourcesManager: FC<LearningResourcesManagerProps> = ({
  institutionId,
  institutionName,
  tree,
  sessions,
  authToken,
}) => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await institutionApi.listLearningResources(institutionId, undefined, authToken || undefined);
      setResources(data);
    } catch (err: unknown) {
      console.error('Failed to load learning resources', err);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [institutionId, authToken]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleDelete = async (res: LearningResource) => {
    if (!window.confirm(`Delete "${res.title}"? This cannot be undone.`)) return;
    try {
      await institutionApi.deleteLearningResource(res.id, authToken || undefined);
      await loadResources();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  const filtered = filter === 'ALL' ? resources : resources.filter((r) => r.resource_type === filter);
  const videosCount = resources.filter((r) => r.resource_type === 'VIDEO').length;
  const workshopsCount = resources.filter((r) => r.resource_type === 'WORKSHOP').length;
  const documentsCount = resources.filter((r) => r.resource_type === 'DOCUMENT').length;

  const filters: { key: Filter; label: string }[] = [
    { key: 'ALL', label: `All (${resources.length})` },
    { key: 'VIDEO', label: `Videos (${videosCount})` },
    { key: 'WORKSHOP', label: `Workshops (${workshopsCount})` },
    { key: 'DOCUMENT', label: `Handouts (${documentsCount})` },
  ];

  return (
    <div>
      <PageHead
        eyebrow="Institution Learning Library"
        title="Learning Resources"
        sub={`Publish YouTube videos, workshop recordings, and student handouts for ${institutionName}.`}
        actions={
          <>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={loadResources}
              sx={{ color: 'charcoal.soft', borderColor: 'border.strong' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<UploadFileIcon />}
              onClick={() => setShowUploadModal(true)}
            >
              Publish Resource
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={VideoLibraryIcon} value={videosCount} label="YouTube Videos" sub="Linked via YouTube embed" />
        <StatCard icon={GroupsIcon} value={workshopsCount} label="Workshops / Seminars" sub="Recordings & session material" />
        <StatCard icon={DescriptionIcon} value={documentsCount} label="Documents / Handouts" sub="Uploaded to the library" />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              filter === f.key
                ? 'bg-primary text-white'
                : 'bg-bgsoft text-charcoal-faint hover:bg-primary-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Loading learning resources…" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong bg-bgsoft py-16 text-center">
          <SmartDisplayIcon sx={{ fontSize: 42, color: 'charcoal.faint' }} />
          <p className="text-base font-bold text-charcoal">No resources here yet</p>
          <p className="max-w-sm text-sm text-charcoal-soft">
            Publish your first YouTube video, workshop recording, or student handout to build the learning library.
          </p>
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={() => setShowUploadModal(true)}
            sx={{ mt: 1 }}
          >
            Publish Resource
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((res) => (
            <div
              key={res.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-lg"
            >
              {res.resource_type !== 'DOCUMENT' && res.youtube_video_id ? (
                <a
                  href={res.youtube_url || `https://www.youtube.com/watch?v=${res.youtube_video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block aspect-video bg-black"
                >
                  <img
                    src={`https://img.youtube.com/vi/${res.youtube_video_id}/hqdefault.jpg`}
                    alt={res.title}
                    className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-70"
                    loading="lazy"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <PlayCircleOutlineIcon sx={{ fontSize: 54, color: 'rgba(255,255,255,0.92)' }} />
                  </span>
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white">
                    {res.resource_type === 'VIDEO' ? 'YouTube' : 'Workshop'}
                  </span>
                </a>
              ) : (
                <div className="flex aspect-video items-center justify-center bg-primary-soft/60">
                  <DescriptionIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <Chip
                    size="small"
                    label={res.resource_type_display || res.resource_type}
                    sx={{
                      bgcolor: 'primary.soft',
                      color: 'primary.main',
                      fontSize: 11,
                      fontWeight: 700,
                      height: 22,
                    }}
                  />
                  {res.session_label && (
                    <Chip
                      size="small"
                      label={res.session_label}
                      sx={{
                        bgcolor: 'bgsoft',
                        color: 'charcoal.soft',
                        fontSize: 11,
                        fontWeight: 600,
                        height: 22,
                      }}
                    />
                  )}
                </div>

                <h3 className="text-[15px] font-bold leading-snug text-charcoal">{res.title}</h3>

                {res.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-charcoal-soft">{res.description}</p>
                )}

                <div className="mt-auto pt-3 text-xs text-charcoal-faint">
                  {res.resource_type !== 'DOCUMENT' && res.youtube_url ? (
                    <span className="flex items-center gap-1">
                      <VideoLibraryIcon sx={{ fontSize: 13 }} /> {res.youtube_url}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <DescriptionIcon sx={{ fontSize: 13 }} />
                      {res.file_name || 'Document'} {formatSize(res.file_size) && `· ${formatSize(res.file_size)}`}
                    </span>
                  )}
                  {res.division_name && <span> · {res.division_name}</span>}
                  {res.department_name && <span> · {res.department_name}</span>}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-[11px] text-charcoal-faint">Published {formatDate(res.created_at)}</span>
                  <div className="flex items-center gap-1">
                    {res.resource_type !== 'DOCUMENT' && res.youtube_url && (
                      <Tooltip title="Open on YouTube">
                        <IconButton
                          size="small"
                          href={res.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <OpenInNewIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {res.file_url && (
                      <Tooltip title="Download document">
                        <IconButton size="small" href={res.file_url} target="_blank" rel="noreferrer">
                          <DownloadIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete resource">
                      <IconButton size="small" onClick={() => handleDelete(res)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <UploadLearningResourceModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        institutionId={institutionId}
        tree={tree}
        sessions={sessions}
        authToken={authToken}
        onSuccess={async () => {
          await loadResources();
        }}
      />
    </div>
  );
};