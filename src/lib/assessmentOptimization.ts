import { supabase } from '@/integrations/supabase/client';

export interface AssessmentProgress {
  scorecard_completed: boolean;
  red_flags_completed: boolean;
  behavioral_completed: boolean;
  completed_at?: string;
}

export interface AssessmentData {
  scorecard: any;
  redFlags: any[];
  callSimulation: any;
  progress: AssessmentProgress;
}

// Verify all three stages are completed for comprehensive AI analysis
export const verifyAssessmentCompletion = async (
  resumeId: string, 
  userId: string
): Promise<AssessmentProgress> => {
  try {
    // Check assessment progress table
    const { data: progress } = await supabase
      .from('assessment_progress')
      .select('*')
      .eq('resume_id', resumeId)
      .eq('user_id', userId)
      .single();

    if (progress) {
      return {
        scorecard_completed: progress.scorecard_completed || false,
        red_flags_completed: progress.red_flags_completed || false,
        behavioral_completed: progress.behavioral_completed || false,
        completed_at: progress.completed_at
      };
    }

    // Fallback: Check individual tables for completion
    const [scorecardData, redFlagsData, callData] = await Promise.all([
      supabase
        .from('resume_scores')
        .select('id')
        .eq('resume_id', resumeId)
        .eq('user_id', userId)
        .single(),
      supabase
        .from('red_flags')
        .select('id')
        .eq('resume_id', resumeId)
        .eq('user_id', userId)
        .limit(1),
      supabase
        .from('call_simulations')
        .select('id')
        .eq('resume_id', resumeId)
        .eq('user_id', userId)
        .single()
    ]);

    const progressData = {
      scorecard_completed: !!scorecardData.data,
      red_flags_completed: (redFlagsData.data?.length || 0) > 0,
      behavioral_completed: !!callData.data,
    };

    // Create or update progress record
    await supabase
      .from('assessment_progress')
      .upsert({
        resume_id: resumeId,
        user_id: userId,
        ...progressData,
        completed_at: (progressData.scorecard_completed && 
                      progressData.red_flags_completed && 
                      progressData.behavioral_completed) 
                      ? new Date().toISOString() 
                      : null
      });

    return {
      ...progressData,
      completed_at: (progressData.scorecard_completed && 
                    progressData.red_flags_completed && 
                    progressData.behavioral_completed) 
                    ? new Date().toISOString() 
                    : undefined
    };
  } catch (error) {
    console.error('Error verifying assessment completion:', error);
    return {
      scorecard_completed: false,
      red_flags_completed: false,
      behavioral_completed: false,
    };
  }
};

// Load all assessment data for comprehensive analysis
export const loadCompleteAssessmentData = async (
  resumeId: string, 
  userId: string
): Promise<AssessmentData> => {
  try {
    const [scorecardResult, redFlagsResult, callResult, progressResult] = await Promise.all([
      supabase
        .from('resume_scores')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('red_flags')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', userId),
      supabase
        .from('call_simulations')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),
      verifyAssessmentCompletion(resumeId, userId)
    ]);

    // Get the latest scorecard and call simulation (first item from ordered results)
    const latestScorecard = scorecardResult.data && scorecardResult.data.length > 0 
      ? scorecardResult.data[0] 
      : null;
    const latestCallSim = callResult.data && callResult.data.length > 0 
      ? callResult.data[0] 
      : null;

    console.log('Loaded assessment data:', {
      hasScorecard: !!latestScorecard,
      scorecardScore: latestScorecard?.total_score,
      redFlagsCount: redFlagsResult.data?.length || 0,
      hasCallSim: !!latestCallSim
    });

    return {
      scorecard: latestScorecard,
      redFlags: redFlagsResult.data || [],
      callSimulation: latestCallSim,
      progress: progressResult
    };
  } catch (error) {
    console.error('Error loading assessment data:', error);
    return {
      scorecard: null,
      redFlags: [],
      callSimulation: null,
      progress: {
        scorecard_completed: false,
        red_flags_completed: false,
        behavioral_completed: false,
      }
    };
  }
};

