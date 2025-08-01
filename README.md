# LAP CMS - Content Management System

Modern, güçlü ve esnek bir içerik yönetim sistemi. Next.js, Express.js ve PostgreSQL teknolojileri ile geliştirilmiştir.

## 🚀 Özellikler

- **Modern Teknolojiler**: Next.js 14, Express.js, TypeScript, Prisma ORM
- **Blog Yönetimi**: Kapsamlı blog yazısı editörü ve yönetimi
- **SEO Optimizasyonu**: Gerçek zamanlı SEO puanlama sistemi
- **Kullanıcı Yönetimi**: Rol tabanlı kullanıcı sistemi (Admin/User)
- **Medya Yönetimi**: MinIO ile güvenli dosya yükleme
- **Dashboard**: Analitik ve istatistikler
- **API Integration**: RESTful API desteği
- **Real-time Editor**: EditorJS ile zengin içerik editörü

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **EditorJS** - Rich text editor

### Backend
- **Express.js** - Node.js framework
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Database
- **MinIO** - Object storage
- **JWT** - Authentication

### DevOps
- **Turborepo** - Monorepo management
- **pnpm** - Package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📁 Proje Yapısı

```
cms/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── server/       # Express.js backend API
├── packages/
│   ├── eslint-config/     # ESLint configurations
│   ├── typescript-config/ # TypeScript configurations
│   └── ui/               # Shared UI components
└── README.md
```

## 🔧 Kurulum

### Gereksinimler
- Node.js 18+ 
- pnpm
- PostgreSQL
- MinIO (opsiyonel, yerel geliştirme için)

### 1. Depoyu klonlayın
```bash
git clone https://github.com/lapdijital/cms.git
cd cms
```

### 2. Bağımlılıkları yükleyin
```bash
pnpm install
```

### 3. Ortam değişkenlerini ayarlayın

**Backend (.env)**
```bash
cd apps/server
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
PORT=3003
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
AUTH_SECRET="add auth secret key" npx auth secret komutunu kullanarak oluşturabilirsiniz.
DATABASE_URL="veritabanı bağlantı stringi"
UPLOAD_KEY="Minio api key"
UPLOAD_SECRET="Minio api secret"
UPLOAD_URL="Minio backend urlsi"```

**Frontend (.env.local)**
```bash
cd apps/web
cp .env.example .env.local
```

### 4. Veritabanını oluşturun
```bash
cd apps/server
npx prisma migrate dev
npx prisma db seed
```

## 🚀 Geliştirme

### Tüm servisleri başlatın
```bash
pnpm dev
```

Bu komut şunları başlatır:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3003

### Sadece frontend'i başlatın
```bash
pnpm dev --filter=web
```

### Sadece backend'i başlatın
```bash
pnpm dev --filter=server
```

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - Giriş yap
- `POST /auth/logout` - Çıkış yap
- `GET /auth/me` - Mevcut kullanıcı bilgisi

### Posts
- `GET /api/posts` - Tüm blog yazıları
- `POST /api/posts` - Yeni yazı oluştur
- `PUT /api/posts/:id` - Yazı güncelle
- `DELETE /api/posts/:id` - Yazı sil

### Users (Admin)
- `GET /api/users` - Tüm kullanıcılar
- `POST /api/users` - Yeni kullanıcı oluştur
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil

## 🔒 Güvenlik

- JWT tabanlı authentication
- Role-based access control (RBAC)
- Input validation ve sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## 📊 SEO Özellikleri

- Meta title ve description optimizasyonu
- Open Graph tags
- Twitter Card desteği
- Schema.org markup
- Canonical URLs
- Gerçek zamanlı SEO puanlama (100 puan sistemi)

## 🎨 UI/UX

- Responsive tasarım
- Dark/Light mode desteği
- Accessible components
- Modern ve kullanıcı dostu arayüz
- Real-time feedback

## 📦 Build

### Production build
```bash
pnpm build
```

### Sadece frontend build
```bash
pnpm build --filter=web
```

### Sadece backend build
```bash
pnpm build --filter=server
```

## 🧪 Test

```bash
pnpm test
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyiniz.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 👨‍💻 Geliştirici

**Eren Demirci**
- GitHub: [@lapdijital](https://github.com/lapdijital)
- Email: lapdijital@gmail.com

## 📞 Destek

Herhangi bir sorunuz varsa:
- Issue açın: [GitHub Issues](https://github.com/lapdijital/cms/issues)
- Email: lapdijital@gmail.com

---

⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!
