import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle, Users, FileText, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-hr-professional.jpg';
import VideoModal from './VideoModal';
import ContactSalesModal from './ContactSalesModal';
import { useLandingContent, getContentValue } from '@/hooks/useLandingContent';

const Hero = () => {
  const navigate = useNavigate();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  
  const { data: heroContent } = useLandingContent('hero');
  const { data: contactContent } = useLandingContent('contact');

  const demoVideoUrl = getContentValue(heroContent, 'demo_video_url', '');
  const ctaPrimary = getContentValue(heroContent, 'cta_primary', 'Start Free Trial');
  const ctaSecondary = getContentValue(heroContent, 'cta_secondary', 'Watch Demo');
  const salesEmail = getContentValue(contactContent, 'sales_email', 'sales@siftera.com');
  const calendlyUrl = getContentValue(contactContent, 'sales_calendly', '');

  const stats = [
    { icon: Users, value: '500+', label: 'HR Professionals' },
    { icon: FileText, value: '10K+', label: 'Resumes Analyzed' },
    { icon: TrendingUp, value: '95%', label: 'Accuracy Improvement' },
  ];

  return (
    <>
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Vibrant Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
                {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  Master Resume Screening
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Compare & Learn
                </span>
              </h1>

              {/* Tagline */}
              <div className="text-xl md:text-2xl font-medium text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0">
                Screen resumes, compare with expert analysis, and
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> boost your efficiency</span>. 
                Learn while you work.
              </div>

              {/* Key Value Props with Icons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mb-8">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  Learn & Improve
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  Compare Analysis
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  500+ HR Trained
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Button
                  size="lg"
                  onClick={() => navigate('/auth')}
                  className="text-lg px-8 py-6 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowVideoModal(true)}
                  className="text-lg px-8 py-6 group border-2 hover:border-primary hover:bg-primary/5"
                >
                  <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                  {ctaSecondary}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Learn While You Work
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Expert Comparisons
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Boost Efficiency
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  500+ HR Trained
                </div>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border-4 border-white/50">
                <img 
                  src={heroImage} 
                  alt="HR Professional reviewing resumes" 
                  className="w-full h-auto object-cover"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
              </div>
              
              {/* Floating Stats Cards */}
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl border border-border animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">95%</div>
                    <div className="text-xs text-muted-foreground">Accuracy</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-4 -right-4 bg-card p-4 rounded-2xl shadow-xl border border-border animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">500+</div>
                    <div className="text-xs text-muted-foreground">HR Pros</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 backdrop-blur border border-primary/20 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group"
              >
                <stat.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoUrl={demoVideoUrl}
        title="Siftera Demo"
      />

      <ContactSalesModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        salesEmail={salesEmail}
        calendlyUrl={calendlyUrl}
      />
    </>
  );
};

export default Hero;
