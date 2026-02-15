// Position constants with career progression for all domains
export interface Position {
  value: string;
  label: string;
  level: 'junior' | 'mid' | 'senior' | 'executive';
  description?: string;
  yearRange?: string;
}

export const DOMAIN_POSITIONS = {
  sales: [
    { value: 'sales_rep', label: 'Sales Representative', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'sr_sales_rep', label: 'Senior Sales Representative', level: 'mid' as const, yearRange: '2-4 years' },
    { value: 'account_exec', label: 'Account Executive', level: 'mid' as const, yearRange: '3-6 years' },
    { value: 'sales_manager', label: 'Sales Manager', level: 'senior' as const, yearRange: '5-8 years' },
    { value: 'regional_sales_mgr', label: 'Regional Sales Manager', level: 'senior' as const, yearRange: '6-10 years' },
    { value: 'sales_director', label: 'Sales Director', level: 'executive' as const, yearRange: '8+ years' },
  ],
  
  crm: [
    { value: 'crm_specialist', label: 'CRM Specialist', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'crm_analyst', label: 'CRM Analyst', level: 'mid' as const, yearRange: '2-4 years' },
    { value: 'crm_manager', label: 'CRM Manager', level: 'senior' as const, yearRange: '4-7 years' },
    { value: 'crm_director', label: 'CRM Director', level: 'executive' as const, yearRange: '7+ years' },
  ],

  marketing: [
    { value: 'marketing_coord', label: 'Marketing Coordinator', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'marketing_specialist', label: 'Marketing Specialist', level: 'mid' as const, yearRange: '2-4 years' },
    { value: 'digital_marketer', label: 'Digital Marketing Manager', level: 'mid' as const, yearRange: '3-5 years' },
    { value: 'brand_manager', label: 'Brand Manager', level: 'senior' as const, yearRange: '4-7 years' },
    { value: 'marketing_manager', label: 'Marketing Manager', level: 'senior' as const, yearRange: '5-8 years' },
    { value: 'cmo', label: 'Chief Marketing Officer', level: 'executive' as const, yearRange: '10+ years' },
  ],

  finance: [
    { value: 'financial_analyst', label: 'Financial Analyst', level: 'junior' as const, yearRange: '0-3 years' },
    { value: 'senior_analyst', label: 'Senior Financial Analyst', level: 'mid' as const, yearRange: '3-5 years' },
    { value: 'finance_manager', label: 'Finance Manager', level: 'senior' as const, yearRange: '5-8 years' },
    { value: 'finance_director', label: 'Finance Director', level: 'senior' as const, yearRange: '7-10 years' },
    { value: 'cfo', label: 'Chief Financial Officer', level: 'executive' as const, yearRange: '10+ years' },
  ],

  hr: [
    { value: 'hr_coordinator', label: 'HR Coordinator', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'hr_generalist', label: 'HR Generalist', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'hr_manager', label: 'HR Manager', level: 'senior' as const, yearRange: '4-8 years' },
    { value: 'hr_director', label: 'HR Director', level: 'senior' as const, yearRange: '7-10 years' },
    { value: 'chro', label: 'Chief Human Resources Officer', level: 'executive' as const, yearRange: '10+ years' },
  ],

  it: [
    { value: 'junior_dev', label: 'Junior Developer', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'software_dev', label: 'Software Developer', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'senior_dev', label: 'Senior Developer', level: 'mid' as const, yearRange: '4-7 years' },
    { value: 'tech_lead', label: 'Technical Lead', level: 'senior' as const, yearRange: '6-9 years' },
    { value: 'it_manager', label: 'IT Manager', level: 'senior' as const, yearRange: '7-10 years' },
    { value: 'cto', label: 'Chief Technology Officer', level: 'executive' as const, yearRange: '10+ years' },
  ],

  operations: [
    { value: 'ops_analyst', label: 'Operations Analyst', level: 'junior' as const, yearRange: '0-3 years' },
    { value: 'ops_specialist', label: 'Operations Specialist', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'ops_manager', label: 'Operations Manager', level: 'senior' as const, yearRange: '4-8 years' },
    { value: 'ops_director', label: 'Operations Director', level: 'executive' as const, yearRange: '8+ years' },
  ],

  healthcare: [
    { value: 'healthcare_coord', label: 'Healthcare Coordinator', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'nurse_practitioner', label: 'Nurse Practitioner', level: 'mid' as const, yearRange: '3-7 years' },
    { value: 'healthcare_manager', label: 'Healthcare Manager', level: 'senior' as const, yearRange: '5-10 years' },
    { value: 'medical_director', label: 'Medical Director', level: 'executive' as const, yearRange: '10+ years' },
  ],

  education: [
    { value: 'teaching_assistant', label: 'Teaching Assistant', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'instructor', label: 'Instructor', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'senior_educator', label: 'Senior Educator', level: 'senior' as const, yearRange: '5-10 years' },
    { value: 'education_director', label: 'Education Director', level: 'executive' as const, yearRange: '10+ years' },
  ],

  engineering: [
    { value: 'junior_engineer', label: 'Junior Engineer', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'engineer', label: 'Engineer', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'senior_engineer', label: 'Senior Engineer', level: 'senior' as const, yearRange: '5-8 years' },
    { value: 'principal_engineer', label: 'Principal Engineer', level: 'executive' as const, yearRange: '8+ years' },
  ],

  consulting: [
    { value: 'consultant', label: 'Consultant', level: 'junior' as const, yearRange: '0-3 years' },
    { value: 'senior_consultant', label: 'Senior Consultant', level: 'mid' as const, yearRange: '3-6 years' },
    { value: 'principal_consultant', label: 'Principal Consultant', level: 'senior' as const, yearRange: '6-10 years' },
    { value: 'consulting_director', label: 'Consulting Director', level: 'executive' as const, yearRange: '10+ years' },
  ],

  retail: [
    { value: 'retail_associate', label: 'Retail Associate', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'retail_supervisor', label: 'Retail Supervisor', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'retail_manager', label: 'Retail Manager', level: 'senior' as const, yearRange: '4-8 years' },
    { value: 'retail_director', label: 'Retail Director', level: 'executive' as const, yearRange: '8+ years' },
  ],

  manufacturing: [
    { value: 'production_worker', label: 'Production Worker', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'production_supervisor', label: 'Production Supervisor', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'production_manager', label: 'Production Manager', level: 'senior' as const, yearRange: '5-8 years' },
    { value: 'plant_manager', label: 'Plant Manager', level: 'executive' as const, yearRange: '8+ years' },
  ],

  legal: [
    { value: 'paralegal', label: 'Paralegal', level: 'junior' as const, yearRange: '0-3 years' },
    { value: 'associate_attorney', label: 'Associate Attorney', level: 'mid' as const, yearRange: '1-5 years' },
    { value: 'senior_attorney', label: 'Senior Attorney', level: 'senior' as const, yearRange: '5-10 years' },
    { value: 'general_counsel', label: 'General Counsel', level: 'executive' as const, yearRange: '10+ years' },
  ],

  hospitality: [
    { value: 'hospitality_associate', label: 'Hospitality Associate', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'guest_services_manager', label: 'Guest Services Manager', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'hotel_manager', label: 'Hotel Manager', level: 'senior' as const, yearRange: '5-10 years' },
    { value: 'hospitality_director', label: 'Hospitality Director', level: 'executive' as const, yearRange: '10+ years' },
  ],

  logistics: [
    { value: 'logistics_coord', label: 'Logistics Coordinator', level: 'junior' as const, yearRange: '0-3 years' },
    { value: 'logistics_specialist', label: 'Logistics Specialist', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'logistics_manager', label: 'Logistics Manager', level: 'senior' as const, yearRange: '5-8 years' },
    { value: 'supply_chain_director', label: 'Supply Chain Director', level: 'executive' as const, yearRange: '8+ years' },
  ],

  real_estate: [
    { value: 'real_estate_agent', label: 'Real Estate Agent', level: 'junior' as const, yearRange: '0-3 years' },
    { value: 'senior_agent', label: 'Senior Real Estate Agent', level: 'mid' as const, yearRange: '3-7 years' },
    { value: 'broker', label: 'Real Estate Broker', level: 'senior' as const, yearRange: '5-10 years' },
    { value: 'property_director', label: 'Property Director', level: 'executive' as const, yearRange: '10+ years' },
  ],

  media: [
    { value: 'media_assistant', label: 'Media Assistant', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'content_creator', label: 'Content Creator', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'media_manager', label: 'Media Manager', level: 'senior' as const, yearRange: '4-8 years' },
    { value: 'media_director', label: 'Media Director', level: 'executive' as const, yearRange: '8+ years' },
  ],

  nonprofit: [
    { value: 'program_assistant', label: 'Program Assistant', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'program_coordinator', label: 'Program Coordinator', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'program_manager', label: 'Program Manager', level: 'senior' as const, yearRange: '4-8 years' },
    { value: 'executive_director', label: 'Executive Director', level: 'executive' as const, yearRange: '8+ years' },
  ],

  general: [
    { value: 'entry_level', label: 'Entry Level', level: 'junior' as const, yearRange: '0-2 years' },
    { value: 'mid_level', label: 'Mid Level', level: 'mid' as const, yearRange: '2-5 years' },
    { value: 'senior_level', label: 'Senior Level', level: 'senior' as const, yearRange: '5-10 years' },
    { value: 'executive_level', label: 'Executive Level', level: 'executive' as const, yearRange: '10+ years' },
  ],
} as const;

// Helper functions
export const getPositionsForDomain = (domain: string): Position[] => {
  return [...(DOMAIN_POSITIONS[domain as keyof typeof DOMAIN_POSITIONS] || DOMAIN_POSITIONS.general)];
};

export const getPositionsByLevel = (domain: string, level: 'junior' | 'mid' | 'senior' | 'executive'): Position[] => {
  const positions = getPositionsForDomain(domain);
  return positions.filter(pos => pos.level === level);
};

export const getPositionLabel = (domain: string, positionValue: string): string => {
  const positions = getPositionsForDomain(domain);
  const position = positions.find(pos => pos.value === positionValue);
  return position?.label || 'Unknown Position';
};

// Type exports
export type DomainKey = keyof typeof DOMAIN_POSITIONS;
export type PositionLevel = 'junior' | 'mid' | 'senior' | 'executive';