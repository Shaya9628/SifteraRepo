export const SCORE_WEIGHTS = {
  relevant_experience: { max: 30, label: 'Relevant Experience' },
  skills_certifications: { max: 25, label: 'Skills & Certifications' },
  career_progression: { max: 20, label: 'Career Progression' },
  achievements: { max: 15, label: 'Achievements' },
  communication_clarity: { max: 10, label: 'Communication Clarity' },
} as const;

export const RED_FLAGS = {
  frequent_job_changes: {
    label: 'Frequent Job Changes',
    description: 'Multiple jobs in short periods without clear progression',
    hint: 'Look for 3+ jobs in 2 years or job hopping pattern'
  },
  vague_descriptions: {
    label: 'Vague Job Descriptions',
    description: 'Lacks specific responsibilities or accomplishments',
    hint: 'Generic phrases like "responsible for tasks" without details'
  },
  lack_of_achievements: {
    label: 'No Measurable Achievements',
    description: 'No quantifiable results or impact mentioned',
    hint: 'Missing metrics, percentages, or concrete outcomes'
  },
  employment_gaps: {
    label: 'Unexplained Employment Gaps',
    description: 'Gaps of 6+ months without explanation',
    hint: 'Look for missing time periods between jobs'
  },
} as const;

export const CALL_QUESTIONS = {
  behavioral: [
    'Tell me about a time you exceeded sales targets',
    'Describe a situation where you handled a difficult customer',
    'Give an example of when you worked under pressure',
    'How do you prioritize multiple competing tasks?',
  ],
  cultural_fit: [
    'What motivates you in your work?',
    'How do you handle feedback and criticism?',
    'Describe your ideal work environment',
    'What are your long-term career goals?',
  ],
} as const;

export const HR_THEORIES = {
  competency_based: {
    title: 'Competency-Based Recruitment',
    tooltip: 'Focuses on identifying specific skills, behaviors, and attributes needed for job success'
  },
  person_org_fit: {
    title: 'Person–Organization Fit',
    tooltip: 'Assesses alignment between candidate values and company culture'
  },
  behavioral_interviewing: {
    title: 'Behavioral Interviewing',
    tooltip: 'Past behavior predicts future performance - use STAR method (Situation, Task, Action, Result)'
  },
  pareto_principle: {
    title: 'Pareto Principle (80/20)',
    tooltip: '80% of results come from 20% of efforts - focus on high-impact screening criteria'
  },
  structured_recruitment: {
    title: 'Structured Recruitment',
    tooltip: 'Standardized process ensures fairness and improves hiring quality'
  },
} as const;
