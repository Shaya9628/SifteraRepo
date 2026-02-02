import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, Image, Video, Copy, Check, Sparkles } from 'lucide-react';
import { useLandingMedia, useUploadLandingMedia, useDeleteLandingMedia, LandingMedia } from '@/hooks/useLandingContent';
import { toast } from 'sonner';

const MediaManager = () => {
  const { data: media, isLoading } = useLandingMedia();
  const uploadMedia = useUploadLandingMedia();
  const deleteMedia = useDeleteLandingMedia();
  
  const [uploadSection, setUploadSection] = useState('hero');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    
    await uploadMedia.mutateAsync({
      section: uploadSection,
      file,
      mediaType,
      altText: file.name,
    });
    
    e.target.value = '';
  };

  const handleDelete = async (item: LandingMedia) => {
    if (confirm('Are you sure you want to delete this media?')) {
      await deleteMedia.mutateAsync({ id: item.id, fileUrl: item.file_url });
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sections = ['hero', 'features', 'testimonials', 'call_simulation', 'general'];

  if (isLoading) {
    return <div className="animate-pulse h-64 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Upload New Media
          </CardTitle>
          <CardDescription>
            Upload images and videos for your landing page. Supported formats: JPG, PNG, GIF, MP4, WebM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1">
              <Label>Section</Label>
              <Select value={uploadSection} onValueChange={setUploadSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section.charAt(0).toUpperCase() + section.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button disabled={uploadMedia.isPending}>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadMedia.isPending ? 'Uploading...' : 'Upload File'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>
            All uploaded media files. Click on URL to copy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!media || media.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No media uploaded yet</p>
              <p className="text-sm">Upload images or videos to see them here</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {media.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {item.media_type === 'image' ? (
                      <img
                        src={item.file_url}
                        alt={item.alt_text || item.file_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="text-xs bg-background/80 px-2 py-1 rounded-full capitalize">
                        {item.section.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.media_type === 'image' ? <Image className="w-3 h-3 inline mr-1" /> : <Video className="w-3 h-3 inline mr-1" />}
                          {item.media_type}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(item.file_url, item.id)}
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item)}
                          disabled={deleteMedia.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaManager;
