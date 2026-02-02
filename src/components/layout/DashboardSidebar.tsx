import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Brain,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Users,
  BookOpen,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardSidebarProps {
  profile: {
    full_name?: string;
    avatar_url?: string;
    total_points?: number;
  };
  onTabChange?: (tab: string) => void;
}

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, tab: 'start' },
  { title: 'Upload Resume', url: '/dashboard', icon: Upload, tab: 'upload' },
  { title: 'Badges', url: '/dashboard', icon: Trophy, tab: 'badges' },
  { title: 'Leaderboard', url: '/dashboard', icon: Users, tab: 'leaderboard' },
  { title: 'Learning Section', url: '/dashboard', icon: BookOpen, tab: 'learning' },
  { title: 'AI Feedback', url: '/dashboard/ai-results', icon: Brain },
  { title: 'Settings', url: '/dashboard/settings', icon: Settings },
];

export function DashboardSidebar({ profile, onTabChange }: DashboardSidebarProps) {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';

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
    <Sidebar
      className={cn(
        'border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <NavLink to="/dashboard/profile" className="group">
            <Avatar className="h-10 w-10 ring-2 ring-primary/50 transition-all group-hover:ring-primary">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
          </NavLink>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile.full_name || 'User'}
              </p>
              <p className="text-xs text-primary">
                {profile.total_points || 0} points
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url && (!item.tab || item.tab === 'start');
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={collapsed ? item.title : undefined}
                    >
                      <NavLink
                        to={item.url}
                        onClick={() => {
                          if (item.tab && onTabChange) {
                            onTabChange(item.tab);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            isActive ? 'text-primary' : 'text-sidebar-foreground/60'
                          )}
                        />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
