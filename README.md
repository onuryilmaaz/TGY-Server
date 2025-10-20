# Not Uygulaması Backend API

Node.js, Express.js ve MongoDB kullanılarak oluşturulmuş, authentication ve AI özellikleri içeren not uygulaması backend servisi.

## Proje Yapısı

```
TGY-Server/
├── models/           # Veritabanı modelleri
│   └── User.js
├── routes/           # API route'ları
│   ├── authRoutes.js
│   └── aiRoutes.js
├── controllers/      # İş mantığı
│   ├── authController.js
│   └── aiController.js
├── middlewares/      # Middleware'ler
│   ├── auth.js
│   └── validation.js
├── utils/           # Yardımcı fonksiyonlar
│   ├── jwt.js
│   ├── response.js
│   └── prompts.js
├── config.js        # Konfigürasyon
├── server.js        # Ana server dosyası
└── package.json
```

## Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. MongoDB'yi başlatın:

**macOS (Homebrew):**

```bash
# MongoDB kurulumu (eğer kurulu değilse)
brew tap mongodb/brew
brew install mongodb-community

# MongoDB başlatma
brew services start mongodb-community
# veya
./start-mongodb.sh
```

**Linux:**

```bash
# MongoDB başlatma
sudo systemctl start mongod
# veya
mongod
```

**Windows:**

```bash
# MongoDB servisini başlat
net start MongoDB
# veya
mongod
```

3. Environment variables'ları ayarlayın:

```bash
# .env dosyası oluşturun (environment.example dosyasını kopyalayın)
cp environment.example .env
```

4. `.env` dosyasını düzenleyin:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/tgy-server

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=*

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

5. Server'ı başlatın:

```bash
# Development için
npm run dev

# Production için
npm start
```

## API Endpoints

### Authentication

#### Register

- **POST** `/api/auth/register`
- **Body:**

```json
{
  "firstName": "Ad",
  "lastName": "Soyad",
  "email": "email@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### Login

- **POST** `/api/auth/login`
- **Body:**

```json
{
  "email": "email@example.com",
  "password": "password123"
}
```

#### Get Profile

- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`

#### Update Profile

