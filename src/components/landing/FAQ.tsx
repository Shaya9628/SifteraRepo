import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ = () => {
  const faqs = [
    {
      question: 'What is Siftera and how does it work?',
      answer: 'Siftera combines human expertise with AI intelligence. You score resumes with your own assessment, then see our AI analysis side-by-side. This dual scoring approach helps you learn from AI insights, improve your screening accuracy, and make more confident hiring decisions.',
    },
    {
      question: 'How does the User + AI dual scoring work?',
      answer: 'First, you evaluate a resume using your professional judgment. Then, our AI provides its own comprehensive analysis. You can compare both scores, understand reasoning differences, and learn from discrepancies to continuously improve your screening skills.',
    },
    {
      question: 'What file formats does Siftera support?',
      answer: 'Siftera supports all major resume formats including PDF, DOC, DOCX, and TXT files. Our parsing technology can handle various resume layouts and formats with high accuracy, from traditional chronological resumes to modern creative designs.',
    },
    {
      question: 'Is my candidate data secure with Siftera?',
      answer: 'Absolutely. We use enterprise-grade security measures and are fully GDPR compliant. All data is encrypted in transit and at rest, and we never share your candidate information with third parties. You have full control over your data and can delete it at any time.',
    },
    {
      question: 'Can I integrate Siftera with my existing HR systems?',
      answer: 'Yes! Siftera offers API access and integrations with popular ATS systems like Workday, BambooHR, and Greenhouse. Our Professional and Enterprise plans include custom integration support to seamlessly connect with your existing workflow.',
    },
    {
      question: 'What kind of support does Siftera provide?',
      answer: 'We offer comprehensive support including email support for all plans, priority support for Professional users, and dedicated support for Enterprise customers. We also provide training sessions, onboarding assistance, and extensive documentation to help you get the most out of Siftera.',
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Frequently Asked{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Siftera. Can't find the answer you're looking for? Contact our support team.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-6 data-[state=open]:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold text-lg">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
