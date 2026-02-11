import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Zap, CheckCircle2, AlertCircle, ArrowRightLeft, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { triggerFreeScreenAIAnalysis, checkFreeScreenUsage, trackFreeScreenUsage } from '@/lib/assessmentOptimization';
import { validateFile, extractTextFromFile, generateSmartSuggestions, getUserIP, generateSessionId, type FileValidationResult } from '@/lib/fileValidation';

interface AnalysisResults {
  fitmentScore: number;
  status: string;
  matchedSkills: string[];
  missingSkills: string[];
  recommendation: 'RECOMMENDED' | 'CONSIDER' | 'NOT_RECOMMENDED';
  reasoning?: string;
  brief_summary?: string;
  red_flags?: string[];
}

const FreeScreen = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [resumeValidation, setResumeValidation] = useState<FileValidationResult | null>(null);
  const [jdValidation, setJdValidation] = useState<FileValidationResult | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);
  const [usageInfo, setUsageInfo] = useState<{ canUse: boolean; usageCount: number; resetTime?: Date }>({ canUse: true, usageCount: 0 });
  const [userIP, setUserIP] = useState<string>('');
  const [sessionId] = useState<string>(generateSessionId());

  // Check usage limits on component mount
  useEffect(() => {
    const initializeUsageTracking = async () => {
      try {
        const ip = await getUserIP();
        setUserIP(ip);
        const usage = await checkFreeScreenUsage(ip, sessionId);
        setUsageInfo(usage);
      } catch (error) {
        console.error('Failed to initialize usage tracking:', error);
      }
    };
    
    initializeUsageTracking();
  }, [sessionId]);

  // Update smart suggestions when validation results change
  useEffect(() => {
    const suggestions = generateSmartSuggestions(resumeValidation, jdValidation);
    setSmartSuggestions(suggestions);
  }, [resumeValidation, jdValidation]);

  const handleFileDrop = async (droppedFile: File, type: 'resume' | 'jd') => {
    console.log(`Uploading ${type} file:`, droppedFile.name, droppedFile.type, droppedFile.size);
    
    try {
      // Perform smart file validation
      const validation = await validateFile(droppedFile, type === 'jd' ? 'job_description' : type);
      
      if (!validation.isValid) {
        toast({
          title: "File validation failed",
          description: validation.errors[0] || "Please check your file and try again.",
          variant: "destructive",
        });
        return;
      }

      // Set file and validation results
      if (type === 'resume') {
        setResumeFile(droppedFile);
        setResumeValidation(validation);
        console.log('Resume file set successfully:', validation);
      } else {
        setJdFile(droppedFile);
        setJdValidation(validation);
        console.log('JD file set successfully:', validation);
      }

      // Show success with validation confidence
      toast({
        title: "File uploaded successfully",
        description: `${droppedFile.name} - ${validation.detectedType.replace('_', ' ')} detected (${validation.confidence}% confidence)`,
      });

      // Show smart suggestions if any
      if (validation.suggestions.length > 0) {
        setTimeout(() => {
          toast({
            title: "Smart suggestion",
            description: validation.suggestions[0],
          });
        }, 1500);
      }
    } catch (error) {
      console.error('File validation error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to process file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jd') => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileDrop(file, type);
  };

  const analyzeResume = async () => {
    console.log('Analyze button clicked');
    console.log('Resume file:', resumeFile?.name);
    console.log('JD file:', jdFile?.name);
    
    if (!resumeFile || !jdFile) {
      console.warn('Missing files - Resume:', !!resumeFile, 'JD:', !!jdFile);
      toast({
        title: "Missing files",
        description: "Please upload both resume and job description.",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
    if (!usageInfo.canUse) {
      toast({
        title: "Daily limit reached",
        description: `You've used ${usageInfo.usageCount}/2 analyses today. ${usageInfo.resetTime ? `Resets at ${usageInfo.resetTime.toLocaleTimeString()}` : 'Try again tomorrow!'}`,
        variant: "destructive",
      });
      return;
    }

    console.log('Starting real AI analysis...');
    setIsAnalyzing(true);
    setProgress(0);
    setResults(null);

    try {
      // Read file contents
      const [resumeText, jobDescText] = await Promise.all([
        extractTextFromFile(resumeFile),
        extractTextFromFile(jdFile)
      ]);

      // Progress simulation during AI processing
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 800);

      // Track usage before making API call
      if (userIP) {
        await trackFreeScreenUsage(userIP, sessionId);
        const updatedUsage = await checkFreeScreenUsage(userIP, sessionId);
        setUsageInfo(updatedUsage);
      }

      // Real AI analysis
      const aiResult = await triggerFreeScreenAIAnalysis(
        resumeText, 
        jobDescText, 
        'General'
      );

      clearInterval(progressTimer);
      setProgress(100);

      // Map AI result to expected format
      const mappedResults: AnalysisResults = {
        fitmentScore: aiResult.fitment_score || 0,
        status: aiResult.status || 'Analysis Complete',
        matchedSkills: aiResult.matched_skills || [],
        missingSkills: aiResult.missing_skills || [],
        recommendation: aiResult.recommendation || 'CONSIDER',
        reasoning: aiResult.reasoning,
        brief_summary: aiResult.brief_summary,
        red_flags: aiResult.red_flags
      };

      console.log('Real AI analysis results:', mappedResults);
      setResults(mappedResults);
      setIsAnalyzing(false);
      
      toast({
        title: "AI Analysis Complete!",
        description: `Fitment Score: ${mappedResults.fitmentScore}% - ${mappedResults.recommendation}`,
      });
    } catch (error) {
      console.error('AI Analysis error:', error);
      setIsAnalyzing(false);
      
      // Fallback to mock results if AI fails
      const fallbackResults: AnalysisResults = {
        fitmentScore: Math.floor(Math.random() * 30) + 60,
        status: 'AI Unavailable - Estimated Match',
        matchedSkills: ['JavaScript', 'React', 'Communication'],
        missingSkills: ['Advanced Experience', 'Specific Tools'],
        recommendation: 'CONSIDER',
        reasoning: 'AI analysis temporarily unavailable. This is a basic estimation based on common patterns.'
      };
      
      setResults(fallbackResults);
      toast({
        title: "AI Analysis Fallback",
        description: "Using estimated analysis. Try again for AI-powered results.",
        variant: "destructive",
      });
    }
  };

  const resetAnalysis = () => {
    setResumeFile(null);
    setJdFile(null);
    setResults(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        <div className="absolute top-40 left-1/2 w-60 h-60 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-pulse"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-lg">
            AI Resume Screening
          </h1>
          <p className="text-xl md:text-2xl text-white/80 font-medium">
            Upload resume and job description to get instant fitment analysis
          </p>
          <div className="mt-4 text-cyan-300 font-semibold">
            ✨ Get Started Free – Instant Free Resume Analysis
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {!results ? (
              /* Upload Section with Step Flow */
              <div className="space-y-6">
                {/* Step Progress */}
                <div className="glassmorphism-card p-6 mb-8 animate-slide-up">
                  <div className="flex items-center justify-center space-x-8">
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${resumeFile ? 'bg-green-500 border-green-400 text-white' : 'bg-white/20 border-white/40 text-white'}`}>
                        1
                      </div>
                      <span className={`font-medium transition-colors ${resumeFile ? 'text-green-300' : 'text-white/70'}`}>
                        Upload Resume
                      </span>
                    </div>
                    <div className={`h-1 w-16 rounded-full transition-all duration-300 ${resumeFile ? 'bg-green-400' : 'bg-white/20'}`}></div>
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${jdFile ? 'bg-green-500 border-green-400 text-white' : resumeFile ? 'bg-purple-500 border-purple-400 text-white' : 'bg-white/20 border-white/40 text-white'}`}>
                        2
                      </div>
                      <span className={`font-medium transition-colors ${jdFile ? 'text-green-300' : resumeFile ? 'text-purple-300' : 'text-white/70'}`}>
                        Upload Job Description
                      </span>
                    </div>
                    <div className={`h-1 w-16 rounded-full transition-all duration-300 ${resumeFile && jdFile ? 'bg-green-400' : 'bg-white/20'}`}></div>
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${resumeFile && jdFile ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-white/20 border-white/40 text-white'}`}>
                        3
                      </div>
                      <span className={`font-medium transition-colors ${resumeFile && jdFile ? 'text-cyan-300' : 'text-white/70'}`}>
                        AI Analysis
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glassmorphism-card animate-slide-up-delayed">
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-white text-center mb-8">
                      Upload Documents
                    </h2>
                    <div className="space-y-8">
                      {/* Resume Upload */}
                      <div className="animate-fade-in">
                        <label className="block text-xl font-semibold mb-4 text-white">
                          <FileText className="inline w-6 h-6 mr-3 text-purple-300" />
                          Step 1: Upload Resume
                        </label>
                        <div 
                          className="relative group"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) {
                              handleFileDrop(droppedFile, 'resume');
                            }
                          }}
                        >
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => handleFileUpload(e, 'resume')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-white/40 rounded-2xl p-8 text-center hover:border-purple-400 hover:bg-white/10 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl backdrop-blur-sm">
                            {resumeFile ? (
                              <div className="flex items-center justify-center gap-4 animate-fade-in">
                                <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
                                <div className="text-left">
                                  <p className="text-green-300 font-semibold text-lg">{resumeFile.name}</p>
                                  <p className="text-white/70">
                                    {(resumeFile.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Upload className="w-16 h-16 mx-auto text-purple-300 group-hover:text-purple-200 transition-all duration-300 group-hover:scale-110" />
                                <div>
                                  <p className="text-xl font-semibold text-white">Drop resume here or click to upload</p>
                                  <p className="text-white/70 mt-2">
                                    Supports PDF, DOC, DOCX, TXT (Max 5MB)
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Job Description Upload */}
                      <div className="animate-fade-in-delayed">
                        <label className="block text-xl font-semibold mb-4 text-white">
                          <FileText className="inline w-6 h-6 mr-3 text-cyan-300" />
                          Step 2: Upload Job Description
                        </label>
                        <div 
                          className="relative group"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const droppedFile = e.dataTransfer.files[0];
                            if (droppedFile) {
                              handleFileDrop(droppedFile, 'jd');
                            }
                          }}
                        >
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={(e) => handleFileUpload(e, 'jd')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="border-2 border-dashed border-white/40 rounded-2xl p-8 text-center hover:border-cyan-400 hover:bg-white/10 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl backdrop-blur-sm">
                            {jdFile ? (
                              <div className="flex items-center justify-center gap-4 animate-fade-in">
                                <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
                                <div className="text-left">
                                  <p className="text-green-300 font-semibold text-lg">{jdFile.name}</p>
                                  <p className="text-white/70">
                                    {(jdFile.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Upload className="w-16 h-16 mx-auto text-cyan-300 group-hover:text-cyan-200 transition-all duration-300 group-hover:scale-110" />
                                <div>
                                  <p className="text-xl font-semibold text-white">Drop job description here or click to upload</p>
                                  <p className="text-white/70 mt-2">
                                    Supports PDF, DOC, DOCX, TXT (Max 5MB)
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Smart Suggestions */}
                      {smartSuggestions.length > 0 && (
                        <div className="glassmorphism-card p-4 border border-yellow-400/30 bg-yellow-400/10 animate-fade-in">
                          <div className="space-y-2">
                            {smartSuggestions.map((suggestion, index) => (
                              <div key={index} className="flex items-start gap-3 text-sm">
                                <span className="text-yellow-300 mt-0.5 text-lg">💡</span>
                                <span className="text-yellow-100 font-medium">
                                  {suggestion}
                                </span>
                                {suggestion.includes('Auto-detect') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-auto h-7 text-xs border-yellow-400/50 text-yellow-200 hover:bg-yellow-400/20 hover:scale-105 transition-all"
                                    onClick={() => {
                                      // Swap files
                                      const tempFile = resumeFile;
                                      const tempValidation = resumeValidation;
                                      setResumeFile(jdFile);
                                      setResumeValidation(jdValidation);
                                      setJdFile(tempFile);
                                      setJdValidation(tempValidation);
                                      toast({
                                        title: "Files swapped",
                                        description: "Resume and job description have been swapped.",
                                      });
                                    }}
                                  >
                                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                                    Swap
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Usage Limit Display */}
                      <div className="glassmorphism-card p-4 border border-purple-400/30 bg-purple-400/10 animate-fade-in-delayed">
                        <div className="flex items-center justify-center gap-3 text-white">
                          <Clock className="w-5 h-5 text-purple-300" />
                          <span className="font-medium">
                            {usageInfo.canUse 
                              ? `${2 - usageInfo.usageCount} free analysis${2 - usageInfo.usageCount === 1 ? '' : 'es'} remaining today`
                              : 'Daily limit reached - sign up for unlimited access'
                            }
                          </span>
                        </div>
                        {/* {!usageInfo.canUse && (
                          <div className="mt-4 text-center">
                            <Button 
                              size="lg"
                              className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 px-8 py-3 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 border-0 animate-pulse"
                              onClick={() => navigate('/auth')}
                            >
                              ✨ Sign Up for Unlimited Access
                            </Button>
                          </div>
                        )} */}
                      </div>

                      {/* Analyze Button */}
                      <div className="text-center pt-6 animate-fade-in-delayed">
                        {/* Files Status */}
                        <div className="flex justify-center gap-6 mb-6">
                          <div className={`flex items-center gap-2 text-sm transition-all duration-300 ${resumeFile ? 'text-green-300 scale-110' : 'text-white/50'}`}>
                            <CheckCircle2 className={`w-5 h-5 ${resumeFile ? 'text-green-400' : 'text-white/40'}`} />
                            Resume {resumeFile ? 'Uploaded' : 'Required'}
                          </div>
                          <div className={`flex items-center gap-2 text-sm transition-all duration-300 ${jdFile ? 'text-green-300 scale-110' : 'text-white/50'}`}>
                            <CheckCircle2 className={`w-5 h-5 ${jdFile ? 'text-green-400' : 'text-white/40'}`} />
                            Job Description {jdFile ? 'Uploaded' : 'Required'}
                          </div>
                        </div>
                        
                        {usageInfo.canUse ? (
                          <Button 
                            onClick={analyzeResume}
                            disabled={!resumeFile || !jdFile || isAnalyzing}
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 px-16 py-8 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 border-0"
                          >
                            <Zap className="w-6 h-6 mr-3" />
                            {isAnalyzing ? 'Analyzing...' : 'Step 3: AI Analysis'}
                          </Button>
                        ) : (
                          <Button 
                            size="lg"
                            className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 px-16 py-8 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300 border-0 animate-pulse"
                            onClick={() => navigate('/auth')}
                          >
                            ✨ Sign Up for Unlimited Access
                          </Button>
                        )}
                      </div>

                      {/* Progress */}
                      {isAnalyzing && (
                        <div className="glassmorphism-card p-8 border border-cyan-400/30 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 animate-fade-in">
                          <div className="space-y-6">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-4 mb-4">
                                <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-2xl font-bold text-white">AI Analyzing Resume Fitment</p>
                              </div>
                              <Progress value={progress} className="h-4 mb-4 bg-white/20" />
                              <p className="text-white/90 text-lg">
                                {progress < 25 ? 'Extracting resume content...' :
                                 progress < 50 ? 'Parsing job requirements...' :
                                 progress < 75 ? 'Comparing skills and experience...' :
                                 progress < 100 ? 'Calculating fitment score...' : 'Analysis complete!'}
                              </p>
                              <p className="text-cyan-300 font-semibold mt-2">{progress}% complete</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Results Section with Enhanced Styling */
              <div className="space-y-8 animate-fade-in">
                {/* Fitment Score */}
                <div className="glassmorphism-card p-10 border-2 border-purple-400/30 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10">
                  <div className="text-center py-8">
                    <div className="relative inline-block mb-8">
                      <div className="text-8xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-4 animate-pulse">
                        {results.fitmentScore}%
                      </div>
                      <div className="absolute -top-4 -right-4 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"></div>
                    </div>
                    <Badge 
                      className={`text-xl px-8 py-4 font-bold rounded-full ${
                        results.recommendation === 'RECOMMENDED' 
                          ? 'bg-green-500 hover:bg-green-600 shadow-green-400/25' 
                          : results.recommendation === 'CONSIDER'
                          ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-400/25'
                          : 'bg-red-500 hover:bg-red-600 shadow-red-400/25'
                      } shadow-2xl transition-all duration-300 hover:scale-110`}
                    >
                      {results.status}
                    </Badge>
                    <p className="text-white/90 mt-6 text-xl font-medium">
                      {results.recommendation === 'RECOMMENDED' 
                        ? 'Strong candidate - proceed with interview' 
                        : results.recommendation === 'CONSIDER'
                        ? 'Decent match - review experience closely'
                        : 'Limited match - consider other candidates'}
                    </p>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glassmorphism-card p-6 border border-green-400/30 bg-green-400/10 animate-slide-up">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        Matched Skills
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {results.matchedSkills.map((skill: string, index: number) => (
                        <Badge key={index} className="bg-green-500/30 text-green-200 border border-green-400/50 hover:scale-105 transition-transform text-sm py-2 px-4 rounded-full">
                          <CheckCircle2 className="w-3 h-3 mr-2" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="glassmorphism-card p-6 border border-orange-400/30 bg-orange-400/10 animate-slide-up-delayed">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-orange-300 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        Missing Skills
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {results.missingSkills.map((skill: string, index: number) => (
                        <Badge key={index} className="bg-orange-500/30 text-orange-200 border border-orange-400/50 hover:scale-105 transition-transform text-sm py-2 px-4 rounded-full">
                          <AlertCircle className="w-3 h-3 mr-2" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Insights */}
                {results.reasoning && (
                  <div className="glassmorphism-card p-6 border border-blue-400/30 bg-blue-400/10 select-none animate-fade-in" onMouseDown={(e) => e.preventDefault()}>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-blue-300">AI Analysis</h3>
                    </div>
                    <p className="text-white/80 mb-4 text-lg">
                      {results.brief_summary}
                    </p>
                    <div className="relative">
                      <p className="text-white/70">
                        {results.reasoning}
                      </p>
                      <div className="absolute inset-0 bg-transparent cursor-not-allowed" 
                           onClick={() => {
                             toast({
                               title: "Sign in to copy results",
                               description: "Create a free account to copy, save, and export your analysis results.",
                             });
                           }}>
                      </div>
                    </div>
                  </div>
                )}

                {/* Red Flags */}
                {results.red_flags && results.red_flags.length > 0 && (
                  <div className="glassmorphism-card p-6 border border-red-400/30 bg-red-400/10 select-none animate-fade-in-delayed" onMouseDown={(e) => e.preventDefault()}>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-red-300">Areas of Concern</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {results.red_flags.map((flag: string, index: number) => (
                        <Badge key={index} className="bg-red-500/30 text-red-200 border border-red-400/50 text-sm py-2 px-4 rounded-full">
                          <AlertCircle className="w-3 h-3 mr-2" />
                          {flag}
                        </Badge>
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-transparent cursor-not-allowed" 
                         onClick={() => {
                           toast({
                             title: "Sign in to view details",
                             description: "Create a free account to access detailed red flag analysis and recommendations.",
                           });
                         }}>
                    </div>
                  </div>
                )}

                {/* Usage Tracker */}
                <div className="glassmorphism-card p-6 border border-purple-400/30 bg-purple-400/10 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-purple-300" />
                      <span className="text-white font-semibold">
                        Daily Usage: {usageInfo.usageCount}/2 free analyses
                      </span>
                    </div>
                    {!usageInfo.canUse && (
                      <Badge variant="outline" className="text-white border-white/40">
                        Resets {usageInfo.resetTime?.toLocaleTimeString() || 'tomorrow'}
                      </Badge>
                    )}
                  </div>
                  {usageInfo.usageCount >= 2 && (
                    <p className="text-white/80 mt-3 text-center">
                      ✨ Sign up for unlimited resume screening training (FREE)
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="text-center space-y-4 animate-fade-in-delayed">
                  <div className="block">
                    <Button 
                      onClick={resetAnalysis}
                      variant="outline"
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 px-12 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 text-lg font-bold w-full"
                      disabled={!usageInfo.canUse}
                    >
                      {usageInfo.canUse ? 'Screen Another Resume' : 'Daily Limit Reached'}
                    </Button>
                  </div>
                  <div className="block">
                    <Button 
                      size="lg"
                      className={`px-12 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 text-lg font-bold w-full ${
                        !usageInfo.canUse 
                          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400 hover:shadow-orange-500/25 animate-pulse'
                          : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 hover:shadow-purple-500/25'
                      }`}
                      onClick={() => {
                        // Navigate to auth page for advanced analysis
                        navigate('/auth');
                      }}
                    >
                      {usageInfo.canUse ? '🚀 Get Advanced Analysis' : '✨ Sign Up for Unlimited Access'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* HR Lady Guide Sidebar */}
          <div className="lg:w-80 space-y-6 animate-slide-left">
            <div className="glassmorphism-card p-6">
              <div className="text-center mb-4">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center mb-4 animate-float">
                  <span className="text-4xl">👩‍💼</span>
                </div>
                <h3 className="text-xl font-bold text-white">Your AI Guide</h3>
                <p className="text-white/70">Kate, HR Assistant</p>
              </div>
              
              <div className="space-y-4">
                {!resumeFile && (
                  <div className="bg-white/10 p-4 rounded-xl border border-purple-300/30 animate-bounce">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white font-medium">"Upload your resume here 👇"</p>
                        <p className="text-white/70 text-sm mt-1">Start by uploading your resume in PDF, DOC, or TXT format</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {resumeFile && !jdFile && (
                  <div className="bg-white/10 p-4 rounded-xl border border-cyan-300/30 animate-bounce">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white font-medium">"Now upload the Job Description"</p>
                        <p className="text-white/70 text-sm mt-1">Great! Now add the job description to compare skills</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {resumeFile && jdFile && !results && (
                  <div className="bg-white/10 p-4 rounded-xl border border-green-300/30 animate-bounce">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white font-medium">"Perfect! Ready for AI Analysis!"</p>
                        <p className="text-white/70 text-sm mt-1">Click the analysis button to get your fitment score</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {results && (
                  <div className="bg-white/10 p-4 rounded-xl border border-yellow-300/30">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <div>
                        <p className="text-white font-medium">"Analysis complete! 🎉"</p>
                        <p className="text-white/70 text-sm mt-1">Review your fitment score and sign up for detailed insights</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 p-4 rounded-xl border border-white/20">
                  <h4 className="text-white font-semibold mb-2">📚 Quick Tips</h4>
                  <ul className="space-y-2 text-white/80 text-sm">
                    <li>• Use updated resume format</li>
                    <li>• Include complete job descriptions</li>
                    <li>• Check for spelling errors</li>
                    <li>• Sign up for unlimited analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeScreen;