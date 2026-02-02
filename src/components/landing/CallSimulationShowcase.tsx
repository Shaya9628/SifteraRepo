import { Phone, Play, Brain, MessageSquare, CheckCircle, ArrowRight, Headphones, Mic, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import callSimulationHero from '@/assets/call-simulation-hero.jpg';
import callSimulationUser from '@/assets/call-simulation-user.jpg';
import aiFeedbackVisual from '@/assets/ai-feedback-visual.jpg';

const CallSimulationShowcase = () => {
  const navigate = useNavigate();

  const assessmentStages = [
    {
      number: '01',
      title: 'Screening Scorecard',
      description: 'Evaluate resumes with structured criteria and compare your scores with AI analysis.',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: '02', 
      title: 'Red Flags Detection',
      description: 'Identify potential concerns in candidate profiles with guided learning.',
      icon: CheckCircle,
      color: 'from-amber-500 to-orange-500',
    },
    {
      number: '03',
      title: 'Call Simulation',
      description: 'Practice real screening calls, give feedback, and learn from AI coaching.',
      icon: Phone,
      color: 'from-primary to-accent',
      highlight: true,
    },
  ];

  const callFeatures = [
    { icon: Headphones, text: 'Real-time call practice' },
    { icon: Mic, text: 'Record your feedback' },
    { icon: Brain, text: 'AI-powered coaching' },
    { icon: MessageSquare, text: 'Detailed insights' },
  ];

  return (
    <section id="call-simulation" className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/30 to-accent/30 text-primary text-sm font-bold mb-6 border border-primary/50 animate-pulse">
            <Phone className="w-4 h-4" />
            Our Key Differentiator
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
              Real Call Simulation
            </span>{' '}
            <br className="hidden md:block" />
            with AI Coaching
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Go beyond resume screening. Practice actual screening calls with candidates, 
            record your feedback, and get personalized AI coaching to improve your interviewing skills.
          </p>
        </div>

        {/* 3 Stage Assessment Flow */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {assessmentStages.map((stage, index) => (
            <div
              key={index}
              className={`relative p-6 rounded-3xl border transition-all duration-300 group ${
                stage.highlight
                  ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50 shadow-2xl shadow-primary/20 scale-105'
                  : 'bg-card border-border hover:border-primary/30 hover:shadow-lg'
              }`}
            >
              {stage.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold rounded-full">
                  ⭐ KEY FEATURE
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stage.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="text-xs font-bold text-muted-foreground mb-2">STAGE {stage.number}</div>
              <h3 className={`text-xl font-bold mb-2 ${stage.highlight ? 'text-primary' : ''}`}>
                {stage.title}
              </h3>
              <p className="text-sm text-muted-foreground">{stage.description}</p>
              
              {/* Connector Arrow */}
              {index < assessmentStages.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-6 h-6 text-primary/50" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hero Video-Style Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-20">
          {/* Left - Video Preview Style */}
          <div className="relative group">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/30 border-4 border-primary/20">
              <img 
                src={callSimulationHero} 
                alt="HR professional conducting screening call"
                className="w-full h-auto object-cover"
              />
              {/* Video Overlay Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-primary hover:scale-110 transition-all shadow-xl shadow-primary/50 animate-pulse">
                  <Play className="w-8 h-8 text-primary-foreground ml-1" />
                </div>
              </div>
              
              {/* Bottom Info Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img src={callSimulationUser} alt="User" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-primary flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-bold">Live Call Simulation</div>
                    <div className="text-white/70 text-sm">Practice with real scenarios</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border border-border animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">92%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div>
            <h3 className="text-2xl md:text-4xl font-bold mb-6">
              Practice Makes Perfect: 
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {' '}Real Call Experience
              </span>
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Unlike other training platforms, Siftera lets you conduct actual simulated screening calls. 
              Input your feedback in real-time, and our AI analyzes your performance to help you become a better interviewer.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {callFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              Try Call Simulation Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* AI Feedback Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left - Content */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium mb-4">
              <Brain className="w-4 h-4" />
              AI-Powered Learning
            </div>
            <h3 className="text-2xl md:text-4xl font-bold mb-6">
              Get Personalized 
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                {' '}AI Feedback
              </span>
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              After each call simulation, our AI analyzes your performance across multiple dimensions:
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                'Communication clarity and professionalism',
                'Question relevance and depth',
                'Red flag identification accuracy',
                'Overall candidate assessment quality',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground italic border-l-4 border-primary pl-4">
              "The AI coaching helped me improve my screening accuracy by 40% in just 2 weeks!"
              <span className="block mt-2 font-semibold text-foreground not-italic">— Sarah M., HR Manager</span>
            </p>
          </div>

          {/* Right - AI Visual */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-accent/30 border-2 border-accent/30">
              <img 
                src={aiFeedbackVisual}
                alt="AI Feedback Analysis"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              
              {/* Floating Metrics */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Clarity', value: '94%' },
                    { label: 'Depth', value: '87%' },
                    { label: 'Accuracy', value: '91%' },
                  ].map((metric, index) => (
                    <div key={index} className="bg-card/90 backdrop-blur-sm rounded-xl p-3 text-center border border-border">
                      <div className="text-2xl font-bold text-primary">{metric.value}</div>
                      <div className="text-xs text-muted-foreground">{metric.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallSimulationShowcase;
