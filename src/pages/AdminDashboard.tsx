import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadResume } from '@/components/UploadResume';
import { BulkUploadResume } from '@/components/BulkUploadResume';
import { ResumeList } from '@/components/ResumeList';
import { UserManagement } from '@/components/UserManagement';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { AITrainingConfig } from '@/components/AITrainingConfig';
import { QuestionManagement } from '@/components/QuestionManagement';
import { DomainSettings } from '@/components/DomainSettingsPreview';
import { AdminUserDomainManagement } from '@/components/AdminUserDomainManagement';
import LandingPageCMS from '@/components/admin/LandingPageCMS';
import { useToast } from '@/hooks/use-toast';
import { Shield, LogOut, FileText, Users, BarChart3, Brain, HelpCircle, Settings, Building2, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/admin/auth');
        return;
      }

      // Check if user has admin role
      const { data: roleData } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate('/admin/auth');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };

    checkAdminStatus();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Signed out',
      description: 'You have been logged out successfully',
    });
    navigate('/admin/auth');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Portal</h1>
                <p className="text-sm text-muted-foreground">Resume & User Management</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="resumes" className="space-y-6">
          <TabsList className="grid w-full max-w-7xl grid-cols-8">
            <TabsTrigger value="resumes">
              <FileText className="w-4 h-4 mr-2" />
              Resumes
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="user-domains">
              <Building2 className="w-4 h-4 mr-2" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="questions">
              <HelpCircle className="w-4 h-4 mr-2" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="ai-training">
              <Brain className="w-4 h-4 mr-2" />
              AI Training
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="landing-page">
              <Sparkles className="w-4 h-4 mr-2" />
              Landing Page
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resumes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UploadResume onUploadComplete={() => {}} />
              <BulkUploadResume onUploadComplete={() => {}} />
            </div>
            <ResumeList />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="user-domains">
            <AdminUserDomainManagement />
          </TabsContent>

          <TabsContent value="questions">
            <QuestionManagement />
          </TabsContent>

          <TabsContent value="ai-training">
            <AITrainingConfig />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="landing-page">
            <LandingPageCMS />
          </TabsContent>

          <TabsContent value="settings">
            <DomainSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
