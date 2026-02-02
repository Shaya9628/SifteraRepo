import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Phone, Send, Lightbulb } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { evaluateAndAwardBadges } from '@/lib/badgeEvaluation';

interface CallSimulatorProps {
  resumeId: string;
  candidateName: string;
  department: string;
  onComplete?: () => void;
}

const CallSimulator = ({ resumeId, candidateName, department, onComplete }: CallSimulatorProps) => {
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

  // Fetch screening call questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('stage', 'screening_calls')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching call questions:', error);
        toast({
          title: 'Error loading questions',
          description: 'Using fallback questions',
          variant: 'destructive',
        });
      } else {
        setQuestions(data || []);
        // Reset selected question when questions change
        if (data && data.length > 0) {
          setSelectedQuestion(0);
        }
      }
      setQuestionsLoading(false);
    };

    fetchQuestions();
  }, [toast]);

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

  const nextQuestion = () => {
    if (selectedQuestion < currentQuestions.length - 1) {
      setSelectedQuestion(selectedQuestion + 1);
      setAnswer('');
      setScore(5);
      setFeedback('');
    }
  };

  const prevQuestion = () => {
    if (selectedQuestion > 0) {
      setSelectedQuestion(selectedQuestion - 1);
      setAnswer('');
      setScore(5);
      setFeedback('');
    }
  };

  const handleSubmit = async () => {
    if (!user || !answer.trim()) {
      toast({
        title: 'Answer required',
        description: 'Please provide an answer before submitting',
        variant: 'destructive',
      });
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

      // 🎯 Award points
      const points = score * 2;

      // Fetch current profile
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

      // Evaluate and award badges after completing call
      try {
        await evaluateAndAwardBadges(user.id);
      } catch (error) {
        console.error('Error evaluating badges:', error);
      }

      // ✅ Mark behavioral stage as completed in assessment_progress
      // Also mark assessment_completed = true since all 3 stages are now done
      await supabase
        .from('assessment_progress')
        .update({ 
          behavioral_completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('resume_id', resumeId)
        .eq('user_id', user.id);

      // Mark first assessment as complete in profile
      await supabase
        .from('profiles')
        .update({ assessment_completed: true })
        .eq('id', user.id);

      toast({
        title: 'Call simulation saved!',
        description: `You earned ${points} points! Moving to AI Results...`,
      });

      // 🚀 Move to AI results if onComplete provided
      if (onComplete) {
        onComplete();
      } else {
        // Reset for next question
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
      toast({
        title: 'Error saving',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-secondary" />
              Screening Call Simulation
            </CardTitle>
            <CardDescription>
              Practice interviewing {candidateName} for {department}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            Question {selectedQuestion + 1} of {currentQuestions.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Behavioral Interviewing (STAR Method)
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                Listen for: Situation → Task → Action → Result. Past behavior predicts future performance.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={questionType}
              onValueChange={handleQuestionTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="behavioral">Behavioral Questions</SelectItem>
                <SelectItem value="cultural">Cultural Fit Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {questionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : currentQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions available for {questionType}</p>
            </div>
          ) : (
            <Card className="bg-accent/50">
              <CardContent className="pt-6">
                <Label className="text-base font-semibold">Question {selectedQuestion + 1}:</Label>
                <p className="text-lg mt-2">{currentQuestion}</p>
                {currentQuestions[selectedQuestion]?.hint && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    💡 {currentQuestions[selectedQuestion].hint}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  {currentQuestions.map((_, idx) => (
                    <Button
                      key={idx}
                      variant={idx === selectedQuestion ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedQuestion(idx)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label>Candidate's Response (Simulated)</Label>
            <Textarea
              placeholder="Record or imagine the candidate's answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Quality Score</Label>
              <Badge variant="outline">{score}/10</Badge>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <Button
                  key={num}
                  variant={score >= num ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setScore(num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Interviewer Notes</Label>
            <Textarea
              placeholder="Add notes about STAR method, red flags, or follow-up questions..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving || !answer.trim()}
          size="lg"
          className="w-full"
        >
          <Send className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Submit & Next Question'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CallSimulator;
