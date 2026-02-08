import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search, AlertTriangle, Sparkles, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Gen Z Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-destructive/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}} />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-neon-pink/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-neon-cyan/20 rounded-full blur-3xl animate-blob" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto">
          {/* 404 Hero */}
          <div className="mb-8">
            <div className="text-9xl md:text-[12rem] font-bold text-gradient-neon animate-pulse mb-4">
              404
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6 animate-bounce-slow">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span>Oops! Page not found</span>
            </div>
          </div>

          {/* Fun Message */}
          <Card className="glass-strong glow-pink border-neon mb-8">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gradient mb-4">
                Looks like you're lost in the digital universe! 🌌
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                The page you're looking for might have been moved, deleted, or maybe it never existed. 
                <br />Don't worry, it happens to the best of us! <span className="emoji-pop">😅</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/')}
                  className="text-lg px-8 py-6 bg-gradient-primary hover:bg-gradient-neon glow-purple hover:glow-cyan transition-all duration-300 font-bold"
                >
                  <Home className="mr-2 w-5 h-5" />
                  Go Home ✨
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="text-lg px-8 py-6 glass border-primary/50 hover:border-primary hover:glow-purple transition-all duration-300 font-bold"
                >
                  <ArrowLeft className="mr-2 w-5 h-5" />
                  Go Back 🔄
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Fun Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Search, value: '1', label: 'Lost Explorer', color: 'text-cyan-500' },
              { icon: AlertTriangle, value: '404', label: 'Error Code', color: 'text-destructive' },
              { icon: Sparkles, value: '∞', label: 'Possibilities', color: 'text-primary' }
            ].map((stat, index) => (
              <Card key={index} className="glass card-hover hover:glow-purple group">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${stat.color.replace('text-', 'from-')} to-${stat.color.replace('text-', '').replace('-500', '-600')} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-muted-foreground mt-8">
            If you think this is a bug, feel free to{' '}
            <button 
              onClick={() => navigate('/contact')}
              className="text-gradient font-bold hover:text-glow transition-all duration-300"
            >
              contact us
            </button>
            ! We'd love to help <span className="emoji-pop">💖</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
