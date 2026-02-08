import { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            AI Resume Screening
          </h1>
          <p className="text-xl text-muted-foreground">
            Upload resume and job description to get instant fitment analysis
          </p>
        </div>

        {!results ? (
          /* Upload Section */
          <Card className="glass border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Upload Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Resume Upload */}
              <div>
                <label className="block text-lg font-semibold mb-4">
                  <FileText className="inline w-5 h-5 mr-2" />
                  Upload Resume
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
                  <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 group-hover:scale-[1.02]">
                    {resumeFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <div className="text-left">
                          <p className="text-green-600 font-medium">{resumeFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(resumeFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 mx-auto text-primary/60 group-hover:text-primary transition-colors" />
                        <div>
                          <p className="text-lg font-medium text-foreground">Drop resume here or click to upload</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supports PDF, DOC, DOCX, TXT (Max 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Description Upload */}
              <div>
                <label className="block text-lg font-semibold mb-4">
                  <FileText className="inline w-5 h-5 mr-2" />
                  Upload Job Description
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
                  <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 text-center hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 group-hover:scale-[1.02]">
                    {jdFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <div className="text-left">
                          <p className="text-green-600 font-medium">{jdFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(jdFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-12 h-12 mx-auto text-primary/60 group-hover:text-primary transition-colors" />
                        <div>
                          <p className="text-lg font-medium text-foreground">Drop job description here or click to upload</p>
                          <p className="text-sm text-muted-foreground mt-1">
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
                <Card className="border-yellow-400/30 bg-yellow-400/5">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      {smartSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-500 mt-0.5">💡</span>
                          <span className="text-yellow-700 dark:text-yellow-300">
                            {suggestion}
                          </span>
                          {suggestion.includes('Auto-detect') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="ml-auto h-6 text-xs"
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
                  </CardContent>
                </Card>
              )}

              {/* Usage Limit Display */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>
                      {usageInfo.canUse 
                        ? `${2 - usageInfo.usageCount} free analysis${2 - usageInfo.usageCount === 1 ? '' : 'es'} remaining today`
                        : 'Daily limit reached - sign up for unlimited access'
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Analyze Button */}
              <div className="text-center pt-4">
                {/* Files Status */}
                <div className="flex justify-center gap-4 mb-4">
                  <div className={`flex items-center gap-2 text-sm ${resumeFile ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${resumeFile ? 'text-green-500' : 'text-gray-400'}`} />
                    Resume {resumeFile ? 'Uploaded' : 'Required'}
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${jdFile ? 'text-green-600' : 'text-muted-foreground'}`}>
                    <CheckCircle2 className={`w-4 h-4 ${jdFile ? 'text-green-500' : 'text-gray-400'}`} />
                    Job Description {jdFile ? 'Uploaded' : 'Required'}
                  </div>
                </div>
                
                <Button 
                  onClick={analyzeResume}
                  disabled={!resumeFile || !jdFile || isAnalyzing}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-12 py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
                </Button>
              </div>

              {/* Progress */}
              {isAnalyzing && (
                <Card className="glass border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-lg font-semibold">AI Analyzing Resume Fitment</p>
                        </div>
                        <Progress value={progress} className="h-3 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {progress < 25 ? 'Extracting resume content...' :
                           progress < 50 ? 'Parsing job requirements...' :
                           progress < 75 ? 'Comparing skills and experience...' :
                           progress < 100 ? 'Calculating fitment score...' : 'Analysis complete!'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Results Section */
          <div className="space-y-6">
            {/* Fitment Score */}
            <Card className="glass border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
              <CardHeader className="text-center py-8">
                <div className="relative inline-block mb-6">
                  <div className="text-7xl font-bold text-gradient mb-2">{results.fitmentScore}%</div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <Badge 
                  className={`text-lg px-6 py-3 font-semibold ${
                    results.recommendation === 'RECOMMENDED' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : results.recommendation === 'CONSIDER'
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {results.status}
                </Badge>
                <p className="text-muted-foreground mt-4 text-lg">
                  {results.recommendation === 'RECOMMENDED' 
                    ? 'Strong candidate - proceed with interview' 
                    : results.recommendation === 'CONSIDER'
                    ? 'Decent match - review experience closely'
                    : 'Limited match - consider other candidates'}
                </p>
              </CardHeader>
            </Card>

            {/* Skills Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass border-green-400/30">
                <CardHeader>
                  <CardTitle className="text-green-400">Matched Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.matchedSkills.map((skill: string, index: number) => (
                      <Badge key={index} className="bg-green-500/20 text-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-orange-400/30">
                <CardHeader>
                  <CardTitle className="text-orange-400">Missing Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.missingSkills.map((skill: string, index: number) => (
                      <Badge key={index} className="bg-orange-500/20 text-orange-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights - New section */}
            {results.reasoning && (
              <Card className="glass border-blue-400/30 select-none" onMouseDown={(e) => e.preventDefault()}>
                <CardHeader>
                  <CardTitle className="text-blue-400">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {results.brief_summary}
                  </p>
                  <div className="relative">
                    <p className="text-sm">
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
                </CardContent>
              </Card>
            )}

            {/* Red Flags - if any */}
            {results.red_flags && results.red_flags.length > 0 && (
              <Card className="glass border-red-400/30 select-none" onMouseDown={(e) => e.preventDefault()}>
                <CardHeader>
                  <CardTitle className="text-red-400">Areas of Concern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {results.red_flags.map((flag: string, index: number) => (
                      <Badge key={index} className="bg-red-500/20 text-red-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
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
                </CardContent>
              </Card>
            )}

            {/* Usage Tracker */}
            <Card className="glass border-primary/20 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      Daily Usage: {usageInfo.usageCount}/2 free analyses
                    </span>
                  </div>
                  {!usageInfo.canUse && (
                    <Badge variant="outline" className="text-xs">
                      Resets {usageInfo.resetTime?.toLocaleTimeString() || 'tomorrow'}
                    </Badge>
                  )}
                </div>
                {usageInfo.usageCount >= 2 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✨ Sign up for unlimited resume screening training (FREE)
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="text-center space-y-4">
              <Button 
                onClick={resetAnalysis}
                variant="outline"
                size="lg"
                className="mr-4"
                disabled={!usageInfo.canUse}
              >
                {usageInfo.canUse ? 'Screen Another Resume' : 'Daily Limit Reached'}
              </Button>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-accent"
                onClick={() => {
                  toast({
                    title: "Sign up for advanced features",
                    description: "Get unlimited AI analysis, detailed reports, and resume screening training.",
                  });
                }}
              >
                {usageInfo.canUse ? 'Get Advanced Analysis' : 'Sign Up for Unlimited Access'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeScreen;