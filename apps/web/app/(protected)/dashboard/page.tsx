"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import {
  Bell,
  Calendar,
  FileText,
  Settings,
  TrendingUp,
  Users
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Activity {
  id: number;
  type: string;
  message: string;
  time: string;
  action: string;
  href: string;
  timestamp: string;
}

const quickActions = [
  { 
    label: "Yeni Yazı", 
    icon: FileText, 
    href: "/posts", 
    description: "Yeni blog yazısı oluştur",
    color: "bg-blue-500"
  },
  { 
    label: "Site Ayarları", 
    icon: Settings, 
    href: "/site-settings",
    description: "Site ve hesap ayarlarını düzenle", 
    color: "bg-green-500"
  }
]

export default function DashboardPage() {
  const { user, fetchActivities } = useAuth()
  const [copied, setCopied] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true)
        const data = await fetchActivities()
        setActivities(data)
      } catch (error) {
        console.error('Aktiviteler yüklenemedi:', error)
      } finally {
        setActivitiesLoading(false)
      }
    }

    loadActivities()
  }, [fetchActivities])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(''), 2000)
    } catch (error) {
      console.error('Kopyalama hatası:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'settings':
        return <Settings className="h-4 w-4 text-green-600" />
      case 'profile':
        return <Users className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Hoş geldiniz, {user?.name || 'Kullanıcı'}!
        </h1>
        <p className="text-muted-foreground">
          {user?.site?.name ? `${user.site.name} sitenizi yönetin` : 'CMS sisteminizi yönetin'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {quickActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Link key={action.label} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                  <div className={`p-2 rounded-lg ${action.color} text-white mr-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.label}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Site Stats - sadece basit bilgiler */}
      {user?.site && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Site Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Site Adı</p>
                <p className="text-lg font-semibold">{user.site.name}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Domain</p>
                <p className="text-lg font-semibold">{user.site.domain || 'Belirtilmemiş'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Durum</p>
                <p className="text-lg font-semibold text-green-600">Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities - Interactive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Son Aktiviteler
          </CardTitle>
          <CardDescription>
            Son yapılan işlemler ve güncellemeler
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3">
                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <Link key={activity.id} href={activity.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <p className="text-sm font-medium">{activity.message}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {activity.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      Görüntüle →
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Henüz aktivite bulunmuyor
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Integration Info */}
      {user?.site && (
        <Card>
          <CardHeader>
            <CardTitle>API Entegrasyonu</CardTitle>
            <CardDescription>
              Sitenizde kullanmak için API anahtarınız
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <code className="bg-gray-100 px-3 py-2 rounded text-sm flex-1 font-mono">
                  {user.site.apiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(user.site?.apiKey || '', 'apiKey')}
                >
                  {copied === 'apiKey' ? 'Kopyalandı!' : 'Kopyala'}
                </Button>
              </div>
              <div className="flex gap-2">
                <Link href="/site-settings">
                  <Button variant="outline">
                    Detaylı Entegrasyon
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
