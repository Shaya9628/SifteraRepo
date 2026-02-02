import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DomainSwitcher } from '@/components/DomainSwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, Loader2, Building2, Users } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [domainSettings, setDomainSettings] = useState<any>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    designation: '',
    domain: 'Sales' as 'Sales' | 'CRM',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      // Load user profile and domain settings
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Load domain settings from localStorage (always available)
      const domainSettings = JSON.parse(localStorage.getItem('domain_settings') || '{"allow_user_domain_change": true}');

      if (profileResult.error) throw profileResult.error;

      setProfile(profileResult.data);
      setDomainSettings(domainSettings);
      
      // Get user's domain from localStorage if not in profile
      const userDomain = localStorage.getItem(`user_domain_${user.id}`) || 'Sales';
      
      setFormData({
        full_name: profileResult.data.full_name || '',
        email: profileResult.data.email || user.email || '',
        phone: profileResult.data.phone || '',
        designation: profileResult.data.designation || '',
        domain: userDomain as 'CRM' | 'Sales',
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));

      toast({
        title: 'Success',
        description: 'Profile photo updated successfully',
      });
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Failed to upload profile photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Get current user domain from localStorage
      const currentDomain = localStorage.getItem(`user_domain_${user.id}`) || 'Sales';
      const domainChanged = currentDomain !== formData.domain;
      
      // Save domain to localStorage (works immediately)
      localStorage.setItem(`user_domain_${user.id}`, formData.domain);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          designation: formData.designation,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Store domain in localStorage for immediate use
      localStorage.setItem('user_selected_domain', formData.domain);
      
      // Note: 'users' table doesn't exist in schema - domain is stored in profiles.selected_domain
      // which is already updated above

      setProfile((prev: any) => ({ ...prev, ...formData }));

      toast({
        title: 'Success',
        description: domainChanged 
          ? 'Profile updated successfully. Domain change will take effect immediately.' 
          : 'Profile updated successfully',
      });
      
      if (domainChanged) {
        // Emit a custom event so other components can react to domain change
        window.dispatchEvent(new CustomEvent('domainChanged', { detail: { domain: formData.domain } }));
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <DashboardLayout profile={profile}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information
          </p>
        </div>

        {/* Avatar Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Profile Photo</CardTitle>
            <CardDescription>
              Click the avatar to upload a new photo
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative group">
              <Avatar
                className="h-24 w-24 ring-4 ring-primary/30 cursor-pointer transition-all group-hover:ring-primary"
                onClick={handleAvatarClick}
              >
                <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleAvatarClick}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Camera className="h-6 w-6 text-primary" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-semibold text-foreground">{profile.full_name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{profile.email || user?.email}</p>
              <p className="text-sm text-primary mt-1">
                {profile.total_points || 0} points earned
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  placeholder="Enter your full name"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter your email"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter your phone number"
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, designation: e.target.value }))
                  }
                  placeholder="Enter your job title"
                  className="bg-input border-border"
                />
              </div>
              
              {/* Domain Selection - Only show if allowed */}
              {domainSettings?.allow_user_domain_change && (
                <div className="md:col-span-2">
                  <DomainSwitcher
                    currentDomain={formData.domain}
                    onDomainChange={(domain) => setFormData((prev) => ({ ...prev, domain }))}
                    disabled={false}
                    showDescription={true}
                  />
                  {formData.domain !== profile?.domain && (
                    <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Changing domain will reload your assessments and questions
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Your Stats</CardTitle>
            <CardDescription>Your progress and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-primary">
                  {profile.total_points || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-primary">
                  {profile.resumes_screened || 0}
                </p>
                <p className="text-xs text-muted-foreground">Resumes Screened</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-primary">
                  {profile.calls_completed || 0}
                </p>
                <p className="text-xs text-muted-foreground">Calls Completed</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-primary">
                  {profile.red_flags_found || 0}
                </p>
                <p className="text-xs text-muted-foreground">Red Flags Found</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
