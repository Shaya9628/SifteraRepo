import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, LayoutDashboard, Users, BarChart3, MessageSquare, CreditCard, HelpCircle, FileText } from 'lucide-react';
import HeroEditor from './HeroEditor';
import StatsEditor from './StatsEditor';
import FooterEditor from './FooterEditor';
import TestimonialsEditor from './TestimonialsEditor';
import FAQEditor from './FAQEditor';
import MediaManager from './MediaManager';

const LandingPageCMS = () => {
  const [activeTab, setActiveTab] = useState('hero');

  const sections = [
    { id: 'hero', label: 'Hero', icon: LayoutDashboard },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'testimonials', label: 'Testimonials', icon: Users },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'footer', label: 'Footer', icon: FileText },
    { id: 'media', label: 'Media', icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Landing Page Content Manager
          </CardTitle>
          <CardDescription>
            Edit all content on your landing page. Changes are saved automatically and reflect immediately on the live site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
              {sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                  <section.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="hero">
              <HeroEditor />
            </TabsContent>

            <TabsContent value="stats">
              <StatsEditor />
            </TabsContent>

            <TabsContent value="testimonials">
              <TestimonialsEditor />
            </TabsContent>

            <TabsContent value="faq">
              <FAQEditor />
            </TabsContent>

            <TabsContent value="footer">
              <FooterEditor />
            </TabsContent>

            <TabsContent value="media">
              <MediaManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPageCMS;
