import { useState, type FC, type FormEvent } from 'react';
import type { InstitutionHierarchyTree, AcademicSession, LearningResourceType } from '../../types/institution';
import { institutionApi } from '../../services/institutionApi';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  VideoLibrary as VideoLibraryIcon,
  UploadFile as UploadFileIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  SmartDisplay as SmartDisplayIcon,
} from '@mui/icons-material';

interface UploadLearningResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionId: string;
  tree: InstitutionHierarchyTree | null;
  sessions: AcademicSession[];
  authToken?: string | null;
  onSuccess: () => Promise<void>;
}

const resourceTypes: { value: LearningResourceType; label: string; hint: string }[] = [
  { value: 'VIDEO', label: 'Video (YouTube)', hint: 'Provide the YouTube video link' },
  { value: 'WORKSHOP', label: 'Workshop / Seminar', hint: 'YouTube recording or slides/handout' },
  { value: 'DOCUMENT', label: 'Document / Handout', hint: 'Upload a PDF, DOCX, PPTX, or TXT file' },
];

export const UploadLearningResourceModal: FC<UploadLearningResourceModalProps> = ({
  isOpen,
  onClose,
  institutionId,
  tree,
  sessions,
  authToken,
  onSuccess,
}) => {
  const [resourceType, setResourceType] = useState<LearningResourceType>('VIDEO');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSession, setSelectedSession] = useState(
    sessions.find((s) => s.is_current)?.id || sessions[0]?.id || ''
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const availableDepts =
    selectedDivision && tree
      ? tree.divisions.find((d) => d.id === selectedDivision)?.departments || []
      : [];

  const needsYoutube = resourceType === 'VIDEO' || resourceType === 'WORKSHOP';
  const needsFile = resourceType === 'DOCUMENT' || resourceType === 'WORKSHOP';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!title) {
        const cleanName = e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      if (!title) {
        const cleanName = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
        setTitle(cleanName);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (resourceType === 'VIDEO' && !youtubeUrl.trim()) {
      alert('Please provide the YouTube video link.');
      return;
    }
    if (resourceType === 'DOCUMENT' && !selectedFile) {
      alert('Please select a document to upload.');
      return;
    }
    if (resourceType === 'WORKSHOP' && !youtubeUrl.trim() && !selectedFile) {
      alert('Please provide a YouTube link or upload a document for this workshop.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedFile && needsFile) {
        const formData = new FormData();
        formData.append('institution', institutionId);
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('resource_type', resourceType);
        if (selectedDivision) formData.append('division', selectedDivision);
        if (selectedDepartment) formData.append('department', selectedDepartment);
        if (selectedSession) formData.append('session', selectedSession);
        formData.append('file', selectedFile);
        if (youtubeUrl.trim()) formData.append('youtube_url', youtubeUrl.trim());

        await institutionApi.uploadLearningResourceFile(formData, authToken || undefined);
      } else {
        await institutionApi.createLearningResource(
          {
            institution: institutionId,
            title: title.trim(),
            description: description.trim(),
            resource_type: resourceType,
            youtube_url: youtubeUrl.trim(),
            division: selectedDivision || undefined,
            department: selectedDepartment || undefined,
            session: selectedSession || undefined,
            is_published: true,
          },
          authToken || undefined
        );
      }
      await onSuccess();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save learning resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: '15px' } } }}
    >
      <DialogTitle
        sx={{
          p: 3,
          pb: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <div className="flex items-start gap-2">
          <SmartDisplayIcon sx={{ fontSize: 22, color: 'primary.main', mt: 0.5 }} />
          <div>
            <p className="text-base font-bold text-charcoal">Publish Learning Resource</p>
            <p className="mt-0.5 text-sm text-charcoal-faint">
              Add a YouTube video, workshop recording, or upload a handout for students
            </p>
          </div>
        </div>
        <IconButton size="medium" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            fullWidth
            size="medium"
            select
            label="Resource Type"
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value as LearningResourceType);
              setSelectedFile(null);
            }}
          >
            {resourceTypes.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label} — {t.hint}
              </MenuItem>
            ))}
          </TextField>

          {needsYoutube && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-[15px] border-2 border-dashed border-border-strong bg-bgsoft px-6 py-6 text-center">
              <VideoLibraryIcon sx={{ fontSize: 30, color: youtubeUrl ? 'primary.main' : 'charcoal.faint' }} />
              <TextField
                fullWidth
                size="medium"
                label="YouTube Video Link"
                required={resourceType === 'VIDEO'}
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                sx={{ maxWidth: 480 }}
              />
              <p className="text-xs text-charcoal-faint">
                The video player and thumbnail are generated automatically from this link
              </p>
            </div>
          )}

          {needsFile && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-[15px] border-2 border-dashed px-6 py-8 text-center transition-colors ${
                dragOver ? 'border-primary bg-primary-soft' : 'border-border-strong bg-bgsoft'
              }`}
            >
              <input
                type="file"
                id="learning-file-input"
                accept=".pdf,.docx,.ppt,.pptx,.txt,.md"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="learning-file-input" className="flex cursor-pointer flex-col items-center gap-2">
                <UploadFileIcon sx={{ fontSize: 32, color: selectedFile ? 'primary.main' : 'charcoal.faint' }} />
                {selectedFile ? (
                  <>
                    <span className="text-sm font-bold text-charcoal">{selectedFile.name}</span>
                    <span className="text-xs text-charcoal-faint">
                      ({(selectedFile.size / 1024).toFixed(1)} KB) · Click or drag to change
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-bold text-charcoal">
                      Click to browse or drag and drop document
                    </span>
                    <span className="text-xs text-charcoal-faint">PDF, Word, PowerPoint, or Text</span>
                  </>
                )}
              </label>
            </div>
          )}

          <TextField
            fullWidth
            size="medium"
            label="Resource Title"
            required
            placeholder="e.g. SIWES Orientation Workshop Recording"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <TextField
            fullWidth
            size="medium"
            label="Short Description (optional)"
            placeholder="What will students learn from this resource?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              fullWidth
              size="medium"
              select
              label="Scope: Faculty / School"
              value={selectedDivision}
              onChange={(e) => {
                setSelectedDivision(e.target.value);
                setSelectedDepartment('');
              }}
            >
              <MenuItem value="">Institution-Wide (All Units)</MenuItem>
              {tree?.divisions.map((div) => (
                <MenuItem key={div.id} value={div.id}>
                  {div.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="medium"
              select
              label="Scope: Department"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedDivision}
            >
              <MenuItem value="">All Departments in Unit</MenuItem>
              {availableDepts.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              size="medium"
              select
              label="Academic Session"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              {sessions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.session_label} {s.is_current ? '(Current)' : ''}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
              sx={{ color: 'charcoal.soft', borderColor: 'border.strong' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={<DescriptionIcon />}
            >
              {isSubmitting ? 'Publishing…' : 'Publish Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};