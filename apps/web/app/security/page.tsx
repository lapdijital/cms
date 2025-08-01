"use client";

import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Settings, Shield, Users } from "lucide-react";

function SecurityPageContent() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-red-600" />
        <h1 className="text-3xl font-bold">Güvenlik Yönetimi</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Güvenlik Ayarları</span>
            </CardTitle>
            <CardDescription>
              Sistem güvenlik yapılandırması
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Güvenlik Duvarı
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Oturum Yönetimi
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Şifre Politikaları
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Güvenlik Logları</CardTitle>
            <CardDescription>
              Son güvenlik olayları
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>• Başarısız giriş denemeleri: 3</p>
              <p>• Son güvenlik taraması: 2 saat önce</p>
              <p>• Aktif oturumlar: 5</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-semibold text-red-800 mb-2">⚠️ Admin Yetkisi Gerekli</h3>
        <p className="text-red-700 text-sm">
          Bu sayfa sadece ADMIN rolüne sahip kullanıcılar tarafından erişilebilir.
          USER rolü ile giriş yapmış kullanıcılar otomatik olarak yönlendirilecektir.
        </p>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  return (
    <RoleGuard 
      allowedRoles={['ADMIN']}
      fallbackUrl="/dashboard"
      redirectDelay={5}
    >
      <SecurityPageContent />
    </RoleGuard>
  );
}
