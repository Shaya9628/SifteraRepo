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
    <div className="glass rounded-2xl border border-border/50 glow-purple overflow-hidden">
      {/* Gradient Header */}
      <div className="bg-gradient-primary p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="w-6 h-6" />
              Screening Call Simulation
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Practice interviewing {candidateName} for {department.replace('_', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAIGenerated && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 mr-1" /> AI Generated
              </Badge>
            )}
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Q {selectedQuestion + 1} / {currentQuestions.length}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* STAR Method Tip */}
        <div className="glass rounded-xl p-4 border border-border/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Lightbulb className="w-4 h-4 text-white" />
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

        {/* Questions */}
        {questionsLoading || aiLoading ? (
          <div className="text-center py-12">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-primary animate-spin opacity-30"></div>
              <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <p className="text-muted-foreground font-medium">
              {aiLoading ? '✨ AI is crafting tailored questions...' : 'Loading questions...'}
            </p>
          </div>
        ) : currentQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {questionType} questions available</p>
          </div>
        ) : (
          <div className="glass rounded-xl p-6 border border-border/30 space-y-4">
            <div>
              <Label className="text-base font-bold text-gradient">Question {selectedQuestion + 1}</Label>
              <p className="text-lg mt-2 text-foreground leading-relaxed">{currentQuestion}</p>
              {currentQuestions[selectedQuestion]?.hint && (
                <p className="text-sm text-muted-foreground mt-3 italic flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  {currentQuestions[selectedQuestion].hint}
                </p>
              )}
            </div>
            {/* Question Nav Dots */}
            <div className="flex gap-2 flex-wrap">
              {currentQuestions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedQuestion(idx); setAnswer(''); setScore(5); setFeedback(''); }}
                  className={`w-9 h-9 rounded-full text-sm font-bold transition-all duration-300 ${
                    idx === selectedQuestion
                      ? 'bg-gradient-primary text-white glow-purple scale-110'
                      : 'glass border border-border/50 text-muted-foreground hover:text-foreground hover:scale-105'
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
            rows={5}
            className="glass border-border/50 focus:glow-purple transition-shadow"
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

        {/* Notes */}
        <div className="space-y-2">
          <Label className="font-semibold">Interviewer Notes</Label>
          <Textarea
            placeholder="Add notes about STAR method, red flags, or follow-up questions..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="glass border-border/50 focus:glow-purple transition-shadow"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={saving || !answer.trim()}
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90 text-white font-bold text-base glow-purple transition-all duration-300"
        >
          <Send className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Submit & Complete'}
        </Button>
      </div>
    </div>
  );
};

export default CallSimulator;
