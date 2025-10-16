import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Calculator,
  FileText,
  UserCog,
  MapPin,
  Leaf,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItems {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

const menuItems: MenuItems[] = [
  { title:'จัดการสมาชิก',
    url: '/members',
    icon: Package,
    roles: ['president']
  },
  {
    title: 'จัดการผลผลิต',
    url: '/products',
    icon: Package,
    roles: ['president']
  },
  {
    title: 'จัดการลูกค้า',
    url: '/customers',
    icon: Users,
    roles: ['staff']
  },
  {
    title: 'จัดการการขาย',
    url: '/sales',
    icon: ShoppingCart,
    roles: ['staff']
  },
  {
    title: 'จัดการบัญชี',
    url: '/accounting',
    icon: Calculator,
    roles: ['president', 'staff']
  },
  {
    title: 'รายงาน',
    url: '/reports',
    icon: FileText,
    roles: ['president', 'staff']
  },
  {
    title: 'จัดการกรรมการ',
    url: '/directors',
    icon: UserCog,
    roles: ['admin']
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      className={isCollapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-gradient-sidebar">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Leaf className="h-6 w-6 text-sidebar-primary" />
              <MapPin className="h-4 w-4 text-sidebar-primary" />
            </div>
            {!isCollapsed && (
              <div className="text-sidebar-foreground">
                <p className="text-sm font-semibold">วิสาหกิจโคกก่อ</p>
                <p className="text-xs opacity-80">มหาสารคาม</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="text-sidebar-foreground">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs opacity-70">{user.email}</p>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">เมนูหลัก</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-3 h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
 
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="mr-3 h-4 w-4" />
            {!isCollapsed && <span>ออกจากระบบ</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}