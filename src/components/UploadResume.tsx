import { ModernResumeUpload } from './ModernResumeUpload';

interface UploadResumeProps {
  onUploadComplete?: () => void;
}

export const UploadResume = ({ onUploadComplete }: UploadResumeProps) => {
  return (
    <ModernResumeUpload 
      onUploadComplete={onUploadComplete}
      mode="single"
    />
  );
};