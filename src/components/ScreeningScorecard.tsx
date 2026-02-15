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
import { Trophy, Save, Sparkles, Target, Zap } from 'lucide-react';
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
    <Card className="glass-strong border-2 border-white/10 backdrop-blur-xl">
      <CardHeader className="bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-t-lg border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gradient-neon animate-gradient flex items-center gap-2">
              <Target className="w-6 h-6 text-neon-purple animate-pulse" />
              Resume Screening Scorecard
            </CardTitle>
            <CardDescription className="text-white/70 mt-2">
              ✨ Score each criterion with precision - your assessment shapes the future!
            </CardDescription>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-pink rounded-full animate-glow-pulse" />
            <Badge className="relative glass-strong border-2 border-white/30 text-xl px-6 py-3 flex items-center bg-gradient-to-r from-neon-purple/80 to-neon-pink/80 text-white animate-float">
              <Trophy className="w-5 h-5 mr-2 animate-bounce" />
              <span className="font-bold text-2xl">{totalScore.toFixed(1)}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        {questionsLoading ? (
          <div className="text-center py-12">
            <div className="relative mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-cyan rounded-full animate-spin" />
              <div className="relative w-16 h-16 bg-black/90 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-neon-purple animate-pulse" />
              </div>
            </div>
            <p className="text-white/70 animate-pulse">Loading assessment criteria...</p>
          </div>
        ) : (
          questions.map((question) => {
            const score = scores[question.id] || 50;
            const weighted = calculateWeightedScore(score, question.max_score || 10);

            return (
              <div key={question.id} className="glass border border-white/20 rounded-2xl p-6 hover:border-neon-purple/50 transition-all duration-300 hover:glow-purple space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-lg font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-neon-cyan" />
                      {question.question_text}
                    </Label>
                    {question.description && (
                      <p className="text-sm text-white/60 mt-2 leading-relaxed">{question.description}</p>
                    )}
                    {question.hint && (
                      <p className="text-xs text-neon-cyan/80 mt-2 italic flex items-center gap-1">
                        💡 {question.hint}
                      </p>  
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-pink rounded-lg animate-glow-pulse opacity-75" />
                      <Badge className="relative glass border-neon-purple/50 px-3 py-1 text-white font-bold">
                        {score}/100
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Slider
                    value={[score]}
                    onValueChange={([value]) =>
                      setScores(prev => ({ ...prev, [question.id]: value }))
                    }
                    max={100}
                    step={5}
                    className="w-full slider-glow [&>span]:bg-gradient-to-r [&>span]:from-neon-purple [&>span]:to-neon-pink [&>span]:border-0 [&>.slider-track]:bg-white/20 [&>.slider-range]:bg-gradient-to-r [&>.slider-range]:from-neon-purple [&>.slider-range]:to-neon-pink [&>.slider-thumb]:bg-white [&>.slider-thumb]:border-2 [&>.slider-thumb]:border-neon-purple [&>.slider-thumb]:hover:scale-125 [&>.slider-thumb]:transition-transform"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-2">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="glass border border-white/20 rounded-2xl p-6 space-y-4 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-pink animate-pulse" />
              Cultural Fit Assessment
            </Label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple rounded-lg animate-glow-pulse opacity-75" />
              <Badge className="relative glass border-neon-pink/50 px-3 py-1 text-white font-bold">
                {culturalFit}/100
              </Badge>
            </div>
          </div>
          <div className="relative">
            <Slider
              value={[culturalFit]}
              onValueChange={([value]) => setCulturalFit(value)}
              max={100}
              step={5}
              className="w-full slider-glow [&>span]:bg-gradient-to-r [&>span]:from-neon-pink [&>span]:to-neon-purple [&>span]:border-0 [&>.slider-track]:bg-white/20 [&>.slider-range]:bg-gradient-to-r [&>.slider-range]:from-neon-pink [&>.slider-range]:to-neon-purple [&>.slider-thumb]:bg-white [&>.slider-thumb]:border-2 [&>.slider-thumb]:border-neon-pink [&>.slider-thumb]:hover:scale-125 [&>.slider-thumb]:transition-transform"
            />
            <div className="flex justify-between text-xs text-white/60 mt-2">
              <span>Poor Fit</span>
              <span>Good Match</span>
              <span>Perfect Fit</span>
            </div>
          </div>
        </div>

        <div className="glass border border-white/20 rounded-2xl p-6 space-y-4 bg-gradient-to-r from-neon-cyan/10 to-neon-lime/10">
          <Label className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-neon-cyan animate-bounce" />
            Screening Notes
          </Label>
          <Textarea
            placeholder="✨ Share your insights about this candidate's potential..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="glass border-neon-cyan/30 focus:border-neon-cyan focus:glow-cyan bg-black/20 text-white placeholder:text-white/50 resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/20">
          <div className="text-sm text-white/70">
            {challengeMode && (
              <span className="text-neon-orange font-semibold animate-pulse flex items-center gap-2">
                ⚡ Challenge Mode Active - Work quickly!
              </span>
            )}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            size="lg"
            className="glass-strong border-2 border-neon-purple hover:glow-purple hover:scale-105 transition-all duration-300 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan text-white font-bold px-8 py-3 text-lg group"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3" />
                Saving Magic...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                Submit & Move to Next Round ✨
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScreeningScorecard;
