# Role-Based Navigation System

Bu dokümantasyon, LAP CMS uygulamasında kulla// Sadece ADMIN yetkisi gerektiren sayfa
<RoleGuard allowedRoles={['ADMIN']}>
  <AdminOnlyComponent />
</RoleGuard>

// Tüm kullanıcılar erişebilir
<RoleGuard allowedRoles={['ADMIN', 'USER']}>
  <GeneralComponent />
</RoleGuard>nlı navigasyon sistemini açıklar.

## Roller

### ADMIN (Yönetici)
- **Tam Yetki**: Tüm sistem ayarlarına, kullanıcı yönetimine ve içerik yönetimine erişim
- **Kullanıcı Yönetimi**: Kullanıcı ekleme, düzenleme, silme yetkisi
- **Sistem Ayarları**: Güvenlik, genel ayarlar ve sistem konfigürasyonu
- **İçerik Yönetimi**: Tüm içerikleri görme, düzenleme ve yönetme yetkisi

### USER (Kullanıcı)
- **Sınırlı Yetki**: Sadece kendi içeriklerini yönetebilir
- **Kendi İçerikleri**: Sadece kendi oluşturduğu yazıları düzenleyebilir
- **Profil Yönetimi**: Kendi profilini düzenleyebilir

## 🗂️ Menü Yapısı

### Admin Menüsü
```
📊 Dashboard
   └── Genel Bakış
   └── İstatistikler
   └── Aktiviteler

📝 İçerik Yönetimi
   └── Tüm Yazılar
   └── Yeni Yazı
   └── Taslaklar (3)
   └── Yorumlar (12)

🏷️ Kategori & Etiketler
   └── Kategoriler
   └── Etiketler
   └── Yeni Kategori

🖼️ Medya
   └── Medya Kütüphanesi
   └── Yeni Yükleme

👥 Kullanıcılar
   └── Tüm Kullanıcılar
   └── Yeni Kullanıcı
   └── Roller

⚙️ Sistem
   └── Genel Ayarlar
   └── SEO Ayarları
   └── Email Ayarları
   └── Güvenlik
   └── Yedekleme
```

### User Menüsü
```
📊 Dashboard
   └── Genel Bakış

✏️ Yazılarım
   └── Tüm Yazılarım
   └── Yeni Yazı
   └── Taslaklar (1)

🖼️ Medya
   └── Dosyalarım
   └── Yeni Yükleme

👤 Profil
   └── Profilim
   └── Ayarlar
```

## 🛡️ Güvenlik ve Erişim Kontrolü

### RoleGuard Kullanımı
```tsx
// Sadece adminler erişebilir
<RoleGuard allowedRoles={['ADMIN']}>
  <UsersManagement />
</RoleGuard>

// Sadece adminler erişebilir (tüm içerik yönetimi)
<RoleGuard allowedRoles={['ADMIN']}>
  <ContentManagement />
</RoleGuard>

// Tüm kayıtlı kullanıcılar
<RoleGuard allowedRoles={['ADMIN', 'USER']}>
  <Dashboard />
</RoleGuard>
```

### useRoleCheck Hook
```tsx
const { isAdmin, canEditContent, canManageUsers } = useRoleCheck();

// Koşullu render
{isAdmin() && <AdminPanel />}
{canEditContent() && <EditButton />}
{canManageUsers() && <UserManager />}
```

### withRoleGuard HOC
```tsx
// Component'i rolle koruma
const AdminOnlyComponent = withRoleGuard(MyComponent, ['ADMIN']);
```

## 🚦 Özellikler

- **Dinamik menü yapısı** - Role göre farklı menüler
- **Erişim kontrolü** - Sayfa bazında yetki kontrolü
- **Otomatik yönlendirme** - Yetkisiz erişimde fallback
- **Loading states** - Auth kontrolü sırasında yükleme
- **Badge sistemleri** - Bekleyen işlemler için sayaçlar
- **Responsive tasarım** - Mobil uyumlu menüler

Bu yapı sayesinde her kullanıcı rolü kendi seviyesine uygun bir deneyim yaşar ve sistem güvenliği sağlanır.
