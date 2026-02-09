// Smart file validation utilities for FreeScreen component
export interface FileValidationResult {
  isValid: boolean;
  detectedType: 'resume' | 'job_description' | 'other';
  confidence: number; // 0-100
  suggestions: string[];
  errors: string[];
}

// Keywords that typically appear in resumes
const RESUME_KEYWORDS = [
  'experience', 'education', 'skills', 'work history', 'employment',
  'objective', 'summary', 'qualifications', 'achievements', 'projects',
  'certifications', 'languages', 'references', 'phone', 'email',
  'linkedin', 'github', 'portfolio', 'degree', 'university', 'college',
  'internship', 'volunteer', 'awards', 'publications'
];

// Keywords that typically appear in job descriptions
const JOB_DESCRIPTION_KEYWORDS = [
  'responsibilities', 'requirements', 'qualifications', 'company',
  'position', 'role', 'duties', 'benefits', 'salary', 'location',
  'remote', 'full-time', 'part-time', 'contract', 'we are looking for',
  'the ideal candidate', 'join our team', 'apply', 'about us',
  'job description', 'minimum requirements', 'preferred qualifications',
  'equal opportunity', 'competitive salary'
];

// Extract text content from PDF using pdfjs-dist
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source to use CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }
    
    const fullText = textParts.join('\n\n');
    console.log(`PDF extracted: ${pdf.numPages} pages, ${fullText.length} chars`);
    
    if (fullText.trim().length < 20) {
      console.warn('PDF text extraction yielded very little text - file may be image-based');
      return `[PDF with minimal extractable text - ${pdf.numPages} pages] ${fullText}`.trim();
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error('Failed to extract text from PDF. Please try uploading a text-based PDF or a .txt/.docx file.');
  }
};

// Extract text content from various file types
export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }
  
  // For text-based files (.txt, .doc, .docx)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        if (!result || result.trim().length < 10) {
          reject(new Error('File appears to be empty or unreadable. Try a different format.'));
          return;
        }
        resolve(result);
      } catch (error) {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsText(file);
  });
};

// Analyze text content to determine file type
export const analyzeFileContent = (content: string, filename: string): FileValidationResult => {
  const normalizedContent = content.toLowerCase();
  const normalizedFilename = filename.toLowerCase();
  
  let resumeScore = 0;
  let jobDescScore = 0;
  
  // Check content for resume keywords
  RESUME_KEYWORDS.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      resumeScore += 1;
    }
  });
  
  // Check content for job description keywords
  JOB_DESCRIPTION_KEYWORDS.forEach(keyword => {
    if (normalizedContent.includes(keyword)) {
      jobDescScore += 1;
    }
  });
  
  // Filename analysis
  if (normalizedFilename.includes('resume') || normalizedFilename.includes('cv')) {
    resumeScore += 5;
  }
  
  if (normalizedFilename.includes('job') || normalizedFilename.includes('position') || 
      normalizedFilename.includes('role') || normalizedFilename.includes('description')) {
    jobDescScore += 5;
  }
  
  // Additional heuristics
  const hasPersonalInfo = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content);
  if (hasPersonalInfo) {
    resumeScore += 3;
  }
  
  const hasCompanyInfo = normalizedContent.includes('company') && normalizedContent.includes('about us');
  if (hasCompanyInfo) {
    jobDescScore += 3;
  }
  
  // Determine result
  const totalScore = resumeScore + jobDescScore;
  const resumeConfidence = totalScore > 0 ? Math.round((resumeScore / totalScore) * 100) : 0;
  const jobConfidence = totalScore > 0 ? Math.round((jobDescScore / totalScore) * 100) : 0;
  
  let detectedType: 'resume' | 'job_description' | 'other';
  let confidence: number;
  let suggestions: string[] = [];
  let errors: string[] = [];
  
  if (resumeScore > jobDescScore && resumeScore >= 3) {
    detectedType = 'resume';
    confidence = resumeConfidence;
    if (resumeConfidence < 70) {
      suggestions.push('This might be a resume, but please verify it contains your work experience and contact information.');
    }
  } else if (jobDescScore > resumeScore && jobDescScore >= 3) {
    detectedType = 'job_description';
    confidence = jobConfidence;
    if (jobConfidence < 70) {
      suggestions.push('This appears to be a job description, but please ensure it contains role requirements and responsibilities.');
    }
  } else {
    detectedType = 'other';
    confidence = 0;
    errors.push('Unable to determine if this is a resume or job description. Please check the file content.');
    suggestions.push('Resume files should contain work experience, education, and contact information.');
    suggestions.push('Job description files should contain role responsibilities, requirements, and company information.');
  }
  
  return {
    isValid: confidence >= 50,
    detectedType,
    confidence,
    suggestions,
    errors
  };
};

// Validate file before upload
export const validateFile = async (file: File, expectedType: 'resume' | 'job_description'): Promise<FileValidationResult> => {
  try {
    // Basic file validation
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('File size exceeds 5MB limit');
    }
    
    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      errors.push('Please upload PDF, Word document, or text file');
      suggestions.push('Supported formats: .pdf, .doc, .docx, .txt');
    }
    
    if (errors.length > 0) {
      return {
        isValid: false,
        detectedType: 'other',
        confidence: 0,
        suggestions,
        errors
      };
    }
    
    // Extract and analyze content
    const content = await extractTextFromFile(file);
    const analysis = analyzeFileContent(content, file.name);
    
    // Check if detected type matches expected type
    if (analysis.detectedType !== expectedType && analysis.confidence > 60) {
      const opposite = expectedType === 'resume' ? 'job description' : 'resume';
      suggestions.push(`This looks like a ${analysis.detectedType.replace('_', ' ')}, but you're uploading to the ${expectedType.replace('_', ' ')} slot. Would you like to swap files?`);
    }
    
    return analysis;
  } catch (error) {
    return {
      isValid: false,
      detectedType: 'other',
      confidence: 0,
      suggestions: ['Please try uploading a different file format'],
      errors: [`File validation error: ${error.message}`]
    };
  }
};

// Generate smart suggestions based on validation results
export const generateSmartSuggestions = (
  resumeValidation: FileValidationResult | null,
  jdValidation: FileValidationResult | null
): string[] => {
  const suggestions: string[] = [];
  
  if (!resumeValidation && !jdValidation) {
    return ['Please upload both a resume and job description to get started.'];
  }
  
  if (resumeValidation && resumeValidation.detectedType === 'job_description') {
    suggestions.push('💡 Auto-detect: Your resume upload looks like a job description. Click to swap files?');
  }
  
  if (jdValidation && jdValidation.detectedType === 'resume') {
    suggestions.push('💡 Auto-detect: Your job description upload looks like a resume. Click to swap files?');
  }
  
  if (resumeValidation && !resumeValidation.isValid) {
    suggestions.push('⚠️ Resume file needs improvement: ' + resumeValidation.errors.join(', '));
  }
  
  if (jdValidation && !jdValidation.isValid) {
    suggestions.push('⚠️ Job description file needs improvement: ' + jdValidation.errors.join(', '));
  }
  
  return suggestions;
};

// Get user IP address (for usage tracking)
export const getUserIP = async (): Promise<string> => {
  try {
    // Fallback IP for development/testing
    return 'development-ip';
    
    // Real IP fetching (commented out for reliability)
    // const response = await fetch('https://api.ipify.org?format=json');
    // const data = await response.json();
    // return data.ip || 'unknown';
  } catch (error) {
    console.error('Failed to get IP address:', error);
    return 'unknown';
  }
};

// Generate session ID for tracking
export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};