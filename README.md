// E-Arşiv Toplu İndirici - Backend Integration
// ==============================================
// 
// BU PROJE modern bir arayüz sunar. Gerçek üretim için şu backend
// entegrasyonları gerektirir:
//
// 1. KAYIT SİSTEMİ: Vedop kullanıcı adı/şifreleri veritabanında saklanır
// 2. API ENTEGRASI: Vedof/EA-Şerhat API'sine istek gönderilir
// 3. PDF OLUŞTURMA: E-Arşiv portalundan PDF'ler indirilir
// 4. KULLANİCİ YÖNETİMİ: SMMM ofisi kullanıcıları yönetir
//
//
// API ENDPOINTS:
// POST /api/login        - Vedop kimlik doğrulaması
// GET /api/users         - Tüm kullanıcıları listele
// POST /api/users        - Yeni kullanıcı ekle
// POST /api/download     - Toplu PDF indirme başlat
// GET /api/status/:id    - İndirme ilerlemi
//
//
// VEDOP API Bağlantısı:
// - Endpoint: https://vedop.api/auth/login
// - Method: POST
// - Body: { username, password }
// - Response: { token, userId, permissions }
//
// E-ARŞİV PORTAL:
// - Vedof üzerinden token alınarak belge listesi çekilir
// - PDF'ler base64 formatında döner
// - İndirme işlemi zip dosyası olarak paketlenir
//
//
// GÜVENLİK:
// - Tüm şifreler hash'lenmelidir (bcrypt)
// - API token'ları short-lived olmalı
// - Rate limiting uygulanmalı
// - IP bazlı koruma önerilir
//
//
// DAİLİYOT ÖRNEĞİ:
// const response = await fetch('/api/login', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ username, password })
// });
// const data = await response.json();
// // Vedop token'ı: data.token
// // Kullanıcı ID: data.userId