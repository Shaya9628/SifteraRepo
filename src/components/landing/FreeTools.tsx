import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Zap, 
  Upload, 
  Target, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Users,
  Clock,
  Star
} from 'lucide-react';

const FreeTools = () => {
  const navigate = useNavigate();

  const freeTools = [
    {
      title: 'AI Resume Screening',
      description: 'Get instant AI-powered resume analysis. Upload resume + job description for smart fitment scoring.',
      icon: <FileText className="w-8 h-8 text-emerald-500" />,
      features: ['Instant Analysis', 'Skills Matching', 'Fitment Score'],
      action: () => navigate('/free-screen'),
      buttonText: 'Screen Resume Now',
      badge: 'Most Popular',
      color: 'emerald'
    },
    {
      title: 'Training Modules',
      description: 'Interactive HR training modules to improve your resume screening and interview skills.',
      icon: <Target className="w-8 h-8 text-blue-500" />,
      features: ['Interactive Learning', 'Skill Building', 'Certification'],
      action: () => navigate('/auth'),
      buttonText: 'Start Training',
      badge: 'Premium',
      color: 'blue'
    },
    {
      title: 'Call Simulator',
      description: 'Practice interview calls with AI-powered simulation for better candidate evaluation.',
      icon: <Users className="w-8 h-8 text-purple-500" />,
      features: ['AI Simulation', 'Real Scenarios', 'Feedback'],
      action: () => navigate('/auth'),
      buttonText: 'Try Simulator',
      badge: 'Premium',
      color: 'purple'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            Free HR Tools
          </div>
          
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6">
            <span className="text-gradient">Everything you need to screen</span>
            <br />
            <span className="text-gradient">resumes like a pro</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            All tools you need for better hiring decisions, right at your fingertips. 
            <span className="font-semibold text-emerald-600 dark:text-emerald-400"> All 100% FREE</span> to get started!
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>500+ HR Professionals</span>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {freeTools.map((tool, index) => (
            <Card 
              key={index} 
              className={`glass hover:glow-${tool.color} transition-all duration-300 group cursor-pointer border-2 hover:border-${tool.color}-400/50 hover:scale-[1.02] relative overflow-hidden`}
              onClick={tool.action}
            >
              {/* Badge */}
              {tool.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge 
                    className={`${
                      tool.badge === 'Most Popular' 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : 'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
                    } font-semibold text-xs`}
                  >
                    {tool.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-2xl bg-${tool.color}-500/10 group-hover:bg-${tool.color}-500/20 transition-colors`}>
                    {tool.icon}
                  </div>
                </div>
                
                <CardTitle className="text-xl font-bold group-hover:text-gradient transition-colors">
                  {tool.title}
                </CardTitle>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {tool.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-2">
                  {tool.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 text-${tool.color}-500`} />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <Button 
                  className={`w-full group-hover:shadow-lg group-hover:shadow-${tool.color}-500/25 transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600' 
                      : 'bg-gradient-primary hover:bg-gradient-secondary'
                  }`}
                  size="lg"
                >
                  {tool.buttonText}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>

              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br from-${tool.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}></div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-card/50 backdrop-blur border border-primary/20 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <div className="text-left">
                <p className="font-semibold">Ready for advanced features?</p>
                <p className="text-sm text-muted-foreground">Unlock training modules, call simulation, and more</p>
              </div>
            </div>
            <Button 
              className="bg-gradient-primary hover:bg-gradient-secondary"
              onClick={() => navigate('/auth')}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FreeTools;