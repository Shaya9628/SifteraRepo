import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Flag, Phone, Target, Trophy, Timer, RefreshCw } from 'lucide-react';
import ScreeningScorecard from '@/components/ScreeningScorecard';
import RedFlagDetector from '@/components/RedFlagDetector';
import CallSimulator from '@/components/CallSimulator';
import UnifiedResumeAnalysis from '@/components/UnifiedResumeAnalysis';
import { useToast } from '@/hooks/use-toast';

interface Resume {
  id: string;
  candidate_name: string;
  department: string;
  file_url: string;
  file_path: string;
}

interface UserProfile {
  full_name: string;
  total_points: number;
  selected_domain: string;
  last_pool_resume_index?: number;
  assessment_completed?: boolean;
}

const Screen = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [resume, setResume] = useState<Resume | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState('scorecard');
  const [challengeMode, setChallengeMode] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(1200); // 20 minutes

  const [scorecardCompleted, setScorecardCompleted] = useState(false);
  const [redFlagsCompleted, setRedFlagsCompleted] = useState(false);
  const [callSimCompleted, setCallSimCompleted] = useState(false);
  const [showStepTransition, setShowStepTransition] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleScorecardComplete = () => {
    setShowStepTransition(true);
    setTransitionMessage('🔥 SCORECARD CRUSHED! Time to hunt for red flags like a detective 🕵️‍♂️');
    
    setTimeout(() => {
      setScorecardCompleted(true);
      setActiveTab('red-flags');
      setShowStepTransition(false);
    }, 3500);
  };

  const handleRedFlagsComplete = () => {
    setShowStepTransition(true);
    setTransitionMessage('📞 RING RING! Time to channel your inner recruiter and make the call! ☎️✨');
    
    setTimeout(() => {
      setRedFlagsCompleted(true);
      setActiveTab('call');
      setShowStepTransition(false);
    }, 4500);
  };

  const handleCallComplete = () => {
    setShowStepTransition(true);
    setTransitionMessage('🔥 BOOM! AI is about to roast your assessment... Prepare for the ultimate battle! 🤖⚡');
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setCallSimCompleted(true);
      setActiveTab('ai-results');
      setShowStepTransition(false);
      setIsAnalyzing(false);
    }, 6000);
  };

  useEffect(() => {
    if (user && id) {
      loadResume();
      loadUserProfile();
      loadAssessmentProgress();
    }
  }, [user, id]);

  const loadResume = async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      toast({ title: 'Database Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (!data) {
      toast({ title: 'Resume Not Found', description: 'This training resume is not available', variant: 'destructive' });
      setTimeout(() => navigate('/dashboard'), 2000);
      setLoading(false);
      return;
    }

    const { data: signedUrlData, error: storageError } = await supabase
      .storage
      .from('resumes')
      .createSignedUrl(data.file_path, 3600);

    if (storageError) {
      toast({ title: 'File Access Error', description: 'Cannot load resume file. Please contact admin.', variant: 'destructive' });
    }

    setResume({ ...data, file_url: signedUrlData?.signedUrl || data.file_url });
    
    // Extract actual resume text from the PDF for AI analysis
    if (signedUrlData?.signedUrl) {
      try {
        const pdfText = await extractTextFromPDF(signedUrlData.signedUrl);
        if (pdfText && pdfText.trim().length > 50) {
          setResumeText(pdfText);
          console.log('Extracted resume text:', pdfText.substring(0, 200) + '...');
        } else {
          // Fallback: Use metadata-based text if PDF extraction fails
          const fallbackText = `Candidate: ${data.candidate_name}\nDepartment: ${data.department}\nPosition Applied For: ${data.department} Role\n\nNote: PDF text extraction yielded limited content. AI analysis will use available metadata.`;
          setResumeText(fallbackText);
          console.log('Using fallback resume text - PDF extraction returned minimal content');
        }
      } catch (extractError) {
        console.error('PDF extraction error:', extractError);
        const fallbackText = `Candidate: ${data.candidate_name}\nDepartment: ${data.department}\nPosition Applied For: ${data.department} Role\n\nNote: Unable to extract PDF content. AI analysis will use available metadata.`;
        setResumeText(fallbackText);
      }
    } else {
      setResumeText(`Candidate: ${data.candidate_name}\nDepartment: ${data.department}`);
    }
    
    setLoading(false);
  };

  // Function to extract text from PDF using fetch and basic parsing
  const extractTextFromPDF = async (pdfUrl: string): Promise<string> => {
    try {
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert bytes to string and extract readable text
      let text = '';
      let isInTextStream = false;
      let textBuffer = '';
      
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawContent = decoder.decode(bytes);
      
      // Extract text between BT (Begin Text) and ET (End Text) markers
      const textMatches = rawContent.match(/BT[\s\S]*?ET/g) || [];
      
      for (const match of textMatches) {
        // Extract text from Tj and TJ operators
        const tjMatches = match.match(/\(([^)]*)\)\s*Tj/g) || [];
        const tjArrayMatches = match.match(/\[([^\]]*)\]\s*TJ/g) || [];
        
        for (const tj of tjMatches) {
          const textMatch = tj.match(/\(([^)]*)\)/);
          if (textMatch) {
            text += textMatch[1] + ' ';
          }
        }
        
        for (const tj of tjArrayMatches) {
          const parts = tj.match(/\(([^)]*)\)/g) || [];
          for (const part of parts) {
            const textMatch = part.match(/\(([^)]*)\)/);
            if (textMatch) {
              text += textMatch[1];
            }
          }
          text += ' ';
        }
      }
      
      // Clean up the extracted text
      text = text
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // If basic extraction didn't work well, try to find readable ASCII text
      if (text.length < 100) {
        const asciiText = rawContent
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Extract words that look like they could be resume content
        const words = asciiText.match(/[A-Za-z]{3,}/g) || [];
        if (words.length > 20) {
          text = words.join(' ');
        }
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return '';
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) setUserProfile(data as UserProfile);
  };

  const loadAssessmentProgress = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('assessment_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('resume_id', id)
      .maybeSingle();

    if (data) {
      // Check if assessment is fully completed (completed_at is set)
      if (data.completed_at) {
        setScorecardCompleted(true);
        setRedFlagsCompleted(true);
        setCallSimCompleted(true);
        // Always start at scorecard, user can navigate to results if they want
        setActiveTab('scorecard');
      } else {
        setScorecardCompleted(data.scorecard_completed ?? false);
        setRedFlagsCompleted(data.red_flags_completed ?? false);
        setCallSimCompleted(data.behavioral_completed ?? false);

        // Always start at scorecard regardless of progress
        setActiveTab('scorecard');
      }
    } else {
      // No progress row for this resume - check if there's a completed report for THIS resume
      const { data: completedReport } = await supabase
        .from('assessment_reports')
        .select('id')
        .eq('user_id', user.id)
        .eq('resume_id', id)
        .maybeSingle();

      if (completedReport) {
        // This specific resume has a completed assessment - but still start at scorecard
        setScorecardCompleted(true);
        setRedFlagsCompleted(true);
        setCallSimCompleted(true);
        setActiveTab('scorecard');
        return;
      }

      // New assessment for this resume - create fresh progress row and start from scorecard
      await supabase.from('assessment_progress').insert({
        user_id: user.id,
        resume_id: id,
        scorecard_completed: false,
        red_flags_completed: false,
        behavioral_completed: false,
      });
      setActiveTab('scorecard');
    }
  };

  useEffect(() => {
    if (challengeMode && timeRemaining > 0) {
      const timer = setInterval(() => setTimeRemaining(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    } else if (challengeMode && timeRemaining === 0) {
      toast({ title: "Time's up!", description: 'Challenge mode ended. Submit your screening now.', variant: 'destructive' });
    }
  }, [challengeMode, timeRemaining]);

  const handleOtherResume = async () => {
    if (!user || !userProfile) return;

    const { data: poolResumes, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('is_pool_resume', true)
      .eq('domain', userProfile?.selected_domain ?? '')
      .order('id');

    if (error || !poolResumes || poolResumes.length === 0) {
      toast({ title: 'No pool resumes available', description: 'Please contact admin.', variant: 'destructive' });
      return;
    }

    const currentIndex = userProfile?.last_pool_resume_index ?? 0;
    const nextIndex = (currentIndex + 1) % poolResumes.length;
    const nextResume = poolResumes[nextIndex];

    await supabase
      .from('profiles')
      .update({ last_pool_resume_index: nextIndex })
      .eq('id', user.id);

    toast({ title: 'New resume assigned', description: `Switched to ${nextResume.candidate_name}'s resume.` });
    navigate(`/screen/${nextResume.id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resume...</p>
        </div>
      </div>
    );
  }

  if (!resume) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Assessment: {resume.candidate_name}</h1>
              <p className="text-sm text-muted-foreground">{resume.department.replace('_', ' ')} position</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userProfile && (
              <div className="text-right mr-4">
                <p className="text-sm font-medium">{userProfile.full_name}</p>
                <p className="text-xs text-muted-foreground">{userProfile.total_points ?? 0} points</p>
              </div>
            )}
            {challengeMode && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Timer className="w-4 h-4 mr-2" />
                {formatTime(timeRemaining)}
              </Badge>
            )}
            <Button variant={challengeMode ? 'destructive' : 'outline'} onClick={() => { setChallengeMode(!challengeMode); if (!challengeMode) setTimeRemaining(1200); }}>
              {challengeMode ? 'Exit Challenge' : 'Challenge Mode'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resume Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Resume Preview
              </CardTitle>
              <CardDescription>Review the candidate's resume</CardDescription>
            </CardHeader>
            <CardContent>
              {resume.file_url && <iframe src={resume.file_url} className="w-full h-[600px] border rounded" title="Resume" />}
              <div className="space-y-2 mt-4">
                <Button className="w-full" variant="outline" onClick={() => window.open(resume.file_url, '_blank')}>
                  Open in New Tab
                </Button>
                <Button className="w-full" variant="secondary" onClick={handleOtherResume}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Other Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Screening Tools */}
        <div className="lg:col-span-2">
          {/* EPIC CINEMATIC TRANSITION */}
          {showStepTransition && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 animate-fadeIn">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-500/20 animate-gradient"></div>
              <Card className="glass-strong border-2 border-purple-400/60 w-full max-w-lg mx-4 relative z-10 animate-slideUp">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-cyan-900/40 rounded-lg animate-gradient"></div>
                <CardContent className="p-12 text-center relative z-10">
                  <div className="space-y-8">
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <div className="w-24 h-24 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 glass-strong border border-purple-400/60 rounded-full flex items-center justify-center animate-pulse glow-purple">
                              <span className="text-3xl animate-bounce">🤖</span>
                            </div>
                          </div>
                          <div className="absolute -inset-8 border-2 border-purple-400/20 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    ) : transitionMessage.includes('📞') ? (
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <div className="w-24 h-24 glass-strong border-2 border-green-400/60 rounded-full flex items-center justify-center animate-pulse glow-green">
                            <span className="text-4xl animate-bounce">📞</span>
                          </div>
                          <div className="absolute -inset-8 border-2 border-green-400/30 rounded-full animate-ping"></div>
                          <div className="absolute -inset-12 border border-green-400/20 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <div className="w-24 h-24 glass-strong border-2 border-blue-400/60 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center animate-pulse glow-blue">
                            <span className="text-4xl animate-spin">⚡</span>
                          </div>
                          <div className="absolute -inset-8 border-2 border-blue-400/30 rounded-full animate-ping"></div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                        {isAnalyzing ? '🔥 AI BATTLE MODE' : 
                         transitionMessage.includes('📞') ? '☎️ CALL TIME!' :
                         '✨ LEVEL UP!'}
                      </h2>
                      <p className="text-lg text-gray-300 leading-relaxed animate-pulse">{transitionMessage}</p>
                      
                      {isAnalyzing && (
                        <div className="mt-6 space-y-4">
                          <div className="flex justify-center items-center space-x-2">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                          </div>
                          <p className="text-sm text-purple-300 animate-pulse font-semibold">AI neurons firing at lightspeed... ⚡</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6 glass-strong border-2 border-purple-400/30 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 p-2 rounded-2xl">
              <TabsTrigger 
                value="scorecard"
                className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-blue-400/60 data-[state=active]:glow-blue data-[state=active]:text-blue-300 hover:glow-blue transition-all duration-300"
              >
                <Target className="w-4 h-4 mr-2" />1. 🎯 Score Battle
              </TabsTrigger>
              <TabsTrigger 
                value="red-flags" 
                disabled={!scorecardCompleted}
                className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-red-400/60 data-[state=active]:glow-red data-[state=active]:text-red-300 hover:glow-red transition-all duration-300 disabled:opacity-50"
              >
                <Flag className="w-4 h-4 mr-2" />2. 🚩 Flag Hunt
              </TabsTrigger>
              <TabsTrigger 
                value="call" 
                disabled={!redFlagsCompleted}
                className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-green-400/60 data-[state=active]:glow-green data-[state=active]:text-green-300 hover:glow-green transition-all duration-300 disabled:opacity-50"
              >
                <Phone className="w-4 h-4 mr-2" />3. 📞 Call Time
              </TabsTrigger>
              <TabsTrigger 
                value="ai-results" 
                disabled={!callSimCompleted}
                className="data-[state=active]:glass-strong data-[state=active]:border-2 data-[state=active]:border-purple-400/60 data-[state=active]:glow-purple data-[state=active]:text-purple-300 hover:glow-purple transition-all duration-300 disabled:opacity-50"
              >
                <Trophy className="w-4 h-4 mr-2" />4. 🏆 AI Battle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scorecard">
              <ScreeningScorecard 
                resumeId={resume.id} 
                challengeMode={challengeMode}
                onComplete={handleScorecardComplete}
              />
            </TabsContent>

            <TabsContent value="red-flags">
              <RedFlagDetector 
                resumeId={resume.id}
                candidateName={resume.candidate_name}
                onComplete={handleRedFlagsComplete}
              />
            </TabsContent>

            <TabsContent value="call">
              <CallSimulator 
                resumeId={resume.id}
                candidateName={resume.candidate_name}
                department={resume.department}
                resumeText={resumeText}
                onComplete={handleCallComplete}
              />
            </TabsContent>

            <TabsContent value="ai-results">
              <UnifiedResumeAnalysis
                resumeId={resume.id}
                resumeText={resumeText}
                candidateName={resume.candidate_name}
                department={resume.department}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Screen;
