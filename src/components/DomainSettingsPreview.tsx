import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Users, Shield, Save, Building2 } from 'lucide-react';

interface DomainSettingsData {
  allow_user_domain_change: boolean;
  allow_admin_domain_change: boolean;
}

export const DomainSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<DomainSettingsData>({
    allow_user_domain_change: true,
    allow_admin_domain_change: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomainSettings();
  }, []);

  const loadDomainSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings from localStorage or use defaults
      const savedSettings = localStorage.getItem('domain_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        // Set default settings
        const defaultSettings = {
          allow_user_domain_change: true,
          allow_admin_domain_change: true,
        };
        setSettings(defaultSettings);
        localStorage.setItem('domain_settings', JSON.stringify(defaultSettings));
      }
    } catch (error: any) {
      console.error('Error loading domain settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'Using default settings',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      // Save to localStorage for now (works immediately)
      localStorage.setItem('domain_settings', JSON.stringify(settings));
      
      // Note: domain_settings table may not exist in schema
      // Using localStorage as primary storage

      toast({
        title: 'Settings saved',
        description: 'Domain settings have been updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while saving',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Domain Management Active</h4>
              <p className="text-sm text-blue-700">
                Users can now switch between Sales and CRM domains. Configure permissions below.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Domain Settings
          </CardTitle>
          <CardDescription>
            Control who can switch between Sales and CRM domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Allow Users to Change Domain
                </Label>
                <p className="text-sm text-muted-foreground">
                  Users can switch between Sales and CRM domains in their profile
                </p>
              </div>
              <Switch
                checked={settings?.allow_user_domain_change || false}
                onCheckedChange={(checked) =>
                  setSettings(prev => prev ? { ...prev, allow_user_domain_change: checked } : prev)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Allow Admins to Change Domain
                </Label>
                <p className="text-sm text-muted-foreground">
                  Admins can switch between domains when managing questions and settings
                </p>
              </div>
              <Switch
                checked={settings?.allow_admin_domain_change || false}
                onCheckedChange={(checked) =>
                  setSettings(prev => prev ? { ...prev, allow_admin_domain_change: checked } : prev)
                }
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Changing domain will load domain-specific questions and AI evaluation rules</li>
              <li>• All existing scores, badges, and assessment history will be preserved</li>
              <li>• Users will see different questions based on their selected domain</li>
              <li>• Admins can always manage questions for both domains regardless of their personal domain setting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};