// Trigger AI analysis with all three stages of data
export const triggerComprehensiveAIAnalysis = async (
  resumeId: string,
  resumeText: string,
  assessmentData: AssessmentData,
  department: string
): Promise<any> => {
  try {
    console.log('Triggering comprehensive AI analysis with:', {
      resumeId,
      hasScorecard: !!assessmentData.scorecard,
      redFlagsCount: assessmentData.redFlags.length,
      hasCallSim: !!assessmentData.callSimulation,
      progress: assessmentData.progress
    });

    const analysisPayload = {
      resume_text: resumeText,
      department: department,
      user_scorecard: assessmentData.scorecard,
      user_red_flags: assessmentData.redFlags,
      user_call_simulation: assessmentData.callSimulation,
      assessment_complete: (
        assessmentData.progress.scorecard_completed &&
        assessmentData.progress.red_flags_completed &&
        assessmentData.progress.behavioral_completed
      )
    };

    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: analysisPayload
    });

    if (error) {
      console.error('AI Analysis error:', error);
      throw error;
    }

    console.log('AI Analysis completed:', data);
    return data;
  } catch (error) {
    console.error('Error in comprehensive AI analysis:', error);
    throw error;
  }
};

// Optimize data loading with caching and minimal requests
export const optimizedLoadAssessment = async (
  resumeId: string, 
  userId: string
): Promise<{ 
  data: AssessmentData; 
  needsCompletion: string[]; 
  canAnalyze: boolean; 
}> => {
  const data = await loadCompleteAssessmentData(resumeId, userId);
  
  const needsCompletion = [];
  if (!data.progress.scorecard_completed) needsCompletion.push('Scorecard');
  if (!data.progress.red_flags_completed) needsCompletion.push('Red Flags');
  if (!data.progress.behavioral_completed) needsCompletion.push('Screening Call');
  
  const canAnalyze = needsCompletion.length === 0;
  
  return {
    data,
    needsCompletion,
    canAnalyze
  };
};

// Usage tracking interfaces for free screening
export interface FreeScreenUsage {
  ip_address: string;
  session_id?: string;
  usage_count: number;
  last_used: string;
}

// Check daily usage limits for free screening
export const checkFreeScreenUsage = async (ipAddress: string, sessionId?: string): Promise<{ canUse: boolean; usageCount: number; resetTime?: Date }> => {
  try {
    // For development, allow 2 uses per session
    const storageKey = `free_screen_usage_${ipAddress}`;
    const stored = localStorage.getItem(storageKey);
    const usageData = stored ? JSON.parse(stored) : { count: 0, date: new Date().toDateString() };
    
    // Reset count if it's a new day
    const today = new Date().toDateString();
    if (usageData.date !== today) {
      usageData.count = 0;
      usageData.date = today;
      localStorage.setItem(storageKey, JSON.stringify(usageData));
    }
    
    const canUse = usageData.count < 2;
    
    // Calculate reset time (tomorrow at midnight)
    const resetTime = new Date();
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0, 0, 0, 0);

    return { canUse, usageCount: usageData.count, resetTime };
  } catch (error) {
    console.error('Error in checkFreeScreenUsage:', error);
    return { canUse: true, usageCount: 0 };
  }
};

// Track free screening usage
export const trackFreeScreenUsage = async (ipAddress: string, sessionId?: string): Promise<void> => {
  try {
    // For development, use localStorage
    const storageKey = `free_screen_usage_${ipAddress}`;
    const stored = localStorage.getItem(storageKey);
    const usageData = stored ? JSON.parse(stored) : { count: 0, date: new Date().toDateString() };
    
    // Reset count if it's a new day
    const today = new Date().toDateString();
    if (usageData.date !== today) {
      usageData.count = 0;
      usageData.date = today;
    }
    
    usageData.count += 1;
    localStorage.setItem(storageKey, JSON.stringify(usageData));
    
    console.log('Usage tracked:', usageData);
  } catch (error) {
    console.error('Error tracking free screen usage:', error);
  }
};

// Simplified AI analysis for free screening (no assessments required)
export const triggerFreeScreenAIAnalysis = async (
  resumeText: string,
  jobDescription: string,
  department: string = 'General'
): Promise<any> => {
  try {
    console.log('Triggering free screen AI analysis with:', {
      resumeLength: resumeText.length,
      jobDescLength: jobDescription.length,
      department
    });

    const analysisPayload = {
      resume_text: resumeText,
      job_description: jobDescription,
      department: department,
      assessment_complete: false,
      free_screen_mode: true,
      basic_fitment_only: true
    };

    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: analysisPayload
    });

    if (error) {
      console.error('Free Screen AI Analysis error:', error);
      throw error;
    }

    console.log('Free Screen AI Analysis completed:', data);
    return data;
  } catch (error) {
    console.error('Error in free screen AI analysis:', error);
    throw error;
  }
};