- **PUT** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "firstName": "Yeni Ad",
  "lastName": "Yeni Soyad",
  "email": "yeni@example.com"
}
```

### AI Endpoints

#### Metin Özetleme

- **POST** `/api/ai/summarize-text`
- **Açıklama:** Notlarınızı, makalelerinizi veya uzun metinlerinizi özetler
- **Body:**

```json
{
  "text": "Özetlenecek uzun metin...",
  "summaryLength": "orta"
}
```

**summaryLength** değerleri: `"kısa"`, `"orta"`, `"uzun"`

#### Görsel Analizi

- **POST** `/api/ai/analyze-image`
- **Açıklama:** Notlarınızdaki görselleri analiz eder, metin okur, içerik açıklar
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `image`: Görsel dosyası (JPEG, PNG, WebP, GIF - Max 5MB)
  - `userText`: Analiz isteği/sorusu (örn: "Bu görseldeki metni oku", "Bu diyagramı açıkla")

#### Resim Yükleme

- **POST** `/api/ai/upload-image`
- **Açıklama:** Resimleri yükler ve dosya sistemine kaydeder
- **Content-Type:** `multipart/form-data`
- **Form Data:**
  - `image`: Görsel dosyası (JPEG, PNG, WebP, GIF - Max 5MB)

**Yanıt:**

```json
{
  "success": true,
  "data": {
    "fileName": "image_1234567890.jpg",
    "originalName": "diagram.jpg",
    "filePath": "/uploads/images/image_1234567890.jpg",
    "fileSize": 245760,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Not Endpoints

#### Tüm Notları Listele

- **GET** `/api/notes`
- **Açıklama:** Tüm notları sayfalama, filtreleme ve arama ile listeler
- **Query Parametreleri:**
  - `page`: Sayfa numarası (varsayılan: 1)
  - `limit`: Sayfa başına not sayısı (varsayılan: 10)
  - `search`: Başlık ve içerikte arama
  - `sortBy`: Sıralama alanı (varsayılan: createdAt)
  - `sortOrder`: Sıralama yönü (asc/desc, varsayılan: desc)

**Örnek:** `GET /api/notes?search=toplantı&page=1&limit=5`

#### Tek Not Getir

- **GET** `/api/notes/:id`
- **Açıklama:** ID'ye göre tek not getirir

#### Yeni Not Oluştur

- **POST** `/api/notes`
- **Açıklama:** Yeni not oluşturur
- **Body:**

```json
{
  "title": "Not Başlığı",
  "content": "Not içeriği...",
  "images": [
    {
      "fileName": "image_1234567890.jpg",
      "originalName": "diagram.jpg",
      "filePath": "/uploads/images/image_1234567890.jpg",
      "fileSize": 245760,
      "mimeType": "image/jpeg"
    }
  ]
}
```

#### Not Güncelle

- **PUT** `/api/notes/:id`
- **Açıklama:** Mevcut notu günceller
- **Body:** (Güncellenecek alanlar)

```json
{
  "title": "Güncellenmiş Başlık",
  "content": "Güncellenmiş içerik"
}
```

#### Not Sil

- **DELETE** `/api/notes/:id`
- **Açıklama:** Notu ve ilişkili resimleri siler

#### Not Resmini Getir

- **GET** `/api/notes/:id/image/:fileName`
- **Açıklama:** Belirtilen nota ait resmi güvenli şekilde getirir
- **Parametreler:**
  - `id`: Not ID'si
  - `fileName`: Resim dosya adı (örn: image_1760721803458.png)

**Örnek:** `GET /api/notes/67123abc456def789/image/image_1760721803458.png`

**Güvenlik Özellikleri:**

- Not'un varlığı kontrol edilir
- Resmin o nota ait olduğu doğrulanır
- Dosyanın fiziksel varlığı kontrol edilir
- Doğru Content-Type header'ı ayarlanır
- Cache optimizasyonu (1 yıl)

## Özellikler

### 🔐 Authentication

- ✅ Kullanıcı kayıt sistemi
- ✅ Kullanıcı giriş sistemi
- ✅ JWT token authentication
- ✅ Şifre hash'leme (bcrypt)

### 📝 Not Yönetimi

- ✅ Not CRUD işlemleri (Oluştur, Oku, Güncelle, Sil)
- ✅ Basit arama (başlık ve içerikte)
- ✅ Sayfalama ve sıralama
- ✅ Çoklu resim desteği

### 🖼️ Görsel Yönetimi

- ✅ Resim yükleme ve saklama
- ✅ Çoklu resim desteği (her nota birden fazla resim)
- ✅ Dosya format kontrolü (JPEG, PNG, WebP, GIF)
- ✅ Dosya boyutu kontrolü (max 5MB)
- ✅ Statik dosya servisi

### 🤖 AI Özellikleri

- ✅ AI metin özetleme (notları özetleme)
- ✅ AI görsel analizi (görsellerdeki metin okuma, içerik analizi)
- ✅ Google Gemini entegrasyonu
- ✅ Esnek prompt sistemi

### 🛠️ Teknik Özellikler

- ✅ Input validation
- ✅ Error handling
- ✅ CORS desteği
- ✅ MongoDB entegrasyonu
- ✅ RESTful API yapısı
- ✅ Comprehensive logging

## Teknolojiler

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Veritabanı
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Şifre hash'leme
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **Google Generative AI** - AI metin ve görsel işleme
- **Multer** - Dosya upload middleware

## Environment Variables

Proje tüm önemli konfigürasyonları environment variables olarak yönetir:

| Variable         | Açıklama                       | Varsayılan                           |
| ---------------- | ------------------------------ | ------------------------------------ |
| `PORT`           | Server portu                   | 3000                                 |
| `NODE_ENV`       | Ortam (development/production) | development                          |
| `MONGODB_URI`    | MongoDB bağlantı string'i      | mongodb://localhost:27017/tgy-server |
| `JWT_SECRET`     | JWT token imzalama anahtarı    | fallback-secret-key                  |
| `JWT_EXPIRE`     | JWT token geçerlilik süresi    | 7d                                   |
| `CORS_ORIGIN`    | CORS izin verilen origin'ler   | \*                                   |
| `GEMINI_API_KEY` | Google Gemini AI API anahtarı  | -                                    |

## Güvenlik

- Şifreler bcrypt ile hash'lenir
- JWT token'lar ile authentication
- Input validation ve sanitization
- CORS koruması
- Error handling ile bilgi sızıntısı önleme
- Environment variables ile güvenli konfigürasyon

## Sorun Giderme

### MongoDB Bağlantı Hatası

### MongoDB bağlantı hatası: connect ECONNREFUSED

**Çözüm:** MongoDB'nin çalıştığından emin olun:

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Port Zaten Kullanımda

### Error: listen EADDRINUSE :::3000

**Çözüm:** Farklı port kullanın:

```bash
# .env dosyasında
PORT=3001
```

### JWT Token Hatası

**Geçersiz token**

**Çözüm:** JWT_SECRET'ı kontrol edin ve token'ı yenileyin.
