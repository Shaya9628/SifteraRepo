import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Flag, AlertTriangle, Save } from 'lucide-react';
import { evaluateAndAwardBadges } from '@/lib/badgeEvaluation';

interface RedFlagDetectorProps {
  resumeId: string;
  candidateName: string;
  onComplete?: () => void;
}

const RedFlagDetector = ({ resumeId, candidateName, onComplete }: RedFlagDetectorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set());
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Fetch red flag questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('stage', 'red_flags')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching red flag questions:', error);
        toast({
          title: 'Error loading questions',
          description: 'Using fallback questions',
          variant: 'destructive',
        });
      } else {
        setQuestions(data || []);
      }
      setQuestionsLoading(false);
    };

    fetchQuestions();
  }, [toast]);

  const toggleFlag = (questionId: string) => {
    const newFlags = new Set(selectedFlags);
    if (newFlags.has(questionId)) {
      newFlags.delete(questionId);
    } else {
      newFlags.add(questionId);
    }
    setSelectedFlags(newFlags);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Allow users to proceed without selecting flags
      if (selectedFlags.size > 0) {
        const flagsToInsert = Array.from(selectedFlags).map(questionId => {
          const question = questions.find(q => q.id === questionId);
          return {
            resume_id: resumeId,
            user_id: user.id,
            flag_type: question?.question_text || questionId,
            description: descriptions[questionId] || '',
          };
        });

        const { error } = await supabase.from('red_flags').insert(flagsToInsert);
        if (error) throw error;

        // Award points for finding red flags
        const points = selectedFlags.size * 5;

        // Fetch current profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_points, red_flags_found')
          .eq('id', user.id)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({
              total_points: (profile.total_points || 0) + points,
              red_flags_found: (profile.red_flags_found || 0) + selectedFlags.size,
            })
            .eq('id', user.id);
        }

        // Evaluate and award badges after finding red flags
        try {
          await evaluateAndAwardBadges(user.id);
        } catch (error) {
          console.error('Error evaluating badges:', error);
        }

        toast({
          title: 'Red flags saved!',
          description: `You earned ${points} points! Moving to Screening Call Simulation...`,
        });
      } else {
        toast({
          title: 'No red flags',
          description: 'Proceeding without red flags. Moving to Screening Call Simulation...',
        });
      }

      // Mark red_flags as completed in assessment_progress
      await supabase
        .from('assessment_progress')
        .update({ red_flags_completed: true })
        .eq('resume_id', resumeId)
        .eq('user_id', user.id);

      if (onComplete) {
        onComplete();
      } else {
        setSelectedFlags(new Set());
        setDescriptions({});
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
              <Flag className="w-5 h-5 text-destructive" />
              Red Flag Detection
            </CardTitle>
            <CardDescription>
              Identify potential concerns in {candidateName}'s resume
            </CardDescription>
          </div>
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {selectedFlags.size} Found
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                HR Best Practice
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                Use structured criteria to identify red flags objectively. Look for patterns, not single instances.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No red flag questions available</p>
            </div>
          ) : (
            questions.map((question) => {
              const isSelected = selectedFlags.has(question.id);

              return (
                <Card
                  key={question.id}
                  className={`transition-all ${
                    isSelected ? 'border-destructive bg-destructive/5' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={question.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleFlag(question.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={question.id} className="text-base font-semibold cursor-pointer">
                            {question.question_text}
                          </Label>
                          {question.description && (
                            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                          )}
                          {question.hint && (
                            <Badge variant="outline" className="mt-2">
                              💡 {question.hint}
                            </Badge>
                          )}
                        </div>

                        {isSelected && (
                          <Textarea
                            placeholder="Describe the specific red flag you found..."
                            value={descriptions[question.id] || ''}
                            onChange={(e) =>
                              setDescriptions(prev => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="w-full"
          variant="destructive"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving
            ? 'Saving...'
            : selectedFlags.size === 0
            ? 'No Red Flags - Continue'
            : `Save ${selectedFlags.size} Red Flag${selectedFlags.size !== 1 ? 's' : ''}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RedFlagDetector;
