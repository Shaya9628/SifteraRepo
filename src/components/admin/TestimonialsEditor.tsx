import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Plus, Trash2, Upload, Users } from 'lucide-react';
import { useLandingContent, useUpdateLandingContent, getContentValue, useUploadLandingMedia } from '@/hooks/useLandingContent';

interface Testimonial {
  name: string;
  title: string;
  company: string;
  quote: string;
  image: string;
}

const TestimonialsEditor = () => {
  const { data: content, isLoading } = useLandingContent('testimonials');
  const updateContent = useUpdateLandingContent();
  const uploadMedia = useUploadLandingMedia();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (content) {
      const testimonialsData = getContentValue(content, 'testimonials_data', '');
      if (testimonialsData) {
        try {
          setTestimonials(JSON.parse(testimonialsData));
        } catch {
          setTestimonials(getDefaultTestimonials());
        }
      } else {
        setTestimonials(getDefaultTestimonials());
      }
    }
  }, [content]);

  const getDefaultTestimonials = (): Testimonial[] => [
    {
      name: 'Sarah Chen',
      title: 'Head of Talent Acquisition',
      company: 'TechCorp Inc.',
      quote: 'Siftera transformed how we onboard new recruiters. What used to take 3 months now takes just 3 weeks.',
      image: '',
    },
    {
      name: 'Michael Rodriguez',
      title: 'HR Director',
      company: 'GlobalHR Solutions',
      quote: 'The AI-powered feedback is incredibly accurate. It catches red flags I sometimes miss.',
      image: '',
    },
    {
      name: 'Emily Watson',
      title: 'Recruitment Manager',
      company: 'InnovateCo',
      quote: 'Our team\'s accuracy went from 72% to 94% in just one month.',
      image: '',
    },
  ];

  const handleTestimonialChange = (index: number, field: keyof Testimonial, value: string) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [field]: value };
    setTestimonials(newTestimonials);
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadMedia.mutateAsync({
      section: 'testimonials',
      file,
      mediaType: 'image',
      altText: `Testimonial image for ${testimonials[index].name}`
    });
    
    handleTestimonialChange(index, 'image', url);
  };

  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: '', title: '', company: '', quote: '', image: '' }]);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    await updateContent.mutateAsync({
      section: 'testimonials',
      key: 'testimonials_data',
      value: JSON.stringify(testimonials),
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
            <Users className="w-5 h-5" />
            Testimonials
          </CardTitle>
          <CardDescription>
            Manage customer testimonials shown on the landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-dashed">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Testimonial {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTestimonial(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor={`testimonial-${index}-name`}>Name</Label>
                      <Input
                        id={`testimonial-${index}-name`}
                        value={testimonial.name}
                        onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`testimonial-${index}-title`}>Title</Label>
                      <Input
                        id={`testimonial-${index}-title`}
                        value={testimonial.title}
                        onChange={(e) => handleTestimonialChange(index, 'title', e.target.value)}
                        placeholder="HR Director"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`testimonial-${index}-company`}>Company</Label>
                      <Input
                        id={`testimonial-${index}-company`}
                        value={testimonial.company}
                        onChange={(e) => handleTestimonialChange(index, 'company', e.target.value)}
                        placeholder="Acme Inc."
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor={`testimonial-${index}-quote`}>Quote</Label>
                    <Textarea
                      id={`testimonial-${index}-quote`}
                      value={testimonial.quote}
                      onChange={(e) => handleTestimonialChange(index, 'quote', e.target.value)}
                      placeholder="This product changed our hiring process..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(index, e)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Photo
                      </Button>
                    </div>
                    {testimonial.image && (
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addTestimonial} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Testimonial
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

export default TestimonialsEditor;
