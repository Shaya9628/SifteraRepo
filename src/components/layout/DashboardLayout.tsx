import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from 'react-router-dom';

interface DashboardLayoutProps {
  children: ReactNode;
  profile: {
    full_name?: string;
    avatar_url?: string;
    total_points?: number;
    selected_domain?: string;
  };
  onTabChange?: (tab: string) => void;
}

export function DashboardLayout({ children, profile, onTabChange }: DashboardLayoutProps) {
  const { signOut } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <DashboardSidebar profile={profile} onTabChange={onTabChange} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden">
                  <Menu className="h-5 w-5" />
                </SidebarTrigger>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    HR Training Platform
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {profile.selected_domain?.toUpperCase() || 'Training'} Assessment
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* <NavLink to="/dashboard/profile" className="hidden md:flex items-center gap-2 group">
                  <Avatar className="h-8 w-8 ring-1 ring-primary/30 transition-all group-hover:ring-primary">
                    <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {profile.full_name || 'User'}
                  </span>
                </NavLink> */}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-foreground hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
