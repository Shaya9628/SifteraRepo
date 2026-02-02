import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Twitter, Linkedin, Github, Mail } from 'lucide-react';
import { useLandingContent, useUpdateLandingContent, getContentValue } from '@/hooks/useLandingContent';

const FooterEditor = () => {
  const { data: content, isLoading } = useLandingContent('footer');
  const updateContent = useUpdateLandingContent();

  const [formData, setFormData] = useState({
    description: '',
    tagline: '',
    social_twitter: '',
    social_linkedin: '',
    social_github: '',
    social_email: '',
  });

  useEffect(() => {
    if (content) {
      setFormData({
        description: getContentValue(content, 'description', 'Siftera - Learn Decide and Improve.'),
        tagline: getContentValue(content, 'tagline', 'Made with ❤️ for HR professionals worldwide'),
        social_twitter: getContentValue(content, 'social_twitter', ''),
        social_linkedin: getContentValue(content, 'social_linkedin', ''),
        social_github: getContentValue(content, 'social_github', ''),
        social_email: getContentValue(content, 'social_email', 'contact@siftera.com'),
      });
    }
  }, [content]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await updateContent.mutateAsync({ section: 'footer', key, value });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
          <CardDescription>
            Edit the brand description and tagline shown in the footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Brand Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Siftera - Learn Decide and Improve..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Footer Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Made with ❤️ for HR professionals worldwide"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Add your social media profile URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="social_twitter" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter URL
              </Label>
              <Input
                id="social_twitter"
                value={formData.social_twitter}
                onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value })}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn URL
              </Label>
              <Input
                id="social_linkedin"
                value={formData.social_linkedin}
                onChange={(e) => setFormData({ ...formData, social_linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_github" className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub URL
              </Label>
              <Input
                id="social_github"
                value={formData.social_github}
                onChange={(e) => setFormData({ ...formData, social_github: e.target.value })}
                placeholder="https://github.com/yourorg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Email
              </Label>
              <Input
                id="social_email"
                type="email"
                value={formData.social_email}
                onChange={(e) => setFormData({ ...formData, social_email: e.target.value })}
                placeholder="contact@siftera.com"
              />
            </div>
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

export default FooterEditor;
