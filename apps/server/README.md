# Lap CMS Server

Modern, modüler ve ölçeklenebilir Node.js/Express API server.

## 🚀 Özellikler

- **Modüler Yapı**: Route, middleware ve model'ler ayrı dosyalarda
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **TypeScript**: Tip güvenliği ve geliştirici deneyimi
- **Error Handling**: Kapsamlı hata yönetimi
- **Request Logging**: Geliştirme ortamında istek logları
- **Health Check**: Sistem durumu kontrolü
- **Session Management**: Express session desteği
- **CORS**: Cross-origin resource sharing

## 📁 Proje Yapısı

```
apps/server/
├── src/
│   ├── middleware/
│   │   ├── auth.ts         # Authentication middleware
│   │   └── common.ts       # Common middleware (error, logging)
│   ├── models/
│   │   └── User.ts         # User model ve data access
│   ├── routes/
│   │   ├── auth.ts         # Authentication routes
│   │   ├── api.ts          # API routes
│   │   └── index.ts        # Route mapping
│   └── utils/
│       └── auth.ts         # JWT utilities
├── server.ts               # Ana server dosyası
├── .env                    # Environment variables
└── package.json
```

## 🛠️ Kurulum ve Çalıştırma

```bash
# Dependencies yükle
pnpm install

# Development server başlat
pnpm dev

# Production build
pnpm build

# Production server başlat  
pnpm start
```

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST   | `/auth/login` | Kullanıcı girişi | ❌ |
| POST   | `/auth/logout` | Kullanıcı çıkışı | ❌ |
| GET    | `/auth/me` | Kullanıcı bilgileri | ✅ |
| POST   | `/auth/refresh` | Token yenileme | ✅ |

### API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | `/api/user` | Korumalı kullanıcı endpoint'i | ✅ |
| GET    | `/api/test` | Genel test endpoint'i | ❌ |
| GET    | `/api/health` | Sistem sağlık kontrolü | ❌ |

### Root

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/` | API dokümantasyonu |
| GET    | `/health` | Hızlı sağlık kontrolü |

## 🔐 Security

### Current Security Features

- **httpOnly Cookies**: XSS saldırılarına karşı koruma
- **SameSite Cookies**: CSRF saldırılarına karşı temel koruma
- **CORS Policy**: Sadece izinli origin'lerden istekleri kabul eder
- **Secure Cookies**: Production'da HTTPS zorunlu
- **JWT Tokens**: Stateless authentication
- **Session Management**: Server-side session kontrolü

### CSRF Protection

Şu anki konfigürasyonda **CSRF token'a gerek yok** çünkü:

- ✅ **SameSite=lax** cookie policy aktif
- ✅ **Strict CORS** policy (sadece localhost:3000)
- ✅ **JSON API** (form-based değil)
- ✅ **Single domain** architecture

**CSRF Token eklememiz gereken durumlar:**
- Multi-domain environment
- Form-based authentication
- Iframe embedding
- 3rd party API access
- Public API endpoints

### Authentication

Sistem **httpOnly cookie-based authentication** kullanır. Bu yaklaşım XSS saldırılarına karşı daha güvenlidir.

### Login Request
```json
POST /auth/login
{
  "email": "test@example.com",
  "password": "password"
}
```

### Login Response
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "test@example.com", 
    "name": "Test User"
  },
  "message": "Login successful"
}
```

### Cookie-Based Authentication
- JWT token httpOnly cookie olarak set edilir
- XSS saldırılarına karşı korunur
- Frontend'den `credentials: 'include'` ile request atılmalı
- Token otomatik olarak her request'e eklenir

### Protected Requests
Frontend'den credentials ile:
```javascript
fetch('/api/protected', {
  credentials: 'include'
})
```

API client'lar için header ile:
```http
Authorization: Bearer your-jwt-token
```

## 🧪 Test Kullanıcıları

| Email | Password | Name |
|-------|----------|------|
| test@example.com | password | Test User |
| admin@example.com | password | Admin User |

## ⚙️ Environment Variables

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# Frontend Configuration  
FRONTEND_URL=http://localhost:3000

# Authentication
AUTH_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
```

## 🔧 Geliştirme

### Yeni Route Ekleme

1. `src/routes/` altında yeni route dosyası oluştur
2. `src/routes/index.ts` dosyasında route'u mount et
3. Gerekirse middleware ve model'leri ekle

### Middleware Ekleme

1. `src/middleware/` altında middleware oluştur
2. `server.ts` veya ilgili route'da kullan

### Model Ekleme

1. `src/models/` altında model dosyası oluştur
2. TypeScript interface'leri tanımla
3. Data access method'ları ekle

## 📝 TODO

### Priority 1 (Immediate)
- [ ] **Rate Limiting** (brute force koruması)
- [ ] **Input Validation** (joi/zod ile)
- [ ] **Database entegrasyonu** (PostgreSQL/MongoDB)
- [ ] **Password hashing improvements** (bcrypt rounds)

### Priority 2 (Soon)
- [ ] **Role-based access control** (admin/user roles)
- [ ] **API documentation** (Swagger/OpenAPI)
- [ ] **Unit testler** (Jest)
- [ ] **Email verification**
- [ ] **Password reset**

### Priority 3 (Later)
- [ ] **CSRF Token** (multi-domain durumunda)
- [ ] **API versioning** (/v1/, /v2/)
- [ ] **File upload endpoint'leri**
- [ ] **Audit logging**
- [ ] **Performance monitoring**

## 🤝 Contributing

1. Feature branch oluştur
2. Değişikliklerini commit et
3. Branch'i push et
4. Pull request oluştur
