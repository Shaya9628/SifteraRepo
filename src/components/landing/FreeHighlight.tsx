import { FileText, Brain, TrendingUp, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FreeHighlight = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: '2 Free Resume Uploads',
      description: 'Get started instantly with two free resume uploads. No credit card required, no hidden fees.',
      highlight: 'Free Forever',
    },
    {
      icon: Brain,
      title: 'AI-Powered Insights',
      description: 'Receive instant analysis including red flag detection, skill matching, and candidate scoring.',
      highlight: 'Instant Results',
    },
    {
      icon: TrendingUp,
      title: 'Track Your Progress',
      description: 'Compare your assessments with AI recommendations and measure your improvement over time.',
      highlight: 'Continuous Learning',
    },
  ];

  const benefits = [
    { icon: Shield, text: 'Red Flag Detection' },
    { icon: Zap, text: 'Instant Scoring' },
    { icon: Sparkles, text: 'AI Recommendations' },
  ];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 via-background to-background dark:from-emerald-950/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold mb-6 border border-emerald-500/30">
            <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-xs uppercase">Free</span>
            No Credit Card Required
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Build Confidence{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">Risk-Free</span>
          </h2>
          
          <p className="text-xl text-muted-foreground">
            Start your confidence-building journey with 2 free resume uploads. 
            No pressure, just pure learning and skill development.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-8 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group"
            >
              {/* Highlight Badge */}
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                {feature.highlight}
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7 text-emerald-500" />
              </div>

              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits Bar */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
            >
              <benefit.icon className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="text-lg px-10 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all"
          >
            <Sparkles className="mr-2 w-5 h-5" />
            Get Started Free
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            2 free uploads • No credit card • Instant AI analysis
          </p>
        </div>
      </div>
    </section>
  );
};

export default FreeHighlight;
