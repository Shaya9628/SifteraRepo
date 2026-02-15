import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Save, X, Target, Flag, Phone, Trash2, Building2, Users } from 'lucide-react';
import { GLOBAL_DOMAINS, Domain } from '@/lib/constants/domains';

interface Question {
  id: string;
  stage: string;
  domain: string;
  category: string | null;
  question_text: string;
  hint: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

type StageType = 'scorecard' | 'red_flags' | 'screening_calls';
type DomainType = Domain;

const STAGE_LABELS = {
  scorecard: { label: 'Score Card', icon: Target },
  red_flags: { label: 'Red Flags', icon: Flag },
  screening_calls: { label: 'Screening Calls', icon: Phone },
};

// Create dynamic domain labels from global domains
const DOMAIN_LABELS = GLOBAL_DOMAINS.reduce((acc, domain) => ({
  ...acc,
  [domain.value]: {
    label: domain.label,
    icon: Building2, // Default icon, can be customized per domain
    color: 'bg-purple-500', // Modern Gen Z purple default
    emoji: domain.icon
  }
}), {} as Record<Domain, { label: string; icon: any; color: string; emoji: string }>);

export const QuestionManagement = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<StageType>('scorecard');
  const [activeDomain, setActiveDomain] = useState<DomainType>('sales');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question_text: '',
    description: '',
    hint: '',
    category: '',
    domain: 'Sales' as DomainType,
    is_active: true,
  });

  useEffect(() => {
    // Load domain settings to check if admin can change domains
    const domainSettings = JSON.parse(localStorage.getItem('domain_settings') || '{"allow_admin_domain_change": true}');
    
    // If admin can't change domain, use their current domain
    if (!domainSettings.allow_admin_domain_change) {
      // Get current user's domain from auth context or localStorage
      // For now, default to Sales
      setActiveDomain('Sales');
    }
    
    // Debounce the fetch to avoid too many requests during domain switching
    const timeoutId = setTimeout(() => {
      fetchQuestions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeDomain]);

  useEffect(() => {
    // Initial fetch
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Admin should see all questions for the domain, regardless of who created them
      // This includes both global questions and any user-customized questions
      const baseQuery = supabase
        .from('assessment_questions')
        .select('*')
        .order('stage', { ascending: true })
        .order('sort_order', { ascending: true });

      // Apply domain filter if domain column exists
      if (activeDomain) {
        const { data: domainData, error: domainError } = await baseQuery;

        if (!domainError && domainData) {
          // Filter on client side to avoid TypeScript deep instantiation error
          const filtered = domainData.filter((q: any) => !q.domain || q.domain === activeDomain);
          console.log('Fetched domain-filtered questions:', filtered.length);
          setQuestions(filtered);
          return;
        }

        if (!domainError) {
          console.log('Fetched domain-filtered questions:', domainData);
          setQuestions(domainData || []);
          return;
        }

        // If domain query fails (column doesn't exist), fall back to getting all questions
        console.log('Domain column not found, fetching all questions:', domainError.message);
      }

      // Fallback: get all questions without domain filter (for backward compatibility)
      const { data: allData, error: allError } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('stage', { ascending: true })
        .order('sort_order', { ascending: true });

      if (allError) {
        console.error('Error fetching questions:', allError);
        toast({ 
          title: 'Error fetching questions', 
          description: allError.message, 
          variant: 'destructive' 
        });
        setQuestions([]);
      } else {
        console.log('Fetched all questions:', allData);
        // For backward compatibility, show all questions if no domain column exists
        setQuestions(allData || []);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching questions:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load questions', 
        variant: 'destructive' 
      });
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    // Validation
    if (!formData.question_text.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Question text is required', 
        variant: 'destructive' 
      });
      return;
    }

    if (activeStage === 'screening_calls' && !formData.category) {
      toast({ 
        title: 'Validation Error', 
        description: 'Category is required for screening call questions', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const maxOrder = questions
        .filter(q => q.stage === activeStage)
        .reduce((max, q) => Math.max(max, q.sort_order), 0);

      const newQuestion = {
        stage: activeStage,
        domain: activeDomain,
        question_text: formData.question_text.trim(),
        description: formData.description.trim() || null,
        hint: formData.hint.trim() || null,
        category: activeStage === 'screening_calls' ? (formData.category || 'behavioral') : null,
        is_active: formData.is_active,
        sort_order: maxOrder + 1,
      };

      console.log('Adding question:', newQuestion);

      // Try inserting with domain field first
      const { error: domainError, data: domainData } = await supabase
        .from('assessment_questions')
        .insert(newQuestion)
        .select();

      if (!domainError) {
        console.log('Question added successfully with domain:', domainData);
        toast({ 
          title: 'Success', 
          description: 'Question added successfully',
        });
        resetForm();
        await fetchQuestions();
        return;
      }

      // If domain insertion fails (column doesn't exist), try without domain
      const questionWithoutDomain = {
        stage: activeStage,
        question_text: formData.question_text.trim(),
        description: formData.description.trim() || null,
        hint: formData.hint.trim() || null,
        category: activeStage === 'screening_calls' ? (formData.category || 'behavioral') : null,
        is_active: formData.is_active,
        sort_order: maxOrder + 1,
      };

      const { error: basicError, data: basicData } = await supabase
        .from('assessment_questions')
        .insert(questionWithoutDomain)
        .select();

      if (basicError) {
        console.error('Database error:', basicError);
        toast({ 
          title: 'Error adding question', 
          description: `Database error: ${basicError.message}`, 
          variant: 'destructive' 
        });
        return;
      }

      console.log('Question added successfully without domain:', basicData);
      toast({ 
        title: 'Success', 
        description: 'Question added successfully',
      });
      
      resetForm();
      await fetchQuestions();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred', 
        variant: 'destructive' 
      });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      // Try updating with domain field first
      const { error: domainError } = await supabase
        .from('assessment_questions')
        .update({
          question_text: formData.question_text,
          domain: activeDomain,
          description: formData.description || null,
          hint: formData.hint || null,
          category: activeStage === 'screening_calls' ? formData.category : null,
          is_active: formData.is_active,
        })
        .eq('id', id);

      if (!domainError) {
        toast({ title: 'Question updated successfully' });
        resetForm();
        fetchQuestions();
        return;
      }

      // If domain update fails (column doesn't exist), try without domain
      const { error: basicError } = await supabase
        .from('assessment_questions')
        .update({
          question_text: formData.question_text,
          description: formData.description || null,
          hint: formData.hint || null,
          category: activeStage === 'screening_calls' ? formData.category : null,
          is_active: formData.is_active,
        })
        .eq('id', id);

      if (basicError) {
        toast({ title: 'Error updating question', description: basicError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Question updated successfully' });
        resetForm();
        fetchQuestions();
      }
    } catch (error: any) {
      toast({ title: 'Error updating question', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('assessment_questions')
      .update({ is_active: !currentValue })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error toggling status', description: error.message, variant: 'destructive' });
    } else {
      fetchQuestions();
    }
  };

  const handleDelete = async (id: string, questionText: string) => {
    if (!confirm(`Are you sure you want to delete "${questionText}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting question', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Question deleted successfully' });
      fetchQuestions();
    }
  };

  const startEdit = (question: Question) => {
    setEditingId(question.id);
    setFormData({
      question_text: question.question_text,
      description: question.description || '',
      hint: question.hint || '',
      category: question.category || 'behavioral',
      domain: question.domain as DomainType,
      is_active: question.is_active,
    });
    setShowAddForm(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      question_text: '',
      description: '',
      hint: '',
      category: 'behavioral',
      domain: activeDomain,
      is_active: true,
    });
  };

  // Filter questions by stage and domain (if applicable)
  const stageQuestions = questions.filter(q => {
    // Always filter by stage
    if (q.stage !== activeStage) return false;
    
    // If question has domain property, filter by active domain
    if (q.domain && q.domain !== activeDomain) return false;
    
    // If no domain property (backward compatibility), include all
    return true;
  });

  // Separate questions into global and user-specific (if needed in future)
  // For now, treat all questions as manageable by admin
  const globalQuestions = stageQuestions;
  const userSpecificQuestions: any[] = []; // Placeholder for future enhancement

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Question Management</h1>
        <p className="text-muted-foreground">
          Add and manage questions for different domains and assessment stages
        </p>
      </div>

      {/* Domain Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Domain
          </CardTitle>
          <CardDescription>
            Choose the domain to manage questions for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(Object.keys(DOMAIN_LABELS) as DomainType[]).map((domain) => {
              const { label, icon: Icon, color } = DOMAIN_LABELS[domain];
              return (
                <Button
                  key={domain}
                  variant={activeDomain === domain ? 'default' : 'outline'}
                  onClick={() => setActiveDomain(domain)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Question Management
            <Badge variant="outline" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${DOMAIN_LABELS[activeDomain].color}`} />
              {DOMAIN_LABELS[activeDomain].label}
            </Badge>
          </CardTitle>
          <CardDescription>
            Add, edit, and manage assessment questions for {DOMAIN_LABELS[activeDomain].label} domain
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-blue-600">Total Questions: {questions.length}</span>
              <span className="text-green-600">Active: {questions.filter(q => q.is_active).length}</span>
              <span className="text-orange-600">Current Stage: {stageQuestions.length}</span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Tabs value={activeStage} onValueChange={(v) => { setActiveStage(v as StageType); resetForm(); }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {Object.entries(STAGE_LABELS).map(([key, { label, icon: Icon }]) => (
              <TabsTrigger key={key} value={key}>
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(STAGE_LABELS).map((stage) => (
            <TabsContent key={stage} value={stage} className="space-y-4">
              {/* Add New Button */}
              {!showAddForm && !editingId && (
                <Button onClick={() => setShowAddForm(true)} className="mb-4">
                  <Plus className="w-4 h-4 mr-2" /> Add New Question
                </Button>
              )}

              {/* Add/Edit Form */}
              {(showAddForm || editingId) && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Question Text *</Label>
                      <Input
                        value={formData.question_text}
                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                        placeholder="Enter question text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed description"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hint</Label>
                      <Input
                        value={formData.hint}
                        onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                        placeholder="Helpful hint for evaluators"
                      />
                    </div>

                    {activeStage === 'screening_calls' && (
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={formData.category || 'behavioral'}
                          onValueChange={(v) => setFormData({ ...formData, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="behavioral">Behavioral</SelectItem>
                            <SelectItem value="cultural">Cultural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => editingId ? handleUpdate(editingId) : handleAdd()}>
                        <Save className="w-4 h-4 mr-2" /> {editingId ? 'Update' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        <X className="w-4 h-4 mr-2" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Questions List */}
              <div className="space-y-3">
                {stageQuestions.map((question) => (
                  <Card key={question.id} className={!question.is_active ? 'opacity-50' : ''}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{question.question_text}</span>
                            {question.domain && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${question.domain === 'Sales' ? 'border-blue-500 text-blue-700' : 'border-green-500 text-green-700'}`}
                              >
                                {question.domain}
                              </Badge>
                            )}
                            {question.category && (
                              <Badge variant="outline" className="text-xs">
                                {question.category}
                              </Badge>
                            )}
                            <Badge variant={question.is_active ? 'default' : 'secondary'}>
                              {question.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {/* Indicate question type - all current questions are global/admin-managed */}
                            <Badge variant="secondary" className="text-xs">
                              Global
                            </Badge>
                          </div>
                          {question.description && (
                            <p className="text-sm text-muted-foreground">{question.description}</p>
                          )}
                          {question.hint && (
                            <p className="text-xs text-muted-foreground mt-1">💡 {question.hint}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={question.is_active}
                            onCheckedChange={() => handleToggleActive(question.id, question.is_active)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => startEdit(question)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(question.id, question.question_text)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {stageQuestions.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground py-8">
                        <div className="mb-2">
                          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                        </div>
                        <h3 className="font-medium mb-2">No questions found for {STAGE_LABELS[activeStage as StageType].label}</h3>
                        <p className="text-sm mb-4">
                          No questions are currently available for the {DOMAIN_LABELS[activeDomain].label} domain in this stage.
                        </p>
                        <Button 
                          onClick={() => setShowAddForm(true)}
                          variant="outline"
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Question
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
