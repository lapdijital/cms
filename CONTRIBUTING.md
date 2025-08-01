# Katkıda Bulunma Rehberi

LAP CMS projesine katkıda bulunduğunuz için teşekkür ederiz! Bu rehber size nasıl katkıda bulunabileceğinizi gösterecektir.

## Geliştirme Süreci

### 1. Repo'yu Fork Edin ve Clone Edin

```bash
git clone https://github.com/lapdijital/cms.git
cd lap-cms
```

### 2. Dependencies'leri Yükleyin

```bash
pnpm install
```

### 3. Geliştirme Ortamını Ayarlayın

```bash
# Backend .env dosyasını oluşturun
cp apps/server/.env.example apps/server/.env

# Frontend .env dosyasını oluşturun
cp apps/web/.env.example apps/web/.env.local

# Veritabanını migrate edin
cd apps/server
npx prisma migrate dev
```

### 4. Yeni Bir Branch Oluşturun

```bash
git checkout -b feature/your-feature-name
# veya
git checkout -b fix/your-bug-fix
```

## Kod Standartları

### TypeScript
- Tüm yeni kod TypeScript ile yazılmalıdır
- Strict type checking kullanın
- `any` tipini mümkün olduğunca kaçının

### Stil Rehberi
- ESLint ve Prettier konfigürasyonlarına uyun
- Kod formatı için `pnpm format` çalıştırın
- Linting için `pnpm lint` çalıştırın

### Commit Mesajları
Conventional Commits formatını kullanın:

```
type(scope): description

# Örnekler:
feat(auth): add JWT token refresh
fix(posts): resolve image upload issue
docs(readme): update installation guide
style(ui): improve button hover states
refactor(api): optimize database queries
test(users): add user creation tests
```

### Component Yapısı

#### Frontend (Next.js)
```typescript
// Component dosya yapısı
export interface ComponentProps {
  // Props interface'i
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  // Component implementation
}
```

#### Backend (Express.js)
```typescript
// Route handler yapısı
router.post('/endpoint',
  middleware1,
  middleware2,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Implementation
    } catch (error) {
      // Error handling
    }
  }
);
```

## Test Yazma

### Frontend Tests
```bash
cd apps/web
pnpm test
```

### Backend Tests
```bash
cd apps/server
pnpm test
```

### Test Yazma Standartları
- Unit testler yazın
- Integration testler için önemli endpoint'leri test edin
- Test coverage'ı %80 üzerinde tutmaya çalışın

## Pull Request Süreci

### 1. Kodunuzu Test Edin
```bash
# Tüm testleri çalıştırın
pnpm test

# Build'i test edin
pnpm build

# Linting kontrolü
pnpm lint
```

### 2. Commit ve Push
```bash
git add .
git commit -m "feat(scope): your feature description"
git push origin feature/your-feature-name
```

### 3. Pull Request Oluşturun

Pull Request oluştururken:
- Açıklayıcı bir başlık yazın
- Değişiklikleri detaylı açıklayın
- İlgili issue'ları link edin
- Screenshots ekleyin (UI değişiklikleri için)

### Pull Request Template

```markdown
## Değişiklik Türü
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Açıklama
[Değişikliklerinizi açıklayın]

## Test
- [ ] Testler yazıldı/güncellendi
- [ ] Tüm testler geçti
- [ ] Manuel test yapıldı

## Screenshots (varsa)
[Screenshots ekleyin]

## Checklist
- [ ] Kod ESLint kurallarına uygun
- [ ] TypeScript strict mode uyumlu
- [ ] Documentation güncellendi
- [ ] Commit mesajları conventional format'ta
```

## Issue Raporlama

### Bug Reports
```markdown
**Bug Açıklaması**
[Bug'ı kısaca açıklayın]

**Tekrar Etme Adımları**
1. ...
2. ...
3. ...

**Beklenen Davranış**
[Ne olmasını bekliyordunuz]

**Gerçek Davranış**
[Ne oldu]

**Çevre**
- OS: [örn. macOS, Windows, Linux]
- Browser: [örn. Chrome, Firefox]
- Version: [proje versiyonu]

**Screenshots**
[Varsa ekleyin]
```

### Feature Requests
```markdown
**Özellik Açıklaması**
[Özelliği açıklayın]

**Motivation**
[Neden bu özellik gerekli]

**Önerilen Çözüm**
[Nasıl implement edilebilir]

**Alternatifler**
[Düşündüğünüz alternatifler]
```

## Kod Review Süreci

### Review Kriterleri
- [ ] Kod temiz ve okunabilir
- [ ] Performance optimize edilmiş
- [ ] Security best practices uygulandı
- [ ] Tests yeterli coverage'a sahip
- [ ] Documentation güncel

### Review Guidelines
- Yapıcı feedback verin
- Kod yerine yaklaşımı eleştirin
- Örnekler verin
- Takdir etmeyi unutmayın

## Release Süreci

1. Version bump (semantic versioning)
2. CHANGELOG.md güncelleme
3. Tag oluşturma
4. Release notes yazma

## Yardım

Sorularınız varsa:
- GitHub Discussions kullanın
- Issue açın
- Email gönderin

Katkılarınız için teşekkürler! 🚀
