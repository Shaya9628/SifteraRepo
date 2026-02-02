# Resume Upload System - Modernized

## Overview
The resume upload system has been modernized with a new drag-and-drop interface that provides a better user experience and more reliable uploads.

## Features

### 🎯 Modern UI/UX
- **Drag & Drop**: Simply drag files onto the upload area or click to browse
- **Progress Tracking**: Real-time upload progress for individual files and overall progress
- **Visual Feedback**: Clear status indicators (pending, uploading, success, error)
- **File Validation**: Automatic validation with helpful error messages

### 📂 File Management
- **Multi-file Support**: Bulk upload mode supports multiple files
- **Single File Mode**: Dedicated single file upload for simple uploads
- **File Type Validation**: Only PDF, DOC, and DOCX files allowed
- **Size Limits**: Maximum 10MB per file with clear size display
- **Duplicate Detection**: Prevents uploading the same file twice

### 🏢 Comprehensive Metadata
- **User Assignment**: Associate resumes with specific users
- **Department Selection**: Sales, Marketing, Engineering, Customer Support, HR, Finance, Other
- **Domain Classification**: Sales or CRM domains
- **Pool Resume Option**: Mark resumes for the "Other Resume" rotation system
- **Candidate Name Extraction**: Automatically extracts candidate names from filenames

### 🔄 Enhanced Reliability
- **Sequential Uploads**: Files uploaded one at a time to prevent server overload
- **Error Handling**: Detailed error messages with retry capability
- **Cleanup on Failure**: Automatically removes orphaned files if database insert fails
- **Validation**: Comprehensive validation at multiple levels

### 🎛️ Admin Controls
- **Default Settings**: Set default values for new uploads to speed up bulk operations
- **User Management Integration**: Seamless integration with user management system
- **Progress Monitoring**: Track upload progress with detailed feedback

## Components

### ModernResumeUpload
The main upload component that handles both single and bulk uploads:
- `mode`: 'single' or 'bulk' to control behavior
- `onUploadComplete`: Callback when uploads are finished

### UploadResume
Simplified wrapper for single file uploads:
```tsx
<UploadResume onUploadComplete={() => {}} />
```

### BulkUploadResume
Simplified wrapper for bulk uploads:
```tsx
<BulkUploadResume onUploadComplete={() => {}} />
```

## Database Integration

The system integrates with the `resumes` table with the following fields:
- `user_id`: Reference to the user the resume is assigned to
- `candidate_name`: Name of the candidate
- `department`: Candidate's department
- `domain`: Sales or CRM domain classification
- `file_path`: Storage path for the uploaded file
- `is_pool_resume`: Whether the resume is available for rotation

## Storage
Files are stored in the Supabase storage bucket `resumes` with the following structure:
```
resumes/
  {user_id}/
    {sanitized_filename}_{timestamp}.{extension}
```

## Usage in Admin Dashboard

The components are integrated into the Admin Dashboard under the "Resume Management" tab:
- Single upload for individual resumes
- Bulk upload for multiple resumes
- Resume list showing all uploaded resumes

## Error Handling

The system provides comprehensive error handling for:
- Invalid file types (only PDF, DOC, DOCX allowed)
- File size limits (10MB maximum)
- Missing required fields
- Storage upload failures
- Database insertion errors
- Network connectivity issues

## Migration from Old System

The old upload components have been backed up as:
- `UploadResumeOld.tsx`
- `BulkUploadResumeOld.tsx`

The new system maintains full compatibility with existing database schema and business logic while providing a significantly improved user experience.

## Benefits

1. **Better UX**: Drag-and-drop interface is intuitive and modern
2. **Reliability**: Improved error handling and validation prevents failed uploads
3. **Performance**: Sequential uploads prevent server overload
4. **Maintainability**: Consolidated logic in a single reusable component
5. **Flexibility**: Supports both single and bulk upload scenarios
6. **User-Friendly**: Clear progress indicators and status messages