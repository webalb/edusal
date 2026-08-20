import { useCallback, useEffect, useState, type FC } from 'react';
import type { LearningResource } from '../../types/institution';
import { institutionApi } from '../../services/institutionApi';
import {
  Chip,
  Button,
} from '@mui/material';
import {
  SmartDisplay as SmartDisplayIcon,
  Description as DescriptionIcon,
  VideoLibrary as VideoLibraryIcon,
  Groups as GroupsIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { PageHead, LoadingBlock } from '../institution/Shared';

interface StudentLearningResourcesProps {
  institutionId: string;
  authToken?: string | null;
}

type Filter = 'ALL' | 'VIDEO' | 'WORKSHOP' | 'DOCUMENT';

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const StudentLearningResources: FC<StudentLearningResourcesProps> = ({
  institutionId,
  authToken,
}) => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');

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
        sub="Videos, workshops, and handouts published by your institution to support your employability journey."
        actions={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={loadResources}
            sx={{ color: 'charcoal.soft', borderColor: 'border.strong' }}
          >
            Refresh
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
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
          <p className="text-base font-bold text-charcoal">No resources published yet</p>
          <p className="max-w-sm text-sm text-charcoal-soft">
            Your institution hasn't published any learning resources yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((res) =>
            res.resource_type !== 'DOCUMENT' && res.youtube_embed_url ? (
              <div
                key={res.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card"
              >
                <div className="relative aspect-video bg-black">
                  <iframe
                    src={res.youtube_embed_url}
                    title={res.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
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
                  <div className="mt-auto pt-3">
                    {res.youtube_url && (
                      <a
                        href={res.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <OpenInNewIcon sx={{ fontSize: 13 }} /> Open on YouTube
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={res.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card"
              >
                <div className="flex aspect-video items-center justify-center bg-primary-soft/60">
                  <DescriptionIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                </div>
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
                    <span className="flex items-center gap-1">
                      <DescriptionIcon sx={{ fontSize: 13 }} />
                      {res.file_name || 'Handout'}
                      {formatSize(res.file_size) && ` · ${formatSize(res.file_size)}`}
                    </span>
                  </div>
                  <div className="mt-4 border-t border-line pt-3">
                    {res.file_url ? (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        fullWidth
                        component="a"
                        href={res.file_url}
                        target="_blank"
                        rel="noreferrer"
                        startIcon={<DownloadIcon />}
                      >
                        Download / View Handout
                      </Button>
                    ) : (
                      <p className="text-center text-xs text-charcoal-faint">No file attached</p>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};