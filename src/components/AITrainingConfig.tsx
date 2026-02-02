import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, X, Brain, Target, AlertTriangle, MessageSquare, Award, Briefcase, Users, Settings, ChevronDown } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface TrainingConfig {
  id: string;
  domain: string;
  is_active: boolean;
  min_experience_years: number;
  preferred_backgrounds: string[];
  required_skills: string[];
  skill_weightage: number;
  communication_indicators: string[];
  communication_weightage: number;
  preferred_industries: string[];
  preferred_roles: string[];
  achievement_indicators: string[];
  achievement_weightage: number;
  red_flags: string[];
  positive_keywords: string[];
  negative_keywords: string[];
  crm_tools: string[];
  ticketing_experience_required: boolean;
  customer_interaction_depth: string;
  conflict_handling_importance: number;
  required_behavioral_traits: string[];
  experience_weightage: number;
  progression_weightage: number;
  cultural_fit_weightage: number;
  evaluation_notes: string;
}

interface TrainingSettings {
  id: string;
  apply_training_rules: boolean;
}

const defaultConfig: Omit<TrainingConfig, 'id'> = {
  domain: '',
  is_active: true,
  min_experience_years: 0,
  preferred_backgrounds: [],
  required_skills: [],
  skill_weightage: 20,
  communication_indicators: [],
  communication_weightage: 15,
  preferred_industries: [],
  preferred_roles: [],
  achievement_indicators: [],
  achievement_weightage: 20,
  red_flags: [],
  positive_keywords: [],
  negative_keywords: [],
  crm_tools: [],
  ticketing_experience_required: false,
  customer_interaction_depth: 'medium',
  conflict_handling_importance: 50,
  required_behavioral_traits: [],
  experience_weightage: 20,
  progression_weightage: 15,
  cultural_fit_weightage: 10,
  evaluation_notes: ''
};

// Industry standard options for dropdowns
const INDUSTRY_OPTIONS = {
  preferred_backgrounds: [
    'B2B Sales', 'B2C Sales', 'Enterprise Sales', 'SaaS Sales', 'Inside Sales', 'Field Sales',
    'Account Management', 'Business Development', 'Channel Sales', 'Retail Sales', 'Pharmaceutical Sales'
  ],
  required_skills: [
    'Cold Calling', 'Lead Generation', 'Negotiation', 'Pipeline Management', 'CRM Proficiency',
    'Presentation Skills', 'Consultative Selling', 'Account Planning', 'Territory Management', 'Objection Handling'
  ],
  crm_tools: [
    'Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Microsoft Dynamics', 'Freshworks CRM',
    'Zendesk Sell', 'Insightly', 'Monday.com', 'Copper', 'ActiveCampaign'
  ],
  communication_indicators: [
    'Active Listening', 'Persuasion', 'Emotional Intelligence', 'Written Communication', 'Presentation Skills',
    'Rapport Building', 'Questioning Techniques', 'Storytelling', 'Conflict Resolution', 'Cross-cultural Communication'
  ],
  required_behavioral_traits: [
    'Self-motivated', 'Resilient', 'Goal-oriented', 'Competitive', 'Persistent', 'Adaptable',
    'Confident', 'Empathetic', 'Detail-oriented', 'Team Player', 'Proactive'
  ],
  achievement_indicators: [
    'Quota Achievement', 'Revenue Growth', 'Deal Size', 'Win Rate', 'Sales Cycle Reduction',
    'Customer Retention', 'Upselling Success', 'Territory Expansion', 'New Account Acquisition', 'Performance Ranking'
  ],
  project_keywords: [
    'E-commerce Platform', 'API Development', 'Mobile Application', 'Web Application', 'Database Design',
    'Cloud Migration', 'DevOps Implementation', 'Security Enhancement', 'Performance Optimization', 'Integration Project'
  ],
  education_requirements: [
    'Computer Science', 'Software Engineering', 'Information Technology', 'Data Science', 'Cybersecurity',
    'Business Administration', 'Marketing', 'Engineering', 'Mathematics', 'Economics'
  ],
  red_flags: [
    'Frequent Job Changes', 'Employment Gaps', 'Lack of Progression', 'Poor References', 'Inconsistent Performance',
    'Attitude Issues', 'Overqualified', 'Unrealistic Expectations', 'Poor Communication', 'Lack of Industry Knowledge'
  ],
  positive_keywords: [
    'Achievement', 'Growth', 'Leadership', 'Innovation', 'Excellence', 'Results-driven',
    'Strategic', 'Collaborative', 'Customer-focused', 'Performance', 'Success'
  ],
  negative_keywords: [
    'Entry-level Only', 'No Management Experience', 'Limited Scope', 'Basic Skills', 'Minimal Impact',
    'Support Role Only', 'No Leadership', 'Task-oriented Only', 'Junior Level', 'Limited Responsibility'
  ],
  preferred_industries: [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Automotive',
    'Telecommunications', 'Energy', 'Real Estate', 'Education', 'Hospitality'
  ],
  preferred_roles: [
    'Sales Representative', 'Account Executive', 'Sales Manager', 'Business Development Manager',
    'Territory Manager', 'Key Account Manager', 'Sales Director', 'Regional Sales Manager',
    'Inside Sales Representative', 'Channel Partner Manager'
  ],
  leadership_indicators: [
    'Team Management', 'Project Leadership', 'Cross-functional Leadership', 'Change Management',
    'Strategic Planning', 'Mentoring', 'Process Improvement', 'Stakeholder Management', 'Budget Management', 'Performance Management'
  ],
  problem_solving_examples: [
    'Process Improvement', 'Crisis Management', 'System Optimization', 'Cost Reduction',
    'Quality Enhancement', 'Customer Issue Resolution', 'Resource Allocation', 'Strategic Planning', 'Risk Mitigation', 'Innovation Implementation'
  ]
};

