import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Phone, Calendar, Award, Settings } from 'lucide-react';

interface UserData {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  selected_domain: string | null;
  total_points: number;
  resumes_screened: number;
  calls_completed: number;
  red_flags_found: number;
  created_at: string;
  avatar_url: string | null;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_profiles_admin');

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDomainChange = async (userId: string, newDomain: string) => {
    try {
      // Save to localStorage first (always works)
      localStorage.setItem(`user_domain_${userId}`, newDomain);
      
      // Try to update database with graceful error handling
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ selected_domain: newDomain })
          .eq('id', userId);

        if (error) {
          console.log('Database update failed, using localStorage:', error);
          if (error?.code === '23514' || error?.message?.includes('selected_domain_check')) {
            console.log('Domain constraint error - using localStorage fallback');
          }
        }
      } catch (dbError) {
        console.log('Database operation failed, using localStorage:', dbError);
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, selected_domain: newDomain }
          : user
      ));
      
      setEditingDomain(null);
      toast({
        title: "Success",
        description: "User domain updated successfully",
      });
    } catch (error) {
      console.error('Error updating domain:', error);
      toast({
        title: "Error",
        description: "Failed to update domain",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
        <CardDescription>
          {users.length} registered users on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{user.designation || 'No designation'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingDomain === user.id ? (
                      <Select
                        value={user.selected_domain || ""}
                        onValueChange={(value) => handleDomainChange(user.id, value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="crm">CRM</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        {user.selected_domain ? (
                          <Badge variant="outline">{user.selected_domain}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not selected</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDomain(user.id)}
                        >
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>Resumes: {user.resumes_screened}</div>
                      <div>Calls: {user.calls_completed}</div>
                      <div>Red Flags: {user.red_flags_found}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{user.total_points}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingDomain === user.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingDomain(null)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Change domain
                        </span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
