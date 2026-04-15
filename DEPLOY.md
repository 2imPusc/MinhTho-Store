# Hướng dẫn triển khai MinhTho Store

## Kiến trúc production

```
Internet → Cloudflare Tunnel → PC cửa hàng (Windows)
                                ├─ Node.js (server/app.js) :5000
                                │   ├─ Serve /api/*
                                │   ├─ Serve /uploads/*
                                │   └─ Serve client/dist/* (SPA)
                                └─ MongoDB local :27017
```

Toàn bộ FE + BE chạy trên 1 process Node, 1 origin, 1 tunnel → đơn giản CORS, không cần domain riêng cho API.

---

## Bước 1 — Build production trên PC cửa hàng

```bash
# FE build
cd client
npm install
npm run generate-pwa-assets    # 1 lần, tạo icons PWA
npm run build                  # → client/dist/

# BE
cd ../server
npm install
```

Cập nhật `server/.env`:

```
MONGO_URI=mongodb://localhost:27017/minhtho-store
JWT_ACCESS_KEY=<random-long-string>
JWT_REFRESH_KEY=<random-long-string-2>
PORT=5000
NODE_ENV=production
SERVE_CLIENT=true
ALLOWED_ORIGINS=https://store.your-domain.xyz
```

Test local: `cd server && npm start` → mở `http://localhost:5000` thấy FE.

---

## Bước 2 — Chạy Node thành Windows service

Dùng `node-windows` hoặc `pm2-windows-service` để auto-start khi PC bật.

**Cách 1: PM2 (khuyên dùng)**

```bash
npm install -g pm2 pm2-windows-startup
cd server
pm2 start server.js --name minhtho-store
pm2 save
pm2-startup install
```

Kiểm tra: restart PC → `pm2 list` vẫn thấy app chạy.

---

## Bước 3 — Cài Cloudflare Tunnel

### 3.1 Đăng ký & chuẩn bị domain

1. Đăng ký Cloudflare account free tại `cloudflare.com`.
2. Mua domain hoặc dùng miễn phí:
   - `.id.vn` / `.io.vn` (free tại Tenten/iNet)
   - `.xyz` (~30k/năm)
3. Add domain vào Cloudflare → đổi nameserver theo hướng dẫn → đợi active (~5-30 phút).

### 3.2 Cài cloudflared

Tải `cloudflared-windows-amd64.exe` tại https://github.com/cloudflare/cloudflared/releases → đổi tên `cloudflared.exe` → đặt vào `C:\Cloudflared\`.

Thêm vào PATH hoặc chạy trực tiếp.

### 3.3 Tạo tunnel

```bash
cd C:\Cloudflared
cloudflared tunnel login
# → mở browser, đăng nhập CF, chọn domain → auto lưu cert

cloudflared tunnel create minhtho-store
# → in ra <TUNNEL_ID>, lưu lại

cloudflared tunnel route dns minhtho-store store.your-domain.xyz
```

Tạo file `C:\Users\<you>\.cloudflared\config.yml`:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<you>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: store.your-domain.xyz
    service: http://localhost:5000
  - service: http_status:404
```

### 3.4 Chạy thử

```bash
cloudflared tunnel run minhtho-store
```

Mở `https://store.your-domain.xyz` trên điện thoại 4G → phải thấy app.

### 3.5 Cài thành Windows service

```bash
cloudflared service install
```

Kiểm tra: `services.msc` → thấy "Cloudflared" đang Running.

---

## Bước 4 — Security checklist

- [ ] Đổi password admin mặc định trong MongoDB
- [ ] `JWT_ACCESS_KEY` / `JWT_REFRESH_KEY` random ≥ 32 ký tự, không commit
- [ ] `ALLOWED_ORIGINS` chỉ có domain production, KHÔNG để trống
- [ ] Cloudflare dashboard → SSL/TLS → chọn "Full" hoặc "Full (strict)"
- [ ] (Tuỳ chọn) Cloudflare Access → bật Google SSO cho `store.your-domain.xyz` → chỉ email whitelist mới vào được

---

## Bước 5 — Cập nhật ứng dụng sau này

```bash
cd d:\2impusc\MinhTho-Store
git pull
cd client && npm install && npm run build
cd ../server && npm install
pm2 restart minhtho-store
```

PWA sẽ tự thông báo "Đã có phiên bản mới" cho user (nhờ `registerType: 'autoUpdate'` + prompt trong `PWAStatus.jsx`).

---

## Troubleshooting

| Triệu chứng | Nguyên nhân | Cách fix |
|---|---|---|
| 502 Bad Gateway qua tunnel | Node chưa chạy | `pm2 list`, `pm2 start minhtho-store` |
| FE load nhưng API 404 | `SERVE_CLIENT=true` nhưng route fallback đè `/api` | Kiểm regex trong `app.js` — đã loại `api|uploads` |
| PWA không hiện nút Install | Chưa HTTPS hoặc manifest lỗi | Chỉ hoạt động trên `https://` (hoặc `localhost`) |
| Mobile cache cũ sau deploy | SW giữ bản cũ | User bấm "Cập nhật" trong prompt, hoặc xoá app + cài lại |
| CORS error từ domain mới | Thiếu trong `ALLOWED_ORIGINS` | Thêm vào `.env` + `pm2 restart` |
