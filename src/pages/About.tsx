import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Users, Heart, Zap, Target, Trophy, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const About = () => {
  const navigate = useNavigate();
  
  const values = [
    {
      icon: Heart,
      title: 'Passion-Driven',
      description: 'We\'re obsessed with making HR awesome for everyone! 💖',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Zap,
      title: 'Innovation First',
      description: 'Cutting-edge AI meets human creativity ⚡',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Users,
      title: 'Community Focus',
      description: 'Building the future of work together 🌟',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Target,
      title: 'Results Matter',
      description: 'Your success is our mission! 🎯',
      gradient: 'from-cyan-500 to-blue-500'
    }
  ];

  const stats = [
    { icon: Trophy, value: '500+', label: 'Happy HR Pros', color: 'text-yellow-500' },
    { icon: Star, value: '10K+', label: 'Resumes Analyzed', color: 'text-purple-500' },
    { icon: Zap, value: '95%', label: 'Confidence Boost', color: 'text-cyan-500' },
  ];
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gen Z Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-neon/10 rounded-full blur-3xl animate-spin-slow" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Back Button with Glow */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-8 glass hover:glow-purple transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 
          <span className="font-medium">Back to Home</span>
        </Button>
        
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6 animate-bounce-slow">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>About Our Vibe ✨</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient animate-gradient">
            About{' '}
            <span className="text-gradient-neon">
              Siftera
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            We believe every HR professional deserves to feel{' '}
            <span className="font-bold text-gradient">confident</span> in their screening decisions. 
            That's why we built Siftera - where HR confidence is built through{' '}
            <span className="font-bold text-gradient-sunset">hands-on practice</span>,{' '}
            <span className="font-bold text-gradient-neon">expert feedback</span>, and{' '}
            <span className="font-bold text-gradient">proven methodologies</span>. 🚀
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <Card key={index} className="glass card-hover border-neon group">
              <CardContent className="p-8 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color.replace('text-', 'from-')} to-${stat.color.replace('text-', '').replace('-500', '-600')} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Our Values 💫
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The core principles that drive everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="glass card-hover hover:glow-purple group overflow-hidden">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                    <value.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gradient">{value.title}</h3>
                  <p className="text-muted-foreground text-lg">{value.description}</p>
                  
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="text-center max-w-4xl mx-auto">
          <Card className="glass-strong glow-cyan border-neon p-12">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-bold text-lg mb-6">
                <Heart className="w-5 h-5" />
                Our Mission
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gradient-neon leading-relaxed">
              To revolutionize HR by making every screening decision{' '}
              <span className="emoji-pop">⚡</span> confident,{' '}
              <span className="emoji-pop">🎯</span> accurate, and{' '}
              <span className="emoji-pop">✨</span> impactful!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
