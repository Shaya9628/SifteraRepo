import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Phone, Send, Lightbulb, Sparkles, RefreshCw } from 'lucide-react';
import { evaluateAndAwardBadges } from '@/lib/badgeEvaluation';

interface CallSimulatorProps {
  resumeId: string;
  candidateName: string;
  department: string;
  resumeText?: string;
  onComplete?: () => void;
}

interface AIQuestion {
  question_text: string;
  category: 'behavioral' | 'cultural_fit';
  hint: string;
}

const CallSimulator = ({ resumeId, candidateName, department, resumeText, onComplete }: CallSimulatorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questionType, setQuestionType] = useState<'behavioral' | 'cultural'>('behavioral');
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<number>(5);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch AI-generated questions
  const fetchAIQuestions = useCallback(async () => {
    if (!resumeText || resumeText.length < 30) return false;
    
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-screening-questions', {
        body: { resume_text: resumeText, department },
      });

      if (error) {
        console.error('AI question generation error:', error);
        if (error.message?.includes('429')) {
          toast({ title: 'Rate limited', description: 'AI is busy, using standard questions.', variant: 'destructive' });
        }
        return false;
      }

      const aiQuestions: AIQuestion[] = data?.questions || [];
      if (aiQuestions.length > 0) {
        setQuestions(aiQuestions.map((q, i) => ({
          question_text: q.question_text,
          category: q.category === 'cultural_fit' ? 'cultural_fit' : 'behavioral',
          hint: q.hint,
          sort_order: i,
        })));
        setIsAIGenerated(true);
        setSelectedQuestion(0);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to fetch AI questions:', err);
      return false;
    } finally {
      setAiLoading(false);
    }
  }, [resumeText, department, toast]);

  // Fetch DB fallback questions
  const fetchDBQuestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('stage', 'screening_calls')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching call questions:', error);
      toast({ title: 'Error loading questions', description: 'Using fallback questions', variant: 'destructive' });
    } else {
      setQuestions(data || []);
      if (data && data.length > 0) setSelectedQuestion(0);
    }
  }, [toast]);

  // Load questions: try AI first, fall back to DB
  useEffect(() => {
    const loadQuestions = async () => {
      setQuestionsLoading(true);
      const aiSuccess = await fetchAIQuestions();
      if (!aiSuccess) {
        await fetchDBQuestions();
      }
      setQuestionsLoading(false);
    };
    loadQuestions();
  }, [fetchAIQuestions, fetchDBQuestions]);

  const handleRegenerate = async () => {
    setQuestionsLoading(true);
    const aiSuccess = await fetchAIQuestions();
    if (!aiSuccess) {
      toast({ title: 'AI unavailable', description: 'Keeping current questions.' });
    } else {
      toast({ title: '✨ New questions generated!', description: 'AI created fresh questions based on the resume.' });
    }
    setQuestionsLoading(false);
  };

  // Get questions for current category
  const currentQuestions = questions.filter(q =>
    q.category === questionType ||
    (questionType === 'cultural' && q.category === 'cultural_fit')
  );
  const currentQuestion = currentQuestions[selectedQuestion]?.question_text || '';

  const handleQuestionTypeChange = (newType: 'behavioral' | 'cultural') => {
    setQuestionType(newType);
    setSelectedQuestion(0);
    setAnswer('');
    setScore(5);
    setFeedback('');
  };

  const handleSubmit = async () => {
    if (!user || !answer.trim()) {
      toast({ title: 'Answer required', description: 'Please provide an answer before submitting', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('call_simulations').insert({
        resume_id: resumeId,
        user_id: user.id,
        question: currentQuestion,
        answer,
        score,
        feedback,
      });
      if (error) throw error;

      const points = score * 2;
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, calls_completed')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_points: (profile.total_points || 0) + points,
            calls_completed: (profile.calls_completed || 0) + 1,
          })
          .eq('id', user.id);
      }

      try { await evaluateAndAwardBadges(user.id); } catch (e) { console.error('Badge error:', e); }

      await supabase
        .from('assessment_progress')
        .update({ behavioral_completed: true, completed_at: new Date().toISOString() })
        .eq('resume_id', resumeId)
        .eq('user_id', user.id);

      await supabase
        .from('profiles')
        .update({ assessment_completed: true })
        .eq('id', user.id);

      toast({ title: 'Call simulation saved!', description: `You earned ${points} points! Moving to AI Results...` });

      if (onComplete) {
        onComplete();
      } else {
        setAnswer('');
        setFeedback('');
        setScore(5);
        if (selectedQuestion < currentQuestions.length - 1) {
          setSelectedQuestion((prev) => prev + 1);
        } else {
          setSelectedQuestion(0);
          setQuestionType(questionType === 'behavioral' ? 'cultural' : 'behavioral');
        }
      }
    } catch (error: any) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-strong rounded-3xl border-2 border-white/10 backdrop-blur-xl glow-purple overflow-hidden hover:glow-cyan transition-all duration-500">
      {/* Enhanced Gradient Header */}
      <div className="bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 animate-gradient" />
        <div className="relative flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="relative">
                <Phone className="w-7 h-7 animate-pulse" />
                <div className="absolute -inset-2 bg-white/20 rounded-full animate-ping" />
              </div>
              Screening Call Simulation
            </h2>
            <p className="text-white/80 text-sm mt-2 flex items-center gap-2">
              ✨ Practice interviewing {candidateName} for {department.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAIGenerated && (
              <Badge className="glass-strong border-2 border-white/30 text-white backdrop-blur-xl px-3 py-2 animate-float">
                <Sparkles className="w-3 h-3 mr-2 animate-spin" /> AI Generated
              </Badge>
            )}
            <Badge className="glass-strong border-2 border-white/30 text-white backdrop-blur-xl px-3 py-2 font-bold">
              Q {selectedQuestion + 1} / {currentQuestions.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enhanced STAR Method Tip */}
        <div className="glass-strong rounded-2xl p-6 border-2 border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:border-amber-400/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl animate-glow-pulse opacity-75" />
              <div className="relative p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
                <Lightbulb className="w-5 h-5 text-white animate-bounce" />
              </div>
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">Behavioral Interviewing (STAR Method)</p>
              <p className="text-muted-foreground">
                Listen for: Situation → Task → Action → Result. Past behavior predicts future performance.
              </p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleQuestionTypeChange('behavioral')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              questionType === 'behavioral'
                ? 'bg-gradient-primary text-white glow-purple shadow-lg'
                : 'glass text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            🧠 Behavioral
          </button>
          <button
            onClick={() => handleQuestionTypeChange('cultural')}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              questionType === 'cultural'
                ? 'bg-gradient-primary text-white glow-purple shadow-lg'
                : 'glass text-muted-foreground hover:text-foreground border border-border/50'
            }`}
          >
            🤝 Cultural Fit
          </button>

          {isAIGenerated && (
            <button
              onClick={handleRegenerate}
              disabled={aiLoading}
              className="ml-auto px-4 py-2.5 rounded-full text-sm font-semibold glass border border-border/50 text-muted-foreground hover:text-foreground transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          )}
        </div>

        {/* Enhanced Questions Loading */}
        {questionsLoading || aiLoading ? (
          <div className="text-center py-16">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-purple to-neon-cyan animate-spin" />
              <div className="absolute inset-2 rounded-full bg-black/90 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-neon-purple animate-pulse" />
              </div>
            </div>
            <p className="text-white/80 font-medium text-lg animate-pulse">
              {aiLoading ? '✨ AI is crafting tailored questions...' : '🚀 Loading questions...'}
            </p>
          </div>
        ) : currentQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {questionType} questions available</p>
          </div>
        ) : (
          <div className="glass-strong rounded-2xl p-6 border-2 border-white/20 space-y-6 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5">
            <div>
              <Label className="text-lg font-bold text-gradient-neon animate-gradient flex items-center gap-2">
                <Phone className="w-4 h-4 text-neon-cyan animate-pulse" />
                Question {selectedQuestion + 1}
              </Label>
              <p className="text-xl mt-3 text-white leading-relaxed font-medium">{currentQuestion}</p>
              {currentQuestions[selectedQuestion]?.hint && (
                <div className="mt-4 glass border border-amber-400/30 rounded-xl p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                  <p className="text-sm text-white/80 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 mt-0.5 text-amber-400 animate-pulse shrink-0" />
                    <span className="italic">{currentQuestions[selectedQuestion].hint}</span>
                  </p>
                </div>
              )}
            </div>
            {/* Enhanced Question Nav Pills */}
            <div className="flex gap-2 flex-wrap">
              {currentQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedQuestion(idx); setAnswer(''); setScore(5); setFeedback(''); }}
                  className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 hover:scale-110 ${
                    idx === selectedQuestion
                      ? 'glass-strong border-2 border-neon-purple bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg glow-purple animate-pulse'
                      : 'glass border border-white/30 text-white/70 hover:text-white hover:border-neon-purple/50 hover:glow-purple'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Response */}
        <div className="space-y-2">
          <Label className="font-semibold">Candidate's Response (Simulated)</Label>
          <Textarea
            placeholder="Record or imagine the candidate's answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="min-h-[100px] glass-strong border border-white/20 text-white placeholder:text-white/50 focus:border-neon-cyan focus:glow-cyan transition-all duration-300"
          />
        </div>

        {/* Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">Quality Score</Label>
            <Badge className="bg-gradient-primary text-white border-0 text-base px-3 py-1">
              {score}/10
            </Badge>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setScore(num)}
                className={`flex-1 h-10 rounded-lg text-sm font-bold transition-all duration-200 ${
                  score >= num
                    ? 'bg-gradient-primary text-white shadow-lg'
                    : 'glass border border-border/50 text-muted-foreground hover:text-foreground hover:scale-105'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Notes Section */}
        <div className="space-y-3">
          <Label className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-neon-cyan animate-spin" />
            Interviewer Notes
          </Label>
          <Textarea
            placeholder="✨ Add insights about STAR method, red flags, or brilliant follow-up questions..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="glass-strong border-2 border-neon-cyan/30 focus:border-neon-cyan focus:glow-cyan bg-black/20 text-white placeholder:text-white/50 resize-none transition-all duration-300"
          />  
        </div>

        {/* Enhanced Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={saving || !answer.trim()}
          size="lg"
          className="w-full glass-strong border-2 border-neon-purple hover:glow-purple hover:scale-105 transition-all duration-300 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-white font-bold text-lg py-4 group"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Saving Magic...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              Submit & Complete ✨
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CallSimulator;
