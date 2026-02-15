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
import { Flag, AlertTriangle, Save, Zap, Shield, Eye } from 'lucide-react';
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
    <Card className="glass-strong border-2 border-white/10 backdrop-blur-xl">
      <CardHeader className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-t-lg border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gradient-neon animate-gradient flex items-center gap-2">
              <Flag className="w-6 h-6 text-red-400 animate-pulse" />
              Red Flag Detection
            </CardTitle>
            <CardDescription className="text-white/70 mt-2">
              🚨 Identify potential concerns in {candidateName}'s resume with precision
            </CardDescription>
          </div>
          <div className="relative">
            {selectedFlags.size > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-glow-pulse" />
            )}
            <Badge className={`relative text-lg px-6 py-3 flex items-center font-bold transition-all duration-300 ${
              selectedFlags.size > 0 
                ? 'glass-strong border-2 border-red-400/50 bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white animate-bounce' 
                : 'glass border-green-400/50 bg-gradient-to-r from-green-500/80 to-emerald-500/80 text-white'
            }`}>
              {selectedFlags.size > 0 ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-bounce" />
                  {selectedFlags.size} Found
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Clean ✨
                </>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="glass border border-amber-400/30 rounded-2xl p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:border-amber-400/50 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-glow-pulse opacity-75" />
              <AlertTriangle className="relative w-6 h-6 text-amber-400 animate-bounce" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                HR Best Practice
              </p>
              <p className="text-white/80 mt-2 leading-relaxed">
                ✨ Use structured criteria to identify red flags objectively. Look for patterns, not single instances. Trust your instincts!
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {questionsLoading ? (
            <div className="text-center py-12">
              <div className="relative mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-spin" />
                <div className="relative w-16 h-16 bg-black/90 rounded-full flex items-center justify-center">
                  <Flag className="w-8 h-8 text-red-400 animate-pulse" />
                </div>
              </div>
              <p className="text-white/70 animate-pulse">Analyzing red flag patterns...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12 glass border border-white/20 rounded-2xl">
              <Shield className="w-16 h-16 text-green-400 mx-auto mb-4 animate-bounce" />
              <p className="text-white/70 text-lg">No red flag criteria available - All clear! ✨</p>
            </div>
          ) : (
            questions.map((question) => {
              const isSelected = selectedFlags.has(question.id);

              return (
                <Card
                  key={question.id}
                  className={`glass border-2 rounded-2xl p-6 transition-all duration-300 hover-lift cursor-pointer group ${
                    isSelected 
                      ? 'border-red-400/70 bg-gradient-to-r from-red-500/20 to-orange-500/20 glow-red animate-pulse' 
                      : 'border-white/20 hover:border-red-400/50 hover:glow-red'
                  }`}
                  onClick={() => toggleFlag(question.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative mt-1">
                      <Checkbox
                        id={question.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleFlag(question.id)}
                        className={`transition-all duration-300 ${isSelected ? 'border-red-400 bg-red-500' : 'border-white/30 hover:border-red-400'}`}
                      />
                      {isSelected && (
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded animate-glow-pulse opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label 
                          htmlFor={question.id} 
                          className={`text-lg font-semibold cursor-pointer flex items-center gap-2 transition-colors duration-300 ${
                            isSelected ? 'text-red-300' : 'text-white group-hover:text-red-300'
                          }`}
                        >
                          <Flag className={`w-4 h-4 ${isSelected ? 'text-red-400 animate-bounce' : 'text-white/50'}`} />
                          {question.question_text}
                        </Label>
                        {question.description && (
                          <p className="text-sm text-white/60 mt-2 leading-relaxed">{question.description}</p>
                        )}
                        {question.hint && (
                          <Badge className="mt-3 glass border-amber-400/50 bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white px-3 py-1">
                            💡 {question.hint}
                          </Badge>
                        )}
                      </div>

                      {isSelected && (
                        <div className="relative animate-in slide-in-from-top-2 duration-300">
                          <Textarea
                            placeholder="🚨 Describe the specific red flag you found..."
                            value={descriptions[question.id] || ''}
                            onChange={(e) =>
                              setDescriptions(prev => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            rows={3}
                            className="glass border-red-400/30 focus:border-red-400 focus:glow-red bg-black/20 text-white placeholder:text-white/50 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className={`w-full glass-strong border-2 font-bold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 group ${
            selectedFlags.size > 0 
              ? 'border-red-400 hover:glow-red bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white'
              : 'border-green-400 hover:glow-green bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white'
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Analyzing Flags...
            </>
          ) : selectedFlags.size === 0 ? (
            <>
              <Shield className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              No Red Flags - Continue ✨
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              Save {selectedFlags.size} Red Flag{selectedFlags.size !== 1 ? 's' : ''} 🚨
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default RedFlagDetector;
