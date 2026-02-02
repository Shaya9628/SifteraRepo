import { ModernResumeUpload } from './ModernResumeUpload';

interface BulkUploadResumeProps {
  onUploadComplete?: () => void;
}

export const BulkUploadResume = ({ onUploadComplete }: BulkUploadResumeProps) => {
  return (
    <ModernResumeUpload 
      onUploadComplete={onUploadComplete}
      mode="bulk"
    />
  );
};