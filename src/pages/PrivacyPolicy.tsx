import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
        <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-lg max-w-3xl text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>Your privacy is important to us. This policy explains how we collect, use, and protect your data.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
