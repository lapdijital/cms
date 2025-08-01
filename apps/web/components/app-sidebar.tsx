"use client";

import {
  ExternalLink,
} from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { getNavigationByRole } from "@/lib/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser } = useAuth();
  
  // Default navigation for unauthenticated users
  const defaultNavigation = {
    navigation: [],
    projects: []
  };

  // Get navigation based on user role
  const { navigation, projects } = authUser 
    ? getNavigationByRole(authUser.role)
    : defaultNavigation;

  // User data for NavUser component
  const userData = authUser ? {
    name: authUser.name,
    email: authUser.email,
    avatar: authUser.avatar || "/avatars/default.jpg",
    role: authUser.role
  } : {
    name: "Misafir",
    email: "guest@example.com",
    avatar: "/avatars/default.jpg",
    role: "USER" as const
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ExternalLink className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Lap CMS</span>
                  <span className="text-xs">
                                      <p className="text-xs leading-tight text-muted-foreground">
                    {authUser?.role === 'ADMIN' && "Yönetici Paneli"}
                    {authUser?.role === 'USER' && "Kullanıcı Paneli"}
                  </p>
                    {!authUser && "Misafir"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navigation.length > 0 && <NavMain items={navigation} />}
        
        {/* Authenticated olmayan kullanıcılar için */}
        {!authUser && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p>Lütfen giriş yapın</p>
            <a href="/login" className="text-primary hover:underline">
              Giriş Yap
            </a>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
