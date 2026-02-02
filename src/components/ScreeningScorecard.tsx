import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { evaluateAndAwardBadges } from '@/lib/badgeEvaluation';

interface ScorecardProps {
  resumeId: string;
  challengeMode: boolean;
  onComplete?: () => void;
}

const ScreeningScorecard = ({ resumeId, challengeMode, onComplete }: ScorecardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [scores, setScores] = useState({
    relevant_experience: 50,
    skills_certifications: 50,
    career_progression: 50,
    achievements: 50,
    communication_clarity: 50,
  });
  const [culturalFit, setCulturalFit] = useState(50);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('stage', 'scorecard')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching scorecard questions:', error);
        toast({
          title: 'Error loading questions',
          description: 'Using fallback questions',
          variant: 'destructive',
        });
        // Fallback to default questions if database fails
        const defaultQuestions = [
          { id: 'relevant_experience', question_text: 'Relevant Experience', description: '', hint: '', sort_order: 0, max_score: 30 },
          { id: 'skills_certifications', question_text: 'Skills & Certifications', description: '', hint: '', sort_order: 1, max_score: 25 },
          { id: 'career_progression', question_text: 'Career Progression', description: '', hint: '', sort_order: 2, max_score: 20 },
          { id: 'achievements', question_text: 'Achievements', description: '', hint: '', sort_order: 3, max_score: 15 },
          { id: 'communication_clarity', question_text: 'Communication Clarity', description: '', hint: '', sort_order: 4, max_score: 10 }
        ];
        setQuestions(defaultQuestions);
      } else {
        // Use dynamic questions from database with score weights
        const questionsWithWeights = (data || []).map((q, index) => ({
          ...q,
          id: q.question_text.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          max_score: [30, 25, 20, 15, 10][index] || 10 // Default weights
        }));
        setQuestions(questionsWithWeights);
      }
      setQuestionsLoading(false);
    };

    fetchQuestions();
  }, [toast]);

  const calculateWeightedScore = (score: number, weight: number) => {
    return (score / 100) * weight;
  };

  const totalScore = questions.reduce((sum, question) => {
    const score = scores[question.id] || 50;
    const weight = question.max_score || 10;
    return sum + calculateWeightedScore(score, weight);
  }, 0);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Prepare scores for database - ensure we have values for all questions
      const scoreData: any = {
        resume_id: resumeId,
        user_id: user.id,
        cultural_fit_score: culturalFit,
        total_score: totalScore,
        notes,
      };

      // Map dynamic questions to database fields (maintain backwards compatibility)
      questions.forEach((question) => {
        const score = scores[question.id] || 50;
        // Map to existing database columns based on question order/content
        if (question.question_text.toLowerCase().includes('experience')) {
          scoreData.experience_score = score;
        } else if (question.question_text.toLowerCase().includes('skill')) {
          scoreData.skills_score = score;
        } else if (question.question_text.toLowerCase().includes('progression') || question.question_text.toLowerCase().includes('career')) {
          scoreData.progression_score = score;
        } else if (question.question_text.toLowerCase().includes('achievement')) {
          scoreData.achievements_score = score;
        } else if (question.question_text.toLowerCase().includes('communication')) {
          scoreData.communication_score = score;
        }
      });

      // Ensure all required fields have values
      scoreData.experience_score = scoreData.experience_score || 50;
      scoreData.skills_score = scoreData.skills_score || 50;
      scoreData.progression_score = scoreData.progression_score || 50;
      scoreData.achievements_score = scoreData.achievements_score || 50;
      scoreData.communication_score = scoreData.communication_score || 50;

      const { error } = await supabase.from('resume_scores').insert(scoreData);

      if (error) throw error;

      // Update resume status
      await supabase
        .from('resumes')
        .update({ status: 'completed' })
        .eq('id', resumeId);

      // Mark scorecard as completed in assessment_progress
      await supabase
        .from('assessment_progress')
        .update({ scorecard_completed: true })
        .eq('resume_id', resumeId)
        .eq('user_id', user.id);

      // Award points
      const points = Math.round(totalScore);

      // Fetch current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points, resumes_screened')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            total_points: (profile.total_points || 0) + points,
            resumes_screened: (profile.resumes_screened || 0) + 1,
          })
          .eq('id', user.id);
      }

      // Evaluate and award badges after completing assessment
      try {
        await evaluateAndAwardBadges(user.id);
      } catch (error) {
        console.error('Error evaluating badges:', error);
      }

      toast({
        title: 'Screening saved!',
        description: `You earned ${points} points! Moving to Red Flags...`,
      });

      if (onComplete) {
        onComplete();
      } else {
        navigate('/dashboard');
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
            <CardTitle>Resume Screening Scorecard</CardTitle>
            <CardDescription>
              Score each criterion based on HR best practices
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xl px-4 py-2 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            {totalScore.toFixed(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {questionsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading questions...</p>
          </div>
        ) : (
          questions.map((question) => {
            const score = scores[question.id] || 50;
            const weighted = calculateWeightedScore(score, question.max_score || 10);

            return (
              <div key={question.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-base font-semibold">{question.question_text}</Label>
                    {question.description && (
                      <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
                    )}
                    {question.hint && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{question.hint}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{score}/100</Badge>
                    {/* <Badge variant="secondary">{weighted.toFixed(1)}/{question.max_score}</Badge> */}
                  </div>
                </div>
                <Slider
                  value={[score]}
                  onValueChange={([value]) =>
                    setScores(prev => ({ ...prev, [question.id]: value }))
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            );
          })
        )}

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Cultural Fit Assessment</Label>
            <Badge variant="outline">{culturalFit}/100</Badge>
          </div>
          <Slider
            value={[culturalFit]}
            onValueChange={([value]) => setCulturalFit(value)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>

        <div className="space-y-3 pt-4 border-t">
          <Label className="text-base font-semibold">Screening Notes</Label>
          <Textarea
            placeholder="Add detailed notes about your screening decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {challengeMode && (
              <span className="text-destructive font-semibold">
                Challenge Mode Active - Work quickly!
              </span>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Submit & Move to Next Round'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScreeningScorecard;
