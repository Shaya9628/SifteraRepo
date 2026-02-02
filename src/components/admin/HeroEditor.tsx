import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload, Link, Video } from 'lucide-react';
import { useLandingContent, useUpdateLandingContent, getContentValue, useUploadLandingMedia, useLandingMedia } from '@/hooks/useLandingContent';

const HeroEditor = () => {
  const { data: content, isLoading } = useLandingContent('hero');
  const { data: media } = useLandingMedia('hero');
  const updateContent = useUpdateLandingContent();
  const uploadMedia = useUploadLandingMedia();

  const [formData, setFormData] = useState({
    headline: '',
    subtitle: '',
    cta_primary: '',
    cta_secondary: '',
    demo_video_url: '',
  });

  useEffect(() => {
    if (content) {
      setFormData({
        headline: getContentValue(content, 'headline', 'Master Resume Screening with AI-Powered Training'),
        subtitle: getContentValue(content, 'subtitle', 'Transform your HR team into expert resume screeners.'),
        cta_primary: getContentValue(content, 'cta_primary', 'Start Free Trial'),
        cta_secondary: getContentValue(content, 'cta_secondary', 'Watch Demo'),
        demo_video_url: getContentValue(content, 'demo_video_url', ''),
      });
    }
  }, [content]);

  const handleSave = async () => {
    for (const [key, value] of Object.entries(formData)) {
      await updateContent.mutateAsync({ section: 'hero', key, value });
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadMedia.mutateAsync({
      section: 'hero',
      file,
      mediaType: 'video',
      altText: 'Demo video'
    });
    
    setFormData(prev => ({ ...prev, demo_video_url: url }));
    await updateContent.mutateAsync({ section: 'hero', key: 'demo_video_url', value: url });
  };

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hero Section Content</CardTitle>
          <CardDescription>
            Edit the main headline, subtitle, and call-to-action buttons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              placeholder="Main headline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Supporting text"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cta_primary">Primary Button Text</Label>
              <Input
                id="cta_primary"
                value={formData.cta_primary}
                onChange={(e) => setFormData({ ...formData, cta_primary: e.target.value })}
                placeholder="Start Free Trial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta_secondary">Secondary Button Text</Label>
              <Input
                id="cta_secondary"
                value={formData.cta_secondary}
                onChange={(e) => setFormData({ ...formData, cta_secondary: e.target.value })}
                placeholder="Watch Demo"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Demo Video
          </CardTitle>
          <CardDescription>
            Upload a demo video or provide a YouTube/Vimeo URL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demo_video_url">Video URL (YouTube, Vimeo, or direct link)</Label>
            <div className="flex gap-2">
              <Input
                id="demo_video_url"
                value={formData.demo_video_url}
                onChange={(e) => setFormData({ ...formData, demo_video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
              <Button variant="outline" size="icon">
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline" disabled={uploadMedia.isPending}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadMedia.isPending ? 'Uploading...' : 'Upload Video'}
              </Button>
            </div>
            
            {formData.demo_video_url && (
              <span className="text-sm text-muted-foreground">
                Video URL set ✓
              </span>
            )}
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

export default HeroEditor;
