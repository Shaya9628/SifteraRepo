export const GLOBAL_DOMAINS = [
  { value: 'sales', label: 'Sales & Business Development', icon: '💼' },
  { value: 'crm', label: 'Customer Relationship Management', icon: '🤝' },
  { value: 'marketing', label: 'Marketing & Digital Marketing', icon: '📈' },
  { value: 'finance', label: 'Finance & Accounting', icon: '💰' },
  { value: 'hr', label: 'Human Resources', icon: '👥' },
  { value: 'it', label: 'Information Technology', icon: '💻' },
  { value: 'operations', label: 'Operations Management', icon: '⚙️' },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: '🏥' },
  { value: 'education', label: 'Education & Training', icon: '🎓' },
  { value: 'engineering', label: 'Engineering & Technical', icon: '🔧' },
  { value: 'consulting', label: 'Consulting & Advisory', icon: '💡' },
  { value: 'retail', label: 'Retail & E-commerce', icon: '🛍️' },
  { value: 'manufacturing', label: 'Manufacturing & Production', icon: '🏭' },
  { value: 'legal', label: 'Legal & Compliance', icon: '⚖️' },
  { value: 'hospitality', label: 'Hospitality & Tourism', icon: '🏨' },
  { value: 'logistics', label: 'Logistics & Supply Chain', icon: '🚚' },
  { value: 'real_estate', label: 'Real Estate & Property', icon: '🏠' },
  { value: 'media', label: 'Media & Communications', icon: '📺' },
  { value: 'nonprofit', label: 'Non-Profit & Social Services', icon: '❤️' },
  { value: 'general', label: 'General/Other', icon: '🌐' }
] as const;

export const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
] as const;

export type Domain = typeof GLOBAL_DOMAINS[number]['value'];
export type CountryCode = typeof COUNTRY_CODES[number]['code'];