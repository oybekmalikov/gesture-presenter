# 🚀 OKMK Gesture Presenter — Serverga O'rnatish va Joylashtirish Qo'llanmasi (Deployment Guide)

Ushbu qo'llanma orqali loyihani istalgan Linux (Ubuntu / Debian / CentOS) serveriga **Docker** va **Docker Compose** yordamida to'liq va xavfsiz o'rnatishingiz mumkin.

---

## 📋 1. Server Talablari (System Requirements)

- **OS**: Ubuntu 22.04 LTS / Ubuntu 24.04 LTS tavsiya etiladi.
- **CPU**: Kamida 2 yadro (4 yadro tavsiya etiladi).
- **RAM**: Kamida 4 GB (WebRTC va 3D modellar uchun 8 GB tavsiya etiladi).
- **Disk**: Kamida 20 GB SSD (Taqdimot fayllari va video yozuvlar uchun).
- **Dasturlar**: Docker va Docker Compose (V2).

---

## 🛠️ 2. Serverda Docker va Docker Compose O'rnatish

Agar serveringizda Docker hali o'rnatilmagan bo'lsa, quyidagi buyruqlarni bajaring:

```bash
# Tizim paketlarini yangilash
sudo apt update && sudo apt upgrade -y

# Kerakli utilitalarni o'rnatish
sudo apt install -y curl wget git ufw

# Rasmiy Docker o'rnatish skripti
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose plaginini tekshirish
docker compose version
```

---

## 📦 3. Loyihani Serverga Yuklash va Sozlash

### 1-qadam: Loyihani serverga klonlash
```bash
cd /opt
# yoki istalgan papkaga
git clone <LOYIHA_GIT_URL> gesture-presenter
cd gesture-presenter
```

### 2-qadam: Muhit o'zgaruvchilarini (`.env`) sozlash
Root papkada `.env` faylini yarating:

```bash
cp .env.example .env
nano .env
```

`.env` faylida o'zingizning xavfsiz parollaringizni kiriting:
```ini
# Server Portlari (Standart 80 va 443)
HTTP_PORT=80
HTTPS_PORT=443

# PostgreSQL Ma'lumotlar Bazasi
DB_NAME=okmk_seminar
DB_USER=okmk_user
DB_PASSWORD=sizning_kuchli_parolingiz_2026

# Xavfsizlik kaliti (JWT)
JWT_SECRET=juda_maxfiy_va_uzun_tasodifiy_kalit_2026

# Dastlabki Administrator Akkauntlari
DEFAULT_SUPERADMIN_USERNAME=superadmin
DEFAULT_SUPERADMIN_PASSWORD=superadmin_paroli_2026
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin_paroli_2026
```

---

## 🔒 4. SSL Sertifikatini O'rnatish (HTTPS & Kamera Huquqlari Uchun)

> [!IMPORTANT]
> Brauzerda WebRTC (Jonli video, audio va AI qo'l harakatini aniqlash kamerasi) faqat **HTTPS (SSL)** protokoli orqali ishlaydi.

### Variant A: O'z Domen nomingiz bo'lsa (Let's Encrypt / Bepul SSL):
Agar sizda domen bo'lsa (masalan: `seminar.agmk.uz`):
```bash
sudo apt install -y certbot

# Sertifikat olish (Nginx to'xtab turgan paytda)
sudo certbot certonly --standalone -d seminar.agmk.uz

# Olingan sertifikatlarni loyihaning ssl papkasiga nusxalash:
cp /etc/letsencrypt/live/seminar.agmk.uz/fullchain.pem ./frontend/ssl/ssl.crt
cp /etc/letsencrypt/live/seminar.agmk.uz/privkey.pem ./frontend/ssl/ssl.key
```

### Variant B: Lokal / Ichki Server (Self-signed SSL):
Loyiha ichida tayyor self-signed SSL sertifikat mavjud. Istasangiz, yangisini quyidagicha yaratishingiz mumkin:
```bash
mkdir -p ./frontend/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ./frontend/ssl/ssl.key \
  -out ./frontend/ssl/ssl.crt \
  -subj "/C=UZ/ST=Tashkent/L=Almalyk/O=OKMK/CN=okmk-presenter.local"
```

---

## 🚢 5. Loyihani Ishga Tushirish (Docker Build & Run)

Barcha konteynerlarni (PostgreSQL, Redis, Backend NestJS, Frontend Nginx) bir vaqtda build qilish va orqa fonda ishga tushirish:

```bash
# Barcha servislarni yig'ish va ishga tushirish
docker compose up -d --build
```

Konteynerlar holatini tekshirish:
```bash
docker compose ps
```

Konteynerlar loglarini jonli kuzatish:
```bash
# Barcha loglar
docker compose logs -f

# Faqat backend loglari
docker compose logs -f backend
```

---

## 🗄️ 6. Boshlang'ich Ma'lumotlarni Bazaga Kiritish (Database Seed)

Baza yangi bo'lsa, OKMK bo'limlari, namunaviy foydalanuvchilar, 3D modellar va test taqdimotlarini kiritish uchun:

```bash
docker compose exec backend npm run seed
```

---

## 🔥 7. Server Xavfsizlik Devori (Firewall / UFW) Sozlamalari

Serveringizda faqat kerakli portlarni ochiq qoldiring:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🔄 8. Yangilash va Servisni Boshqarish Buyruqlari

```bash
# Loyihani to'xtatish
docker compose down

# Loyihani qayta ishga tushirish
docker compose restart

# Yangi kodni yuklab qayta build qilish:
git pull
docker compose up -d --build
```

---

## ✅ Tizimga Kirish

Brauzeringizda server IP manzili yoki domeniga kiring:
- **URL**: `https://<SERVER_IP_YOKI_DOMEN>`
- **Superadmin**: `superadmin` / `.env` da ko'rsatilgan parol
- **Admin**: `admin` / `.env` da ko'rsatilgan parol
