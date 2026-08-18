# OKMK AI Taqdimot Platformasini Serverga O'rnatish Qo'llanmasi (Deployment Guide)

Mazkur loyiha ishlab chiqarish (production) serveriga o'rnatish uchun to'liq tayyorlangan. Quyida serverga o'rnatishning 2 xil qulay usuli keltirilgan.

---

## 1-USUL: Docker & Docker-Compose orqali o'rnatish (Eng tavsiya etiladigan va tezkor usul)

Docker usulida barcha bog'liqliklar (LibreOffice, Node.js, OpenCASCADE, Nginx, shriflar) konteyner ichida avtomatik o'rnatiladi va serverda qo'shimcha paketlar o'rnatish talab etilmaydi.

### Bosqichlar:

1. **Loyiha fayllarini serverga yuklang:**
   ```bash
   git clone <repo_url> /var/www/gesture-presenter
   cd /var/www/gesture-presenter
   ```

2. **`.env` faylini sozlang:**
   `backend/.env` faylida Root parolni o'zingiz xohlagan parolga o'zgartiring:
   ```env
   PORT=5050
   ROOT_PASSWORD=okmk2026_maxfiy_parol
   ```

3. **Docker konteynerlarini ishga tushiring:**
   ```bash
   docker compose up -d --build
   ```

4. **Holatni tekshiring:**
   ```bash
   docker compose ps
   docker compose logs -f
   ```

> [!TIP]
> Tizim avtomatik ravishda `http://server_ip` (port 80) va `http://server_ip:4664` da ishlaydi. Fayllar `./backend/public` papkasida saqlanib qoladi (persist bo'ladi).

---

## 2-USUL: Linux (Ubuntu/Debian) Serverda PM2 va Nginx orqali o'rnatish (Native usul)

Agar serveringizda Docker ishlatmasdan to'g'ridan-to'g'ri o'rnatmoqchi bo'lsangiz:

### 1-qadam: Serverga zarur paketlarni o'rnatish
```bash
sudo apt update && sudo apt upgrade -y
# Node.js 20 yoki 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs libreoffice libreoffice-impress nginx fonts-dejavu git
# PM2 jarayon boshqaruvchisi
sudo npm install -g pm2
```

### 2-qadam: Backendni o'rnatish va ishga tushirish
```bash
cd /var/www/gesture-presenter/backend
npm install
npm run build

# PM2 orqali backendni fonda doimiy ishga tushirish
pm2 start ../ecosystem.config.cjs
pm2 save
pm2 startup
```

### 3-qadam: Frontendni build qilish
```bash
cd /var/www/gesture-presenter/frontend
npm install
npm run build
```
Build natijasida `/var/www/gesture-presenter/frontend/dist` jildi hosil bo'ladi.

### 4-qadam: Nginx sozlamalari (`/etc/nginx/sites-available/okmk-presenter`)
Fayl yarating: `sudo nano /etc/nginx/sites-available/okmk-presenter`
```nginx
server {
    listen 80;
    server_name taqdimot.okmk.uz; # yoki server_ip

    # 100MB gacha fayllarni qabul qilish uchun (STEP/GLB uchun)
    client_max_body_size 100M;

    root /var/www/gesture-presenter/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proksi
    location /api/ {
        proxy_pass http://127.0.0.1:5050/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Statik fayllar proksi
    location /files/ {
        proxy_pass http://127.0.0.1:5050/files/;
        proxy_set_header Host $host;
    }

    location /models/ {
        proxy_pass http://127.0.0.1:5050/models/;
        proxy_set_header Host $host;
    }
}
```

Faollashtiring va Nginxni qayta yuklang:
```bash
sudo ln -s /etc/nginx/sites-available/okmk-presenter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 3. HTTPS / SSL Sozlash (Let's Encrypt)
Kamera va WebRTC gesture kuzatuvi brauzerda to'g'ri ishlashi uchun HTTPS tavsiya etiladi (localhostdan tashqari tarmoqda):
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d taqdimot.okmk.uz
```

---

## 4. Tizim Imkoniyatlari Xulosasi
1. **Fayllar xotirasi**:
   - `public/pdf` — PDF taqdimotlar (va PPTX dan avtomatik konvertatsiya qilinganlar).
   - `public/glb` — 3D GLB modellar (va STEP/STP dan avtomatik konvertatsiya qilinganlar).
2. **Cheklovlar**:
   - PDF/PPTX: 50MB gacha.
   - STEP/GLB: 100MB gacha.
3. **Xavfsizlik**:
   - Fayllarni o'chirish faqat `.env` dagi `ROOT_PASSWORD` kiritilganda amalga oshiriladi.
