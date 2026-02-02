// Test script to validate the AI analysis fix
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Mock assessment data
const mockAssessmentData = {
  scorecard: {
    experience_score: 75,
    skills_score: 82,
    progression_score: 68,
    achievements_score: 78,
    communication_score: 85,
    cultural_fit_score: 72,
    total_score: 77,
    notes: 'Good candidate overall'
  },
  redFlags: [
    { flag_type: 'gap', description: 'Employment gap of 8 months' }
  ],
  callSimulation: {
    overall_score: 80,
    communication_clarity: 85,
    problem_solving: 75
  },
  progress: {
    scorecard_completed: true,
    red_flags_completed: true,
    behavioral_completed: true
  }
}

const testAnalysis = async () => {
  console.log('Testing AI Analysis...')
  
  try {
    const { data, error } = await supabase.functions.invoke('analyze-resume', {
      body: {
        resume_text: 'John Smith - Software Developer with 5 years experience in React, Node.js, and customer service applications.',
        department: 'CRM',
        user_scorecard: mockAssessmentData.scorecard,
        user_red_flags: mockAssessmentData.redFlags,
        user_call_simulation: mockAssessmentData.callSimulation,
        assessment_complete: true
      }
    })
    
    if (error) {
      console.error('Analysis failed:', error)
      return
    }
    
    console.log('Analysis successful:', {
      ai_total_score: data?.ai_total_score,
      user_total_score: data?.user_total_score,
      has_comparative_feedback: !!data?.comparative_feedback?.length,
      has_red_flags: !!data?.red_flags?.length,
      has_interview_questions: !!data?.interview_questions?.length
    })
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

// Run the test
testAnalysis()