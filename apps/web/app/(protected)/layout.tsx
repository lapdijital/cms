"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { ProtectedRoute } from "@/components/protected-route"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

// Breadcrumb yapılandırması
const getBreadcrumbConfig = (pathname: string) => {
  const pathSegments = pathname.split('/').filter(Boolean)
  
  const breadcrumbMap: Record<string, string> = {
    'dashboard': 'Özet',
    'users': 'Kullanıcı Yönetimi',
    'posts': 'İçerik Yönetimi',
    'security': 'Güvenlik',
    'analytics': 'Analitik',
    'settings': 'Ayarlar'
  }

  const lastSegment = pathSegments[pathSegments.length - 1] || 'dashboard'

  return {
    current: breadcrumbMap[lastSegment] || 'Sayfa',
    segments: pathSegments.map(segment => ({
      label: breadcrumbMap[segment] || segment,
      href: `/${segment}`
    }))
  }
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const breadcrumbConfig = getBreadcrumbConfig(pathname)

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">
                      Lap Yönetim Sistemi
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{breadcrumbConfig.current}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="ml-auto px-4">
              <ModeToggle />
            </div>
          </header>
          
          <div className="flex flex-1 flex-col gap-6 p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
