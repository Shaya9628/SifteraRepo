import { useLandingContent, getContentValue } from '@/hooks/useLandingContent';

const Stats = () => {
  const { data: statsContent } = useLandingContent('stats');

  const stats = [
    { 
      value: getContentValue(statsContent, 'stat_1_value', '50%'), 
      label: getContentValue(statsContent, 'stat_1_label', 'Time Saved on Training'), 
      description: getContentValue(statsContent, 'stat_1_description', 'Reduce onboarding time for new HR hires') 
    },
    { 
      value: getContentValue(statsContent, 'stat_2_value', '95%'), 
      label: getContentValue(statsContent, 'stat_2_label', 'Screening Accuracy'), 
      description: getContentValue(statsContent, 'stat_2_description', 'After completing our training program') 
    },
    { 
      value: getContentValue(statsContent, 'stat_3_value', '3x'), 
      label: getContentValue(statsContent, 'stat_3_label', 'Faster Onboarding'), 
      description: getContentValue(statsContent, 'stat_3_description', 'Get new team members up to speed quickly') 
    },
    { 
      value: getContentValue(statsContent, 'stat_4_value', '10K+'), 
      label: getContentValue(statsContent, 'stat_4_label', 'Resumes Analyzed'), 
      description: getContentValue(statsContent, 'stat_4_description', 'Practice with real-world examples') 
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-5xl md:text-6xl font-extrabold mb-2">{stat.value}</div>
              <div className="text-lg font-semibold mb-1 text-primary-foreground/90">{stat.label}</div>
              <div className="text-sm text-primary-foreground/70">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
