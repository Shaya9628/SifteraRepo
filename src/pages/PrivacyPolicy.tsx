import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Heart, Sparkles, CheckCircle, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  const keyPoints = [
    {
      icon: Shield,
      title: 'Your Data is Protected',
      description: 'We use enterprise-grade security to keep your info safe! 🔒',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'We tell you exactly what we collect and why ✨',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Lock,
      title: 'Your Control',
      description: 'Delete your data anytime, no questions asked! 💯',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Heart,
      title: 'No Selling',
      description: 'We NEVER sell your personal information. Promise! ❤️',
      gradient: 'from-red-500 to-pink-500'
    }
  ];

  const sections = [
    {
      title: '📊 What We Collect',
      content: 'We collect info you give us (like your name and email), stuff about how you use our app (to make it better!), and some technical data (to keep things running smoothly). Nothing creepy, we promise! 😄'
    },
    {
      title: '🎯 Why We Collect It',
      content: 'To make Siftera awesome for you! We use your data to personalize your experience, improve our AI, provide customer support, and send you updates (only the good stuff, no spam!). 🚀'
    },
    {
      title: '🔒 How We Protect It',
      content: 'Your data gets the VIP treatment with encryption, secure servers, regular security audits, and strict access controls. We take security as seriously as we take making HR fun! 💪'
    },
    {
      title: '🤝 Sharing (Spoiler: We Don\'t)',
      content: 'We don\'t sell, rent, or trade your personal info. Ever. The only time we might share data is with trusted service providers (who are also bound by strict privacy rules) or if required by law. 🛡️'
    },
    {
      title: '🍪 Cookies & Tracking',
      content: 'We use cookies to remember your preferences and make your experience smoother. You can control cookie settings in your browser anytime. No sneaky tracking here! 🍪'
    },
    {
      title: '✨ Your Rights',
      content: 'You can access, update, or delete your data anytime. Want to export your info? Just ask! Need to opt out of emails? One click does it. Your data, your choice! 🌟'
    }
  ];
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gen Z Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-neon-purple/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-neon-cyan/20 rounded-full blur-3xl animate-blob" />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-8 glass hover:glow-purple transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> 
          <span className="font-medium">Back to Home</span>
        </Button>
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6 animate-bounce-slow">
            <Shield className="w-4 h-4 text-primary" />
            <span>Your Privacy Matters ✨</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient animate-gradient">
            Privacy{' '}
            <span className="text-gradient-neon">
              Policy
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto">
            We're committed to protecting your privacy because trust is{' '}
            <span className="font-bold text-gradient">everything</span>! 
            <br />Here's how we keep your data safe and sound <span className="emoji-pop">🛡️</span>
          </p>
          
          <div className="glass px-4 py-2 rounded-full inline-block text-sm font-medium">
            Last updated: {new Date().toLocaleDateString()} • Always improving! 🚀
          </div>
        </div>

        {/* Key Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {keyPoints.map((point, index) => (
            <Card key={index} className="glass card-hover hover:glow-purple group">
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${point.gradient} flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                  <point.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-gradient">{point.title}</h3>
                <p className="text-sm text-muted-foreground">{point.description}</p>
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Policy Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <Card key={index} className="glass card-hover hover:glow-cyan border-neon/50">
              <CardHeader>
                <CardTitle className="text-2xl text-gradient flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="glass-strong glow-pink border-neon max-w-2xl mx-auto">
            <CardContent className="p-12">
              <div className="mb-6">
                <Star className="w-16 h-16 mx-auto text-gradient-neon mb-4" />
                <h3 className="text-3xl font-bold text-gradient-sunset mb-4">
                  Questions About Privacy?
                </h3>
              </div>
              <p className="text-xl text-muted-foreground mb-6">
                We're here to help! Reach out anytime with privacy questions or concerns.
              </p>
              <Button 
                onClick={() => navigate('/contact')}
                className="text-lg px-8 py-6 bg-gradient-primary hover:bg-gradient-neon glow-purple hover:glow-cyan transition-all duration-300 font-bold"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Contact Our Privacy Team ✨
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Fun Footer */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground">
            <span className="emoji-pop">💡</span> Pro tip: We update this policy sometimes to make it even better. 
            We'll always let you know about important changes! <span className="emoji-pop">📧</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
