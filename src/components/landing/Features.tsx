import { Brain, Trophy, Users, Zap, BarChart3, Shield, Star, Rocket } from 'lucide-react';
import featureAiScoring from '@/assets/feature-ai-scoring.jpg';
import featureTeamCollaboration from '@/assets/feature-team-collaboration.jpg';
import featureGamification from '@/assets/feature-gamification.jpg';
import featureDualScoring from '@/assets/feature-dual-scoring.jpg';

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: 'User + AI Dual Scoring',
      description: 'Score resumes with your own expertise, then compare with our AI analysis. Learn from discrepancies and improve your screening accuracy over time.',
      highlights: ['Your score vs AI score', 'Comparative analysis', 'Learning insights', 'Skill improvement tracking'],
      image: featureAiScoring,
    },
    {
      icon: Trophy,
      title: 'Gamification & Achievements',
      description: 'Earn badges, accumulate points, and compete on leaderboards. Learning becomes engaging when there\'s recognition involved.',
      highlights: ['Achievement badges', 'Points system', 'Weekly challenges', 'Team competitions'],
      image: featureGamification,
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Create workspaces for your HR team, compare scoring patterns, and ensure everyone follows the same screening standards.',
      highlights: ['Shared workspaces', 'Calibration sessions', 'Peer learning', 'Manager dashboards'],
      image: featureTeamCollaboration,
    },
    {
      icon: Zap,
      title: 'Dual Scoring Insights',
      description: 'See both your assessment and AI analysis side-by-side. Understand scoring differences, learn from AI expertise, and build confidence in your decisions.',
      highlights: ['Side-by-side comparison', 'Score reasoning', 'Learning recommendations', 'Decision confidence'],
      image: featureDualScoring,
    },
  ];

  const additionalFeatures = [
    { icon: BarChart3, title: 'Advanced Analytics', description: 'Deep insights into team performance and trends', color: 'from-blue-500 to-cyan-500' },
    { icon: Shield, title: 'Enterprise Security', description: 'SOC 2 compliant with encrypted data storage', color: 'from-emerald-500 to-teal-500' },
    { icon: Star, title: 'Custom Rubrics', description: 'Create scoring criteria specific to your roles', color: 'from-amber-500 to-orange-500' },
    { icon: Rocket, title: 'API Access', description: 'Integrate with your existing HR systems', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <section id="features" className="py-20 md:py-32 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary text-sm font-medium mb-6 border border-primary/30">
            <Zap className="w-4 h-4" />
            Powerful Features
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            How Siftera Builds Your{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              HR Confidence
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Intelligent HR and skill management features designed to transform your recruitment process.
          </p>
        </div>

        {/* Main Features */}
        <div className="space-y-32 max-w-6xl mx-auto mb-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } gap-12 items-center`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{feature.title}</h3>
                <p className="text-lg text-muted-foreground mb-6">{feature.description}</p>
                <ul className="grid grid-cols-2 gap-4">
                  {feature.highlights.map((highlight, hIndex) => (
                    <li key={hIndex} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                      <span className="font-medium">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <div className="flex-1 w-full">
                {feature.image ? (
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border border-primary/20 group">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 group-hover:from-primary/10 group-hover:to-accent/10 transition-all" />
                    <feature.icon className="w-24 h-24 text-primary/30 group-hover:text-primary/50 group-hover:scale-110 transition-all" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {additionalFeatures.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;