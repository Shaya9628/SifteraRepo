import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2, HelpCircle, GripVertical } from 'lucide-react';
import { useLandingContent, useUpdateLandingContent, getContentValue } from '@/hooks/useLandingContent';

interface FAQ {
  question: string;
  answer: string;
}

const FAQEditor = () => {
  const { data: content, isLoading } = useLandingContent('faq');
  const updateContent = useUpdateLandingContent();

  const [faqs, setFaqs] = useState<FAQ[]>([]);

  useEffect(() => {
    if (content) {
      const faqsData = getContentValue(content, 'faqs_data', '');
      if (faqsData) {
        try {
          setFaqs(JSON.parse(faqsData));
        } catch {
          setFaqs(getDefaultFAQs());
        }
      } else {
        setFaqs(getDefaultFAQs());
      }
    }
  }, [content]);

  const getDefaultFAQs = (): FAQ[] => [
    {
      question: 'What is Siftera and how does it work?',
      answer: 'Siftera combines human expertise with AI intelligence. You score resumes with your own assessment, then see our AI analysis side-by-side.',
    },
    {
      question: 'How does the User + AI dual scoring work?',
      answer: 'First, you evaluate a resume using your professional judgment. Then, our AI provides its own comprehensive analysis. You can compare both scores.',
    },
    {
      question: 'What file formats does Siftera support?',
      answer: 'Siftera supports all major resume formats including PDF, DOC, DOCX, and TXT files.',
    },
    {
      question: 'Is my candidate data secure with Siftera?',
      answer: 'Absolutely. We use enterprise-grade security measures and are fully GDPR compliant.',
    },
  ];

  const handleFAQChange = (index: number, field: keyof FAQ, value: string) => {
    const newFAQs = [...faqs];
    newFAQs[index] = { ...newFAQs[index], [field]: value };
    setFaqs(newFAQs);
  };

  const addFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === faqs.length - 1)) {
      return;
    }
    
    const newFAQs = [...faqs];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newFAQs[index], newFAQs[swapIndex]] = [newFAQs[swapIndex], newFAQs[index]];
    setFaqs(newFAQs);
  };

  const handleSave = async () => {
    await updateContent.mutateAsync({
      section: 'faq',
      key: 'faqs_data',
      value: JSON.stringify(faqs),
    });
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>
            Manage the FAQ section. Drag to reorder questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-dashed">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <CardTitle className="text-sm font-medium">Question {index + 1}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFAQ(index, 'up')}
                      disabled={index === 0}
                      className="h-8 w-8"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFAQ(index, 'down')}
                      disabled={index === faqs.length - 1}
                      className="h-8 w-8"
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFAQ(index)}
                      className="text-destructive hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor={`faq-${index}-question`}>Question</Label>
                    <Input
                      id={`faq-${index}-question`}
                      value={faq.question}
                      onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                      placeholder="What is your question?"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`faq-${index}-answer`}>Answer</Label>
                    <Textarea
                      id={`faq-${index}-answer`}
                      value={faq.answer}
                      onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                      placeholder="Provide a detailed answer..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addFAQ} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateContent.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {updateContent.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default FAQEditor;
