import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          About{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Siftera
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
          We believe every HR professional deserves to feel confident in their screening decisions. 
          That's why we built Siftera - where HR confidence is built through hands-on practice, 
          expert feedback, and proven methodologies.
        </p>
      </div>
    </div>
  );
};

export default About;
