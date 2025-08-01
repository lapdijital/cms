import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth-context';
import { AlertTriangle, ArrowLeft, Lock, LogIn, ShieldX, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

export type UserRole = 'ADMIN' | 'USER';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
  showMessage?: boolean;
  redirectDelay?: number; // seconds
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackUrl = '/dashboard',
  showMessage = true,
  redirectDelay = 5
}: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [loginCountdown, setLoginCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Start countdown for login redirect
        setLoginCountdown(redirectDelay);
      } else if (!allowedRoles.includes(user.role)) {
        // Start countdown for unauthorized access
        setCountdown(redirectDelay);
      }
    }
  }, [user, loading, allowedRoles, redirectDelay]);

  // Countdown effect for unauthorized access
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      router.push(fallbackUrl);
    }
  }, [countdown, router, fallbackUrl]);

  // Countdown effect for login redirect
  useEffect(() => {
    if (loginCountdown !== null && loginCountdown > 0) {
      const timer = setTimeout(() => {
        setLoginCountdown(loginCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (loginCountdown === 0) {
      router.push('/login');
    }
  }, [loginCountdown, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <Card className="max-w-md w-full bg-white shadow-xl border border-gray-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <LogIn className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Giriş Gerekli
            </CardTitle>
            <CardDescription className="text-gray-600">
              Bu sayfaya erişmek için giriş yapmanız gerekiyor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <User className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Bilgi</AlertTitle>
              <AlertDescription className="text-blue-700">
                <strong>{loginCountdown}</strong> saniye sonra giriş sayfasına yönlendirileceksiniz
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Yönlendirme</span>
                <span className="font-medium text-blue-600">{loginCountdown}s</span>
              </div>
              <Progress value={((redirectDelay - (loginCountdown || 0)) / redirectDelay) * 100} className="h-2" />
            </div>
            
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Hemen Giriş Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User doesn't have required role
  if (!allowedRoles.includes(user.role)) {
    if (!showMessage) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-6">
        <Card className="max-w-md w-full bg-white shadow-xl border border-red-200">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <ShieldX className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Yetkisiz Erişim
            </CardTitle>
            <CardDescription className="text-gray-600">
              Bu sayfaya erişim yetkiniz bulunmuyor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Yetki Hatası</AlertTitle>
              <AlertDescription className="text-red-700">
                <div className="space-y-1">
                  <div><strong>Gerekli rol:</strong> {allowedRoles.join(', ')}</div>
                  <div><strong>Sizin rolünüz:</strong> {user.role}</div>
                </div>
              </AlertDescription>
            </Alert>

            {countdown !== null && countdown > 0 && (
              <div className="space-y-3">
                <Alert className="border-orange-200 bg-orange-50">
                  <Lock className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">Yönlendirme</AlertTitle>
                  <AlertDescription className="text-orange-700">
                    <strong>{countdown}</strong> saniye sonra dashboard&apos;a yönlendirileceksiniz
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Geri sayım</span>
                    <span className="font-medium text-red-600">{countdown}s</span>
                  </div>
                  <Progress value={((redirectDelay - countdown) / redirectDelay) * 100} className="h-2" />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={() => router.push(fallbackUrl)} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri Dön
              </Button>
              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access
  return <>{children}</>;
}

// Higher Order Component version
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[]
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// Hook for checking roles
type UserLike = {
  role: UserRole;
  [key: string]: unknown;
};

type UseRoleCheckResult = {
  user: UserLike | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isUser: () => boolean;
  canManageUsers: () => boolean;
  canManageSystem: () => boolean;
};

export function useRoleCheck(): UseRoleCheckResult {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => hasRole('ADMIN');
  const isUser = (): boolean => hasRole('USER');
  
  const canManageUsers = (): boolean => hasRole('ADMIN');
  const canManageSystem = (): boolean => hasRole('ADMIN');

  return {
    user: user ? { ...user } : null,
    hasRole,
    hasAnyRole,
    isAdmin,
    isUser,
    canManageUsers,
    canManageSystem,
  };
}