const DEFAULT_CONFIG: TrainingConfig = {
  id: '',
  domain: '',
  is_active: true,
  min_experience_years: 0,
  preferred_backgrounds: [],
  required_skills: [],
  skill_weightage: 20,
  communication_indicators: [],
  communication_weightage: 15,
  preferred_industries: [],
  preferred_roles: [],
  achievement_indicators: [],
  achievement_weightage: 20,
  red_flags: [],
  positive_keywords: [],
  negative_keywords: [],
  crm_tools: [],
  ticketing_experience_required: false,
  customer_interaction_depth: 'medium',
  conflict_handling_importance: 50,
  required_behavioral_traits: [],
  experience_weightage: 20,
  progression_weightage: 15,
  cultural_fit_weightage: 10,
  evaluation_notes: ''
};

const ArrayFieldEditor = memo(({ 
  label, 
  icon: Icon, 
  field, 
  placeholder,
  description,
  activeConfig,
  activeDomain,
  getInputValue,
  setInputValue,
  addArrayItem,
  removeArrayItem
}: { 
  label: string; 
  icon: React.ElementType; 
  field: keyof TrainingConfig; 
  placeholder: string;
  description?: string;
  activeConfig: TrainingConfig | undefined;
  activeDomain: string;
  getInputValue: (field: string) => string;
  setInputValue: (field: string, value: string) => void;
  addArrayItem: (field: string) => void;
  removeArrayItem: (field: string, index: number) => void;
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  if (!activeConfig) return null;
  const items = (activeConfig[field] as string[]) || [];
  const options = INDUSTRY_OPTIONS[field as keyof typeof INDUSTRY_OPTIONS] || [];
  const currentValue = getInputValue(field as string);
  
  // Filter options based on current input and exclude already selected items
  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(currentValue.toLowerCase()) &&
    !items.includes(option)
  );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleOptionSelect = (option: string) => {
    setInputValue(field as string, option);
    addArrayItem(field as string);
    setShowDropdown(false);
  };
  
  const handleInputChange = (value: string) => {
    setInputValue(field as string, value);
    setShowDropdown(value.length > 0 && filteredOptions.length > 0);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <Label className="font-medium">{label}</Label>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder={placeholder}
              value={currentValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setShowDropdown(filteredOptions.length > 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addArrayItem(field as string);
                  setShowDropdown(false);
                } else if (e.key === 'Escape') {
                  setShowDropdown(false);
                } else if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className="pr-8"
            />
            {options.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          <Button 
            type="button" 
            size="icon" 
            variant="outline"
            onClick={() => {
              addArrayItem(field as string);
              setShowDropdown(false);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Dropdown Options */}
        {showDropdown && filteredOptions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto">
            {filteredOptions.slice(0, 8).map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b border-border last:border-b-0 focus:outline-none focus:bg-muted"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">✓</span>
                  {option}
                </div>
              </button>
            ))}
            {filteredOptions.length > 8 && (
              <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                +{filteredOptions.length - 8} more options available
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className="gap-1 py-1 px-2">
            {item}
            <button
              type="button"
              onClick={() => removeArrayItem(field as string, index)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
});

export const AITrainingConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<TrainingConfig[]>([]);
  const [settings, setSettings] = useState<TrainingSettings | null>(null);
  const [activeDomain, setActiveDomain] = useState<string>('Sales');
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { data: configData, error: configError } = await supabase
        .from('ai_training_configs')
        .select('*');

      if (configError) throw configError;

      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_training_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      setConfigs(configData || []);
      setSettings(settingsData);
      
      if (configData && configData.length > 0) {
        setActiveDomain(configData[0].domain);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load training configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (config: TrainingConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_training_configs')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: `${config.domain} training configuration updated successfully`,
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTraining = async (enabled: boolean) => {
    try {
      if (settings) {
        const { error } = await supabase
          .from('ai_training_settings')
          .update({ 
            apply_training_rules: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (error) throw error;
      }

      setSettings(prev => prev ? { ...prev, apply_training_rules: enabled } : null);
      toast({
        title: enabled ? 'Training Rules Enabled' : 'Training Rules Disabled',
        description: enabled 
          ? 'AI will now use your custom training rules for resume evaluation' 
          : 'AI will use default evaluation criteria',
      });
    } catch (error) {
      console.error('Error toggling training:', error);
      toast({
        title: 'Error',
        description: 'Failed to update training settings',
        variant: 'destructive',
      });
    }
  };

  const updateConfigField = useCallback((domain: string, field: keyof TrainingConfig, value: any) => {
    setConfigs(prev => prev.map(c => 
      c.domain === domain ? { ...c, [field]: value } : c
    ));
  }, []);

  const addArrayItem = useCallback((domain: string, field: keyof TrainingConfig, value: string) => {
    if (!value.trim()) return;
    setConfigs(prev => prev.map(c => {
      if (c.domain === domain) {
        const currentArray = (c[field] as string[]) || [];
        if (!currentArray.includes(value.trim())) {
          return { ...c, [field]: [...currentArray, value.trim()] };
        }
      }
      return c;
    }));
    setNewItemInputs(prev => ({ ...prev, [`${domain}-${field}`]: '' }));
  }, []);

  const removeArrayItem = useCallback((domain: string, field: keyof TrainingConfig, index: number) => {
    setConfigs(prev => prev.map(c => {
      if (c.domain === domain) {
        const currentArray = [...(c[field] as string[])];
        currentArray.splice(index, 1);
        return { ...c, [field]: currentArray };
      }
      return c;
    }));
  }, []);

  const getInputValue = useCallback((domain: string, field: string) => {
    return newItemInputs[`${domain}-${field}`] || '';
  }, [newItemInputs]);

  const setInputValue = useCallback((domain: string, field: string, value: string) => {
    setNewItemInputs(prev => ({ ...prev, [`${domain}-${field}`]: value }));
  }, []);

  // Wrapper functions for ArrayFieldEditor to use simplified signatures
  const getFieldInput = useCallback((field: string) => {
    return getInputValue(activeDomain, field);
  }, [getInputValue, activeDomain]);

  const setFieldInput = useCallback((field: string, value: string) => {
    setInputValue(activeDomain, field, value);
  }, [setInputValue, activeDomain]);

  const addFieldItem = useCallback((field: string) => {
    const value = getInputValue(activeDomain, field);
    addArrayItem(activeDomain, field as keyof TrainingConfig, value);
  }, [addArrayItem, getInputValue, activeDomain]);

  const removeFieldItem = useCallback((field: string, index: number) => {
    removeArrayItem(activeDomain, field as keyof TrainingConfig, index);
  }, [removeArrayItem, activeDomain]);

  const activeConfig = configs.find(c => c.domain === activeDomain);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Toggle */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Resume Training</CardTitle>
                <CardDescription>
                  Customize how AI evaluates resumes based on your company standards
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {settings?.apply_training_rules ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={settings?.apply_training_rules || false}
                onCheckedChange={handleToggleTraining}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Domain Tabs */}
      <Tabs value={activeDomain} onValueChange={setActiveDomain}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          {configs.map(config => (
            <TabsTrigger key={config.domain} value={config.domain} className="gap-2">
              {config.domain === 'Sales' ? <Target className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {config.domain}
            </TabsTrigger>
          ))}
        </TabsList>

        {configs.map(config => (
          <TabsContent key={config.domain} value={config.domain} className="space-y-6">
            {/* Experience & Background */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Experience Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Minimum Years of Experience</Label>
                    <Input
                      type="number"
                      min="0"
                      value={config.min_experience_years}
                      onChange={(e) => updateConfigField(config.domain, 'min_experience_years', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Experience Weightage (%)</Label>
                    <div className="pt-2">
                      <Slider
                        value={[config.experience_weightage]}
                        min={0}
                        max={50}
                        step={5}
                        onValueChange={(value) => updateConfigField(config.domain, 'experience_weightage', value[0])}
                      />
                      <span className="text-sm text-muted-foreground">{config.experience_weightage}%</span>
                    </div>
                  </div>
                </div>
                <ArrayFieldEditor
                  label="Preferred Backgrounds"
                  icon={Briefcase}
                  field="preferred_backgrounds"
                  placeholder="e.g., B2B Sales, Enterprise, SaaS"
                  description="Industry or role backgrounds you prefer in candidates"
                  activeConfig={activeConfig}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Skills & Competencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ArrayFieldEditor
                  label="Required Skills"
                  icon={Target}
                  field="required_skills"
                  placeholder="e.g., Negotiation, CRM proficiency"
                  description="Must-have skills for this role"
                  activeConfig={activeConfig}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
                <div className="space-y-2">
                  <Label>Skills Weightage (%)</Label>
                  <div className="pt-2">
                    <Slider
                      value={[config.skill_weightage]}
                      min={0}
                      max={50}
                      step={5}
                      onValueChange={(value) => updateConfigField(config.domain, 'skill_weightage', value[0])}
                    />
                    <span className="text-sm text-muted-foreground">{config.skill_weightage}%</span>
                  </div>
                </div>
                {config.domain === 'CRM' && (
                  <ArrayFieldEditor
                    label="CRM Tools Knowledge"
                    icon={Settings}
                    field="crm_tools"
                    placeholder="e.g., Freshdesk, Zendesk, Salesforce"
                    description="Required CRM tool proficiency"
                    activeConfig={activeConfig}
                    activeDomain={activeDomain}
                    getInputValue={getFieldInput}
                    setInputValue={setFieldInput}
                    addArrayItem={addFieldItem}
                    removeArrayItem={removeFieldItem}
                  />
                )}
              </CardContent>
            </Card>

            {/* Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Communication & Soft Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ArrayFieldEditor
                  label="Communication Indicators"
                  icon={MessageSquare}
                  field="communication_indicators"
                  placeholder="e.g., Persuasion, Active listening"
                  description="Signs of good communication skills to look for"
                  activeConfig={activeConfig}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
                <div className="space-y-2">
                  <Label>Communication Weightage (%)</Label>
                  <div className="pt-2">
                    <Slider
                      value={[config.communication_weightage]}
                      min={0}
                      max={50}
                      step={5}
                      onValueChange={(value) => updateConfigField(config.domain, 'communication_weightage', value[0])}
                    />
                    <span className="text-sm text-muted-foreground">{config.communication_weightage}%</span>
                  </div>
                </div>
                <ArrayFieldEditor
                  label="Required Behavioral Traits"
                  icon={Users}
                  field="required_behavioral_traits"
                  placeholder="e.g., Self-motivated, Resilient"
                  description="Personality traits that fit your company culture"
                  activeConfig={activeConfig}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-5 w-5 text-primary" />
                  Achievement Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ArrayFieldEditor
                  label="Achievement Indicators"
                  icon={Award}
                  field="achievement_indicators"
                  placeholder="e.g., Revenue targets met, Quota achievement"
                  description="Types of achievements that indicate strong candidates"
                  activeConfig={activeConfig}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
                <div className="space-y-2">
                  <Label>Achievements Weightage (%)</Label>
                  <div className="pt-2">
                    <Slider
                      value={[config.achievement_weightage]}
                      min={0}
                      max={50}
                      step={5}
                      onValueChange={(value) => updateConfigField(config.domain, 'achievement_weightage', value[0])}
                    />
                    <span className="text-sm text-muted-foreground">{config.achievement_weightage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Red Flags & Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Red Flags & Keywords
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ArrayFieldEditor
                  label="Red Flags to Watch For"
                  icon={AlertTriangle}
                  field="red_flags"
                  placeholder="e.g., Frequent job changes, Employment gaps"
                  description="Warning signs that should lower the candidate score"
                  activeConfig={activeConfig}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
                <ArrayFieldEditor
                  label="Positive Keywords"
                  icon={Target}
                  field="positive_keywords"
                  placeholder="e.g., Target, Revenue, Growth"
                  description="Keywords that indicate a good fit"
                  activeConfig={config}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
                <ArrayFieldEditor
                  label="Negative Keywords"
                  icon={AlertTriangle}
                  field="negative_keywords"
                  placeholder="e.g., Entry-level only, No management"
                  description="Keywords that may indicate a poor fit"
                  activeConfig={config}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
              </CardContent>
            </Card>

            {/* Industries & Roles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Preferred Industries & Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ArrayFieldEditor
                  label="Preferred Industries"
                  icon={Briefcase}
                  field="preferred_industries"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  description="Industries where experience is valued"
                  activeConfig={config}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
                <ArrayFieldEditor
                  label="Preferred Previous Roles"
                  icon={Users}
                  field="preferred_roles"
                  placeholder="e.g., Account Executive, Sales Manager"
                  description="Job titles that indicate relevant experience"
                  activeConfig={config}
                  activeDomain={activeDomain}
                  getInputValue={getFieldInput}
                  setInputValue={setFieldInput}
                  addArrayItem={addFieldItem}
                  removeArrayItem={removeFieldItem}
                />
              </CardContent>
            </Card>

            {/* Additional Weightages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-5 w-5 text-primary" />
                  Additional Weightages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Career Progression Weightage (%)</Label>
                    <div className="pt-2">
                      <Slider
                        value={[config.progression_weightage]}
                        min={0}
                        max={50}
                        step={5}
                        onValueChange={(value) => updateConfigField(config.domain, 'progression_weightage', value[0])}
                      />
                      <span className="text-sm text-muted-foreground">{config.progression_weightage}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cultural Fit Weightage (%)</Label>
                    <div className="pt-2">
                      <Slider
                        value={[config.cultural_fit_weightage]}
                        min={0}
                        max={50}
                        step={5}
                        onValueChange={(value) => updateConfigField(config.domain, 'cultural_fit_weightage', value[0])}
                      />
                      <span className="text-sm text-muted-foreground">{config.cultural_fit_weightage}%</span>
                    </div>
                  </div>
                </div>
                {config.domain === 'CRM' && (
                  <div className="space-y-2">
                    <Label>Conflict Handling Importance (%)</Label>
                    <div className="pt-2">
                      <Slider
                        value={[config.conflict_handling_importance]}
                        min={0}
                        max={100}
                        step={10}
                        onValueChange={(value) => updateConfigField(config.domain, 'conflict_handling_importance', value[0])}
                      />
                      <span className="text-sm text-muted-foreground">{config.conflict_handling_importance}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Evaluation Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any additional instructions or notes for the AI evaluation..."
                  value={config.evaluation_notes || ''}
                  onChange={(e) => updateConfigField(config.domain, 'evaluation_notes', e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={() => handleSaveConfig(config)} 
                disabled={saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save {config.domain} Configuration
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};