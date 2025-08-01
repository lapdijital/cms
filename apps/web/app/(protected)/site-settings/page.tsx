"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import {
  AlertTriangle,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Key,
  RefreshCw,
  Settings
} from "lucide-react"
import { useEffect, useState } from "react"

export default function SiteSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordUpdating, setPasswordUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    description: ""
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  // Initialize form with user's site data
  useEffect(() => {
    if (user?.site) {
      setFormData({
        name: user.site.name || "",
        domain: user.site.domain || "",
        description: user.site.description || ""
      })
    }
  }, [user?.site])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError("")
      
      // Validation
      if (!formData.name || formData.name.trim().length === 0) {
        setError("Site adı gereklidir")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/update-site`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          domain: formData.domain.trim() || null,
          description: formData.description.trim() || null
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Site bilgileri güncellenemedi')
      }
      
      setSuccess("Site ayarları başarıyla güncellendi!")
      setTimeout(() => setSuccess(""), 3000)
      
      // Refresh user data to get the updated site information
      await refreshUser()
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Kaydetme sırasında bir hata oluştu"
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordUpdate = async () => {
    try {
      setPasswordUpdating(true)
      setError("")
      
      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setError("Tüm şifre alanlarını doldurun")
        return
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Yeni şifreler eşleşmiyor")
        return
      }
      
      if (passwordData.newPassword.length < 6) {
        setError("Yeni şifre en az 6 karakter olmalıdır")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/update/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Şifre güncellenemedi')
      }
      
      setSuccess("Şifre başarıyla güncellendi!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Şifre güncelleme sırasında bir hata oluştu"
      setError(errorMessage)
    } finally {
      setPasswordUpdating(false)
    }
  }

  const handleRegenerateApiKey = async () => {
    if (!confirm("API anahtarını yenilemek istediğinizden emin misiniz? Eski anahtar artık çalışmayacak.")) {
      return
    }
    
    try {
      setError("")

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/regenerate-api-key`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'API anahtarı yenilenemedi')
      }
      
      setSuccess("API anahtarı başarıyla yenilendi!")
      setTimeout(() => setSuccess(""), 3000)
      
      // Refresh user data to get the new API key
      await refreshUser()
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "API anahtarı yenilenemedi"
      setError(errorMessage)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("Panoya kopyalandı!")
    setTimeout(() => setSuccess(""), 2000)
  }

  const generateEmbedCode = () => {
    if (!user?.site) return ""
    
    return `<!-- LAP CMS - Sadece Veri Kullanımı -->
    <script src="https://apicms.lapdijital.com/api/sdk/lap-cms.js"></script>
    <script>
    LapCMS.init({
        apiKey: '${user.site.apiKey}',
        domain: '${user.site.domain || (typeof window !== 'undefined' ? window.location.hostname : 'localhost')}'
    });
    
    // Sadece veri al, kendi tasarımını yap
    LapCMS.loadPosts({ limit: 5 }).then(data => {
        const container = document.getElementById('my-posts');
        const html = data.posts.map(post => \`
        <article class="my-post">
            <h2>\${post.title}</h2>
            <p>\${post.excerpt}</p>
            <time>\${new Date(post.publishedAt).toLocaleDateString()}</time>
        </article>
        \`).join('');
        container.innerHTML = html;
    });
    </script>`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Ayarları</h1>
        <p className="text-muted-foreground">
          Sitenizin API entegrasyonu ve diğer ayarlarını yönetin
        </p>
      </div>

      {!user?.site && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Henüz bir siteniz bulunmuyor. Lütfen admin ile iletişime geçin.
          </AlertDescription>
        </Alert>
      )}

      {user?.site && (
        <>
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Site Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Site Bilgileri
            </CardTitle>
            <CardDescription>
              Sitenizin temel bilgilerini düzenleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Adı *</Label>
              <Input
                id="siteName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Örn: Benim Blogum"
                className={!formData.name.trim() ? "border-red-300" : ""}
              />
              {!formData.name.trim() && (
                <p className="text-sm text-red-600">Site adı gereklidir</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="Örn: myblog.com (isteğe bağlı)"
              />
              <p className="text-sm text-muted-foreground">
                API istekleri sadece bu domainden kabul edilecek. Boş bırakırsanız tüm domainlerden kabul edilir.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Site hakkında kısa açıklama..."
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving || !formData.name.trim()} className="w-full">
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Password Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Şifre Güncelle
            </CardTitle>
            <CardDescription>
              Hesap şifrenizi değiştirin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Mevcut şifrenizi girin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="En az 6 karakter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Yeni şifrenizi tekrar girin"
              />
            </div>

            <Button onClick={handlePasswordUpdate} disabled={passwordUpdating} className="w-full">
              {passwordUpdating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Şifreyi Güncelle"
              )}
            </Button>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Güvenlik:</strong> Güçlü bir şifre kullanın ve kimseyle paylaşmayın.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Anahtarı
            </CardTitle>
            <CardDescription>
              API entegrasyonu için gerekli anahtar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={user?.site?.apiKey || ""}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(user?.site?.apiKey || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleRegenerateApiKey}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              API Anahtarını Yenile
            </Button>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Önemli:</strong> API anahtarınızı kimseyle paylaşmayın ve güvenli bir yerde saklayın.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Entegrasyon Kodu
          </CardTitle>
          <CardDescription>
            Bu kodu sitenizde kullanarak içeriklerinizi gösterebilirsiniz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>HTML Embed Kodu</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateEmbedCode())}
              >
                <Copy className="mr-2 h-4 w-4" />
                Kopyala
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{generateEmbedCode()}</code>
            </pre>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <ExternalLink className="mr-2 h-4 w-4" />
              API Dokümantasyonu
            </Button>
            <Button variant="outline" className="flex-1">
              <Globe className="mr-2 h-4 w-4" />
              Test Et
            </Button>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
