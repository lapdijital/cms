"use client";

import { RoleGuard } from "@/components/role-guard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { userApi, UserCreateRequest } from "@/lib/api/users";
import { AlertCircle, ArrowLeft, CheckCircle, Save, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER' as 'ADMIN' | 'USER',
    siteName: '',
    bio: '',
    isActive: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Form validation
      if (formData.password !== formData.confirmPassword) {
        setError('Şifreler eşleşmiyor!');
        return;
      }

      if (formData.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır!');
        return;
      }

      if (!formData.name || !formData.email) {
        setError('Ad ve e-posta alanları zorunludur!');
        return;
      }

      // Prepare API request data
      const userData: UserCreateRequest = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        bio: formData.bio || undefined,
        isActive: formData.isActive,
        siteName: formData.siteName || undefined
      };

      // Call API
      const response = await userApi.createUser(userData);
      
      setSuccess(`Kullanıcı başarıyla oluşturuldu! ${response.site ? `Site: ${response.site.name}` : ''}`);
      
      // Redirect to users list after 2 seconds
      setTimeout(() => {
        router.push('/users');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Kullanıcı oluşturulurken hata oluştu!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push('/users')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kullanıcı Listesine Dön
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserPlus className="h-8 w-8" />
              Yeni Kullanıcı Ekle
            </h1>
            <p className="text-muted-foreground mt-2">
              Sisteme yeni bir kullanıcı ekleyin ve rolünü belirleyin
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Temel Bilgiler */}
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
                <CardDescription>
                  Kullanıcının temel bilgilerini girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Örn: Ahmet Yılmaz"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Örn: ahmet@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Adı</Label>
                  <Input
                    id="siteName"
                    type="text"
                    placeholder="Örn: Ahmet'in Blog Sitesi"
                    value={formData.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Kullanıcının kişisel site adı (opsiyonel)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Biyografi</Label>
                  <Textarea
                    id="bio"
                    placeholder="Kullanıcı hakkında kısa bilgi..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Güvenlik Bilgileri */}
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Bilgileri</CardTitle>
                <CardDescription>
                  Kullanıcının şifre ve rol bilgilerini ayarlayın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="En az 6 karakter"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Şifre Tekrar *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Şifreyi tekrar girin"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Kullanıcı Rolü *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: 'ADMIN' | 'USER') => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin - Tam yetki</SelectItem>
                      <SelectItem value="USER">User - Sınırlı yetki</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {formData.role === 'ADMIN' 
                      ? 'Tüm sistem özelliklerine erişim' 
                      : 'Sadece kendi içeriklerini yönetebilir'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Durum Ayarları */}
            <Card>
              <CardHeader>
                <CardTitle>Durum Ayarları</CardTitle>
                <CardDescription>
                  Kullanıcının hesap durumunu belirleyin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">
                    {formData.isActive ? 'Hesap Aktif' : 'Hesap Pasif'}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Pasif hesaplar sisteme giriş yapamaz
                </p>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex items-center gap-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Kullanıcı Oluştur
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/users')}
                disabled={isLoading}
              >
                İptal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </RoleGuard>
  );
}
