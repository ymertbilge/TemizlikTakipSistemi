# Doğuş Otomat Temizlik Takip Sistemi

Bu proje, Doğuş Otomat için geliştirilmiş bir temizlik ve dolum takip sistemidir.

## Özellikler

### Genel Özellikler
- **Kullanıcı Yönetimi**: Admin ve operasyon sorumlusu rolleri
- **Rapor Oluşturma**: Dondurma temizlik ve taze dolap dolum raporları
- **Fotoğraf Yükleme**: Öncesi, sonrası ve sorun fotoğrafları
- **Dashboard**: Kullanıcı bazlı rapor görüntüleme

### Yeni Eklenen Özellikler

#### 1. Ürün Yönetimi
- **Admin Paneli**: Ürün ekleme, düzenleme ve silme
- **JSON İçe Aktarma**: Mevcut ürün verilerini JSON dosyasından içe aktarma
- **Dinamik Ürün Listesi**: Firebase'den yüklenen güncel ürün listesi
- **Ürün Detayları**: Kod, ad, fiyat, tedarikçi, tip ve açıklama bilgileri

#### 2. Gelişmiş Rapor Filtreleme
- **Tarih Filtresi**: Başlangıç ve bitiş tarihine göre rapor filtreleme
- **Rapor Türü Filtresi**: Dondurma temizlik ve taze dolap dolum raporları
- **Otomatik Sıralama**: En yeni raporlar her zaman en üstte görünür

#### 3. Admin Panel Geliştirmeleri
- **Ürün Yönetimi Sekmesi**: Tam CRUD işlemleri
- **Toplu İçe Aktarma**: JSON dosyasından ürün verilerini toplu yükleme
- **Gelişmiş Filtreleme**: Tarih ve rapor türü kombinasyonu
- **Kullanıcı Yönetimi**: Kullanıcı ekleme, düzenleme ve durum kontrolü

## Kurulum

1. Projeyi klonlayın
2. `npm install` komutunu çalıştırın
3. Firebase yapılandırmasını `src/config/firebase.js` dosyasında ayarlayın
4. `npm start` ile uygulamayı başlatın

## Kullanım

### Admin Kullanıcıları
1. **Ürün Yönetimi**: Admin panelinde "Ürün Yönetimi" sekmesini kullanın
2. **JSON İçe Aktarma**: Mevcut ürün verilerini JSON dosyasından yükleyin
3. **Rapor Filtreleme**: Tarih aralığı ve rapor türü ile filtreleme yapın

### Operasyon Sorumluları
1. **Rapor Oluşturma**: Yeni rapor oluşturma sayfalarını kullanın
2. **Dinamik Ürün Listesi**: Güncel ürün listesinden seçim yapın
3. **Fotoğraf Yükleme**: Zorunlu öncesi ve sonrası fotoğrafları ekleyin

## Teknik Detaylar

### Firebase Yapısı
```
temizlikTakip/
├── reports/          # Raporlar
├── users/            # Kullanıcılar
└── commodityList/    # Ürün listesi
```

### Ürün Veri Yapısı
```json
{
  "Commodity code": "3333",
  "Product name": "Kruvasan",
  "Unit price": "25",
  "Cost price": "8",
  "Supplier": "UNO",
  "Specs": "no",
  "Type": "Pastane Ürünü",
  "Description": ""
}
```

## Geliştirme

### Yeni Özellik Ekleme
1. Firebase servislerini `src/services/firebaseService.js` dosyasında güncelleyin
2. Bileşenleri `src/components/` klasöründe oluşturun
3. Routing'i `src/App.js` dosyasında ayarlayın

### Veri İçe Aktarma
JSON dosyasından ürün verilerini içe aktarmak için:
1. Admin paneline giriş yapın
2. "Ürün Yönetimi" sekmesine gidin
3. "JSON'dan İçe Aktar" butonunu kullanın
4. JSON dosyasını seçin

## Lisans

Bu proje Doğuş Otomat için özel olarak geliştirilmiştir.
