import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import FreeTools from '@/components/landing/FreeTools';
import TrustedBy from '@/components/landing/TrustedBy';
import FreeHighlight from '@/components/landing/FreeHighlight';
import ProblemSolution from '@/components/landing/ProblemSolution';
import HowItWorks from '@/components/landing/HowItWorks';
import CallSimulationShowcase from '@/components/landing/CallSimulationShowcase';
import Features from '@/components/landing/Features';
import Stats from '@/components/landing/Stats';
import Testimonials from '@/components/landing/Testimonials';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FreeTools />
      <TrustedBy />
      <FreeHighlight />
      <ProblemSolution />
      <HowItWorks />
      <CallSimulationShowcase />
      <Features />
      <Stats />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
