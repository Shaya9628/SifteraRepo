import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import ContactSalesModal from './ContactSalesModal';
import { useLandingContent, getContentValue } from '@/hooks/useLandingContent';

const CTA = () => {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);
  
  const { data: contactContent } = useLandingContent('contact');
  const salesEmail = getContentValue(contactContent, 'sales_email', 'sales@siftera.com');
  const calendlyUrl = getContentValue(contactContent, 'sales_calendly', '');

  return (
    <>
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNHMxNCA2LjI2OCAxNCAxNHMtNi4yNjggMTQtMTQgMTR6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-primary-foreground text-sm font-bold mb-8 border border-white/30">
              <span className="px-2 py-0.5 bg-white text-primary rounded-full text-xs font-bold uppercase">Free</span>
              Get started today
            </div>

            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary-foreground">
              Ready to Transform Your{' '}
              <span className="underline decoration-4 decoration-white/50">Hiring Process?</span>
            </h2>

            <p className="text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Join HR professionals who are making smarter hiring decisions with AI-powered resume screening. 
              Start with two free uploads today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/auth')}
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-xl"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowContactModal(true)}
                className="text-lg px-8 py-6 border-white/30 text-primary-foreground hover:bg-white/10"
              >
                Contact Sales
              </Button>
            </div>

            <p className="text-primary-foreground/60 mt-6 text-sm">
              2 free uploads • No credit card required • Instant AI analysis
            </p>
          </div>
        </div>
      </section>

      <ContactSalesModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        salesEmail={salesEmail}
        calendlyUrl={calendlyUrl}
      />
    </>
  );
};

export default CTA;
