# Firebase Kurulum Rehberi

## Firebase Security Rules Düzeltme

Ürün yönetimi özelliğinin çalışması için Firebase Realtime Database security rules'ını güncellemeniz gerekiyor.

### 1. Firebase Console'a Giriş
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Projenizi seçin
3. Sol menüden "Realtime Database" seçin
4. "Rules" sekmesine tıklayın

### 2. Security Rules'ı Güncelleyin

`firebase-security-rules.json` dosyasındaki güncel rules'ı Firebase Console'a kopyalayın. Bu dosya tam güvenlik rules'ını içerir ve şunları sağlar:

- **Users**: Sadece admin kullanıcılar tüm kullanıcıları görebilir
- **Reports**: Tüm authenticated kullanıcılar raporları görebilir, sadece kendi raporlarını yazabilir
- **CommodityList**: Tüm kullanıcılar okuyabilir, sadece admin yazabilir

Rules'ı güncellemek için:
1. Firebase Console'da "Realtime Database" > "Rules" sekmesine gidin
2. `firebase-security-rules.json` dosyasının içeriğini kopyalayın
3. Rules editörüne yapıştırın
4. "Publish" butonuna tıklayın

### 3. Rules Açıklaması

- **reports**: Tüm giriş yapmış kullanıcılar okuyabilir ve yazabilir
- **users**: Sadece admin kullanıcılar okuyabilir ve yazabilir
- **commodityList**: Tüm kullanıcılar okuyabilir, sadece admin kullanıcılar yazabilir

### 4. Test Etme

Rules'ı güncelledikten sonra:
1. Uygulamayı yeniden başlatın
2. Admin hesabı ile giriş yapın
3. "Ürün Yönetimi" sekmesine gidin
4. Ürünlerin yüklendiğini kontrol edin

### 5. Alternatif Çözüm (Geçici)

Eğer rules'ı hemen güncelleyemiyorsanız, uygulama şu anda varsayılan ürün listesi ile çalışmaya devam edecektir. Bu durumda:

- Taze dolap dolum raporları oluşturulabilir
- Admin paneli çalışır (sadece ürün listesi boş görünür)
- JSON import özelliği çalışmaz

### 6. JSON Import İçin

JSON dosyasından ürün verilerini içe aktarmak için:
1. Firebase rules'ı yukarıdaki gibi güncelleyin
2. Admin paneline giriş yapın
3. "Ürün Yönetimi" sekmesine gidin
4. "JSON'dan İçe Aktar" butonunu kullanın
5. `dogus-otomat-default-rtdb-export.json` dosyasını seçin

## Sorun Giderme

### "Permission denied" Hatası
- Firebase rules'ı kontrol edin
- Kullanıcının admin rolüne sahip olduğundan emin olun
- Firebase Console'da Authentication bölümünden kullanıcı rollerini kontrol edin

### Ürün Listesi Boş Görünüyor
- Firebase'de `commodityList` node'unun var olduğundan emin olun
- JSON import işlemini gerçekleştirin
- Browser console'da hata mesajlarını kontrol edin

### JSON Import Çalışmıyor
- Dosya formatının doğru olduğundan emin olun
- `commodityList` anahtarının JSON'da mevcut olduğunu kontrol edin
- Firebase rules'ın yazma izni verdiğinden emin olun
