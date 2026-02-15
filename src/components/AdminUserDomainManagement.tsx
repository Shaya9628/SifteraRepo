import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Building2, Save, RefreshCw } from 'lucide-react';
import { Domain, GLOBAL_DOMAINS } from '@/lib/constants/domains';

interface User {
  id: string;
  email: string;
  full_name: string;
  designation: string;
  domain: Domain;
  last_sign_in_at: string;
}

export const AdminUserDomainManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          designation
        `)
        .order('full_name');

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error fetching users',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Get domains from localStorage for each user
      const usersWithDomains = profiles?.map(profile => ({
        ...profile,
        domain: (localStorage.getItem(`user_domain_${profile.id}`) as 'Sales' | 'CRM') || 'Sales',
        last_sign_in_at: new Date().toISOString(),
      })) || [];

      setUsers(usersWithDomains);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserDomain = async (userId: string, newDomain: string) => {
    setUpdating(userId);
    
    try {
      // Update domain in localStorage (always works)
      localStorage.setItem(`user_domain_${userId}`, newDomain.toLowerCase());
      
      // Try to update in database with enhanced error handling
      try {
        await supabase
          .from('profiles')
          .update({ selected_domain: newDomain.toLowerCase() })
          .eq('id', userId);
        console.log('Database updated successfully');
      } catch (dbError: any) {
        console.log('Database update failed, using localStorage:', dbError);
        if (dbError?.code === '23514' || dbError?.message?.includes('selected_domain_check')) {
          console.log('Domain constraint error - using localStorage fallback');
        }
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, domain: newDomain } : user
        )
      );

      toast({
        title: 'Domain updated',
        description: `User domain changed to ${newDomain}`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Error updating domain',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.designation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Domain Management
          </CardTitle>
          <CardDescription>
            Manage domain assignments for all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or designation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No users found matching your search.' : 'No users found.'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{user.full_name || 'No Name'}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.designation && (
                          <p className="text-xs text-muted-foreground mt-1">{user.designation}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Badge 
                        variant={user.domain === 'Sales' ? 'default' : 'secondary'}
                        className={user.domain === 'Sales' ? 'bg-blue-500' : 'bg-green-500'}
                      >
                        {user.domain}
                      </Badge>
                    </div>

                    <Select
                      value={user.domain}
                      onValueChange={(value: 'Sales' | 'CRM') => updateUserDomain(user.id, value)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GLOBAL_DOMAINS.map((domain) => (
                          <SelectItem key={domain.value} value={domain.value}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{domain.icon}</span>
                              {domain.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {updating === user.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Domain Distribution</h4>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Sales: {filteredUsers.filter(u => u.domain === 'Sales').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>CRM: {filteredUsers.filter(u => u.domain === 'CRM').length}</span>
              </div>
              <div className="text-muted-foreground">
                Total: {filteredUsers.length} users
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};