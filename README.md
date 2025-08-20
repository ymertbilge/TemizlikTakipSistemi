# Doğuş Otomat Temizlik Takip Sistemi

Bu proje, Doğuş Otomat'ın dondurma otomatlarının routeman ekibinin otomat kontrollerini ve temizlik işlemlerini takip etmek için geliştirilmiş bir web uygulamasıdır.

## Özellikler

- **Genel Kontrol Listesi**: Dondurma otomatının temel işlevlerinin kontrolü
- **Temizlik Kontrol Listesi**: Temizlik işlemlerinin takibi
- **Fotoğraf Yükleme**: Öncesi, sonrası ve arıza fotoğrafları
- **Tarih ve Saat Takibi**: Her işlem için zaman damgası
- **Model Seçimi**: Farklı otomat modelleri için rapor oluşturma
- **Not Ekleme**: Ek gözlemler ve öneriler
- **Admin Panel**: Kullanıcı yönetimi ve rapor takibi

## Desteklenen Modeller

- Dogi Soft Ice Cream
- Diğer modeller

## Kurulum

### Frontend Kurulumu

```bash
cd frontend
npm install
npm start
```

Frontend varsayılan olarak `http://localhost:3000` portunda çalışacaktır.

### Production Build

```bash
cd frontend
npm run build:prod
```

Production build için:
- Source map'ler devre dışı
- Console log'lar kaldırıldı
- Environment variables validasyonu
- Güvenlik önlemleri aktif

### Environment Variables

Production için `.env.production` dosyası oluşturun:

```bash
# .env.production
NODE_ENV=production
GENERATE_SOURCEMAP=false
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_DATABASE_URL=your_database_url
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

### Giriş Yapma

1. Tarayıcıda `http://localhost:3000` adresine gidin
2. Admin hesabı ile giriş yaparsanız admin paneline erişim kazanırsınız
3. Routeman hesabı ile giriş yaparsanız rapor oluşturma sayfasına yönlendirilirsiniz

### Rapor Oluşturma

1. Ana sayfada "Yeni Rapor Oluşturmaya Başla" butonuna tıklayın
2. Lokasyon bilgisini girin
3. Otomat modelini seçin
4. Tarih ve saati kontrol edin
5. Genel kontrol listesini doldurun:
   - Otomat çalışma durumu
   - Dondurma çıkış kontrolü
   - Ekran ve aydınlatma
   - Soğutma sistemi
   - Dondurma sıcaklığı ve kalitesi
   - Kapak fonksiyonları
6. Temizlik kontrol listesini doldurun:
   - Dış yüzey temizliği
   - Cam yüzeyler
   - Dondurma çıkış bölümü
   - Kapak ve menteşe
   - Çevre alanı
   - Dondurma kalıntıları
7. Gerekli fotoğrafları ekleyin:
   - Öncesi fotoğraflar
   - Sonrası fotoğraflar
   - Arıza/Problem fotoğrafları (varsa)
8. Ek notlar ekleyin
9. "Raporu Oluştur ve Yükle" butonuna tıklayın

### Admin Panel

Admin hesabı ile giriş yaptığınızda:

1. **Kullanıcı Ekle**: Yeni kullanıcı oluşturma
2. **Kullanıcı Listesi**: Mevcut kullanıcıları görüntüleme ve yönetme
3. **Raporlar**: Tüm raporları görüntüleme ve CSV olarak dışa aktarma

## Teknik Detaylar

### Backend (Node.js + Express)
- RESTful API endpoints
- Dosya upload sistemi
- In-memory veri saklama (production'da database kullanılmalı)
- CORS desteği
- Rate limiting
- Security middleware (Helmet)

### Frontend (React + Material-UI)
- Modern ve responsive tasarım
- Form validasyonu
- Fotoğraf önizleme
- Real-time güncelleme
- Model seçimi dropdown
- Backend API entegrasyonu

### Authentication
- Role-based access control (Admin/Routeman)
- Secure password hashing (bcrypt)
- Token expiration (24 saat)

## Klasör Yapısı

```
Doğuş Otomat Temizlik Takip Sistemi/
├── backend/          # Node.js backend
│   ├── routes/       # API route'ları
│   │   ├── auth.js   # Authentication routes
│   │   ├── users.js  # User management routes
│   │   ├── reports.js # Report management routes
│   │   └── upload.js # File upload routes
│   ├── server.js     # Ana server dosyası
│   ├── package.json  # Backend dependencies
│   └── env.example   # Environment variables örneği
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── AdminPanel.js
│   │   │   └── NewReport.js
│   │   ├── services/
│   │   │   ├── api.js          # Firebase API (eski)
│   │   │   └── backendApi.js   # Backend API (yeni)
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json  # Frontend dependencies
└── README.md
```

## Gereksinimler

- Node.js >= 16.0.0
- npm veya yarn
- Modern web tarayıcısı
- Backend API çalışır durumda olmalı

## Sorun Giderme

### Firebase Authentication Hatası
Eğer `auth/invalid-credential` hatası alıyorsanız:
1. Backend'in çalıştığından emin olun (`http://localhost:5000`)
2. Frontend'in backend API'yi kullandığından emin olun
3. Varsayılan kullanıcı bilgilerini kullanın

### Backend Bağlantı Hatası
1. Backend'in çalıştığını kontrol edin: `http://localhost:5000/api/health`
2. Port 5000'in kullanılabilir olduğundan emin olun
3. CORS ayarlarını kontrol edin

### Frontend Bağlantı Hatası
1. Frontend'in çalıştığını kontrol edin: `http://localhost:3000`
2. Backend API URL'ini kontrol edin
3. Browser console'da hata mesajlarını kontrol edin

## Lisans

Bu proje Doğuş Otomat için özel olarak geliştirilmiştir.

## Geliştirici Notları

- Backend şu anda in-memory veri saklama kullanıyor. Production'da PostgreSQL veya MongoDB gibi bir database kullanılmalı.
- File upload sistemi şu anda local storage kullanıyor. Production'da AWS S3 veya benzeri bir cloud storage kullanılmalı.
- Rate limiting ve security middleware production için yeterli olmalı.
