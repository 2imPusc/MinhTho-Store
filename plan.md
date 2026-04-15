# Kế hoạch phát triển MinhTho-Store

> Cập nhật: 2026-04-14

## Hiện trạng

**Đã xong:**
- Auth JWT (access + refresh token), phân quyền admin/user
- CRUD Products, Customers, Orders, Suppliers (API)
- Theo dõi công nợ & thanh toán (per-order và general)
- Dashboard cơ bản (hôm nay, doanh thu, công nợ)
- Phân trang client-side (20 items/page)
- Form validation với Joi (backend)

**Backend còn thiếu:** pagination server-side, error middleware chuẩn, tests, CORS siết, tồn kho, audit log.

**Frontend còn thiếu:** trang Supplier, báo cáo/biểu đồ, in hóa đơn, toast/notification, export Excel, auto-refresh token.

---

## Bugs cần sửa ngay

1. `server/routes/orderRoutes.js:8` — route `/customer/:customerId` xung đột với `/:id`, cần đặt trước route `/:id` hoặc đổi path.
2. `server/controllers/paymentController.js:112-147` — `getAllDebts` O(n²); thay bằng MongoDB aggregate pipeline.
3. `client/src/pages/Dashboard.jsx` — "recent orders" chưa sort `createdAt desc`, đang dùng `slice(0,10)` trên mảng chưa sort.
4. `client/src/contexts/AuthContext.jsx` — thiếu axios interceptor tự refresh access token khi hết hạn.
5. `client/src/pages/OrderCreate.jsx` — chưa chặn submit khi cart rỗng.
6. `client/src/components/ProductCard.jsx` — file rỗng, xóa hoặc triển khai.
7. `server/middlewares/validate.js:223-232` — schema `validateOrderCreate` dùng field `user`, controller dùng `customerId` → orphan.
8. CORS `origin: '*'` → siết theo `ALLOWED_ORIGINS` env.
9. HTTP status codes không đồng nhất.
10. Mix thông báo lỗi tiếng Việt & tiếng Anh → chuẩn hóa tiếng Việt.

---

## Phase 1 — Ổn định nền (ĐÃ LÀM 2026-04-14)

- [x] errorHandler + AppError + asyncHandler (`server/utils/`, `server/middlewares/errorHandler.js`)
- [x] Siết CORS theo `ALLOWED_ORIGINS` env
- [x] 404 handler + global error middleware
- [x] `getAllDebts` rewrite aggregate (bỏ O(n²))
- [x] `validateOrderCreate` fix schema orphan (`user` → `customerId`)
- [x] Axios interceptor auto-refresh token + toast lỗi (react-hot-toast)
- [x] Xóa `ProductCard.jsx` rỗng
- [x] Dashboard sort recentOrders tường minh
- [x] Refactor toàn bộ controllers sang `asyncHandler` + `AppError` (auth, product, customer, order, supplier, payment)
- [x] Chuẩn hóa error message tiếng Việt + HTTP status code đồng nhất
- [ ] ~~Chuẩn hóa response shape `{ success, data, message }` toàn cục~~ → hoãn, chỉ áp cho endpoint mới từ Phase 2 (tránh vỡ FE services hiện tại)
- [ ] **Cần chạy**: `cd client && npm install` (thêm `react-hot-toast`).

## Phase 2 — Hoàn thiện tính năng (3-5 ngày)

- [x] **Trang Supplier Management** (`SupplierManagement.jsx` + `SupplierForm.jsx` + tab AdminLayout) — 2026-04-14
- [x] **Server-side pagination**: helper `paginate` + opt-in `?page=&limit=&search=&sort=` cho products/customers/orders (backward-compatible: không có `page` → trả array cũ) — 2026-04-14
- [x] **Tồn kho**: `stockQty` + `lowStockThreshold` vào Product; decrement atomic khi tạo order (rollback nếu fail); restore khi xóa; badge cảnh báo ở bảng — 2026-04-14
- [x] **In hóa đơn** order: `InvoicePrint.jsx` + print CSS A4, nút "In" mỗi dòng trong OrderManagement — 2026-04-14
- [x] **Upload ảnh sản phẩm**: Multer local `server/uploads/` (5MB, jpg/png/webp/gif), static serve `/uploads`, file input trong ProductForm — 2026-04-14

## Phase 3 — Báo cáo & UX (3-4 ngày)

- [x] Dashboard nâng cao với Recharts: doanh thu 7/30/90 ngày (LineChart), top 5 sản phẩm + top 5 khách nợ (BarChart ngang) — 2026-04-14. **Cần `cd client && npm install`** để lấy recharts.
- [x] Lọc theo khoảng ngày cho orders & payments — BE `GET /orders?from=&to=`; FE OrderManagement + CustomerDebt có 2 date input, CustomerDebt recompute totals theo khoảng — 2026-04-14
- [x] Export Excel (`xlsx` client-side) — nút "Xuất Excel" trong Products/Customers/Orders/Payments, export theo data đã lọc — 2026-04-14
- [x] Trang quản lý Payments riêng — `/admin/payments`, filter method/loại/ngày/khách — 2026-04-14
- [x] Bulk operations — checkbox chọn nhiều + action bar. Orders có bulk delete (restore tồn kho) + bulk mark-paid. Products/Customers có bulk delete. BE endpoints `POST /<resource>/bulk-delete { ids }` + `POST /orders/bulk-mark-paid` — 2026-04-14

## Phase 4 — Chất lượng & vận hành (2-3 ngày)

- [ ] Seed script (`server/scripts/seed.js`)
- [ ] Unit test backend (Jest + Supertest): auth, order, payment
- [ ] Swagger docs đầy đủ
- [ ] Docker compose cho client + mongo
- [ ] CI GitHub Actions (lint + test)

---

## Backlog

- Quản lý User (đổi role qua UI)
- Notification real-time (Socket.io)
- Email/SMS nhắc công nợ
- Soft delete + audit log
- Full-text search (MongoDB text index)
- Đa ngôn ngữ (i18n)

---

## Phase 5 — PWA + Offline-first + Remote access (tối ưu chi phí)

> Mục tiêu: truy cập được từ PC quầy (LAN) và điện thoại (LAN + 4G ngoài cửa hàng), hoạt động offline cho thao tác đọc + ghi, chi phí tiệm cận 0đ. Kiến trúc: PWA + IndexedDB queue + MongoDB local + Cloudflare Tunnel.

### Phase 5A — PWA cơ bản (ĐÃ LÀM 2026-04-14)

**Mục tiêu**: Cài được lên home screen điện thoại, đọc offline các trang đã cache.

- [x] `vite-plugin-pwa` + `@vite-pwa/assets-generator` thêm vào `client/package.json` (devDeps). **Cần `cd client && npm install`**.
- [x] `client/vite.config.js` cấu hình `VitePWA` với manifest tiếng Việt, theme `#1e40af`, display standalone, workbox runtime caching (products/customers/supplier: StaleWhileRevalidate 1h; orders/payments: NetworkFirst 10ph; uploads: CacheFirst 30 ngày).
- [x] `client/index.html` cập nhật title "MinhTho Store", theme-color, apple-mobile-web-app-* meta, favicon.svg.
- [x] `client/public/favicon.svg` — logo placeholder "MT" nền xanh.
- [x] `client/pwa-assets.config.js` — preset `minimal2023` sinh icons từ favicon.svg. Chạy `npm run generate-pwa-assets` để tạo `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png` trong `public/`.
- [x] `client/src/components/pwa/PWAStatus.jsx` — offline badge (amber pill trên cùng), install button (bottom-left khi `beforeinstallprompt` fire), update prompt (bottom-right khi SW có bản mới), toast online/offline.
- [x] `main.jsx` mount `<PWAStatus />` global.

**Pitfall đã xử lý**:
- `navigateFallbackDenylist`: `/^\/api/` và `/^\/uploads/` để SW không chặn request API/static upload.
- `devOptions.enabled: false` — SW chỉ active ở build production, tránh cache confusion khi dev.

**Hướng dẫn chạy**:
1. `cd client && npm install` (lấy deps mới)
2. `npm run generate-pwa-assets` (tạo icons PNG 1 lần, commit vào public/)
3. `npm run build && npm run preview` → mở `localhost:4173` → DevTools/Application kiểm PWA
4. Mobile Chrome: menu "Add to Home Screen"; Desktop Chrome: icon install ở URL bar

### Phase 5B — Offline queue + sync (ĐÃ LÀM 2026-04-14)

- [x] `dexie@^4` thêm vào `client/package.json`. **Cần `cd client && npm install`**.
- [x] `client/src/offline/db.js` — Dexie DB `minhtho-offline` với 4 table: `pendingMutations` (++id, clientId, status, createdAt), `cacheOrders`, `cacheProducts`, `cacheCustomers`.
- [x] `client/src/offline/queue.js` — whitelist chỉ queue `POST /orders`, `POST /orders/:id/payments`, `POST /payments` (ghi an toàn, idempotent); `enqueue()` tự sinh `clientId` qua `crypto.randomUUID()`; `flush()` FIFO, 4xx→mark failed, 5xx/network→giữ pending; auto flush khi `online` event + mỗi 30s + lúc khởi động; pub/sub cho UI.
- [x] `services/api.js` interceptor: network error + `isQueueable(config)` → `enqueue` + trả fake 202 response `{ queued: true, clientId }` (optimistic UI không vỡ). Export `flushOfflineQueue`.
- [x] `components/pwa/PWAStatus.jsx` subscribe queue count, hiển thị "Đang đồng bộ N thao tác" khi online có pending, click để force flush; badge offline kèm số pending.
- [x] BE idempotent: `Order` + `Payment` models thêm field `clientId` với unique sparse index. `orderController.createOrder` + `paymentController.createPayment` check `clientId` đầu hàm, nếu tồn tại → return 200 với record cũ. `validateOrderCreate` accept `clientId` optional.

**Pitfall đã xử lý**:
- Không queue DELETE/PUT để tránh conflict (nếu đã xóa server-side rồi replay → lỗi khó giải). Chỉ cho phép tạo mới.
- 401 khi replay: dùng `transformRequest` lấy token mới nhất từ localStorage mỗi lần gửi (tránh token hết hạn lúc queue).
- Stock decrement khi offline: BE vẫn check `stockQty >= qty`, nếu fail lúc sync → mutation mark `FAILED` + toast cho user. Không thể tránh hoàn toàn vì không có tồn kho thật khi offline.

**Hướng dẫn test**:
1. DevTools → Network → Offline
2. Tạo đơn hàng → thấy toast "đã lưu vào hàng đợi"
3. Bật lại mạng → badge "Đang đồng bộ..." xuất hiện rồi biến mất; kiểm tra DB có đơn mới
4. Tạo lại đơn cùng `clientId` → BE trả 200 dedup (thủ công bằng Postman)

### Phase 5C — VPS + Nginx + HTTPS + PM2 (ĐÃ CHUẨN BỊ 2026-04-14)

Chạy trên **Ubuntu 22.04 LTS** (VPS 2GB RAM/20GB SSD là đủ). Files trong `deploy/`:

- [x] `deploy/setup-vps.sh` — cài Node 20, MongoDB 7, Nginx, Certbot, rclone, PM2, UFW firewall (22/80/443). Chạy 1 lần sau khi SSH vào VPS.
- [x] `deploy/nginx.conf` — reverse proxy `:5000` (Node serve cả FE+BE qua `SERVE_CLIENT=true`), cache static assets 7d, `/sw.js` no-cache.
- [x] `deploy/ecosystem.config.cjs` — PM2 config fork mode, `max_memory_restart: 500M`, auto-restart, logs vào `/var/log/pm2/`.

**Quy trình deploy lần đầu**:
1. `bash deploy/setup-vps.sh` (trên VPS, user có sudo)
2. `git clone <repo> /opt/minhtho`
3. `cd /opt/minhtho/server && npm ci --omit=dev`
4. `cd /opt/minhtho/client && npm ci && npm run build`
5. Tạo `/opt/minhtho/server/.env` (copy từ `.env.example`, set `MONGO_URI=mongodb://127.0.0.1:27017/minhtho`, JWT keys, `ALLOWED_ORIGINS=https://store.yourdomain.com`)
6. `pm2 start /opt/minhtho/deploy/ecosystem.config.cjs && pm2 save && pm2 startup`
7. `sudo cp deploy/nginx.conf /etc/nginx/sites-available/minhtho && sudo ln -s /etc/nginx/sites-available/minhtho /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx`
8. `sudo certbot --nginx -d store.yourdomain.com` (HTTPS tự động)

### Phase 5D — Backup tự động (ĐÃ CHUẨN BỊ 2026-04-14)

- [x] `deploy/backup.sh` — `mongodump --gzip --archive` → upload `rclone` lên Google Drive / Cloudflare R2. Giữ 7 ngày local, 30 ngày cloud. Env: `RCLONE_REMOTE`, `BACKUP_DIR`, `MONGO_URI`.
- [x] `deploy/restore.sh` — restore từ archive local hoặc remote (`rclone copy` trước). Có confirm prompt.
- [x] `deploy/install-backup-cron.sh` — cron 2h sáng mỗi ngày, log `/var/log/minhtho-backup.log`.

**Setup rclone 1 lần**:
```bash
rclone config   # chọn Google Drive → tạo remote tên "gdrive"
rclone mkdir gdrive:minhtho-backups
export RCLONE_REMOTE="gdrive:minhtho-backups"
bash deploy/install-backup-cron.sh
bash deploy/backup.sh   # test ngay
```

### Phase 5A' — Triển khai hosting (cũ, đã gộp vào 5C)

- [ ] `cd client && npm i -D vite-plugin-pwa`
- [ ] Cấu hình `vite.config.js`: plugin `VitePWA({ registerType: 'autoUpdate', workbox: {...} })`
- [ ] Tạo `client/public/manifest.webmanifest` (name "MinhTho Store", theme_color, icons 192/512)
- [ ] Tạo icons: `client/public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` (dùng logo hiện có hoặc tạo placeholder)
- [ ] Workbox runtime caching rules:
  - `/api/products`, `/api/customers`, `/api/suppliers` → `StaleWhileRevalidate`, TTL 1h
  - `/api/orders`, `/api/payments` → `NetworkFirst`, fallback cache
  - `/uploads/*` (ảnh sản phẩm) → `CacheFirst`, maxEntries 200
  - Static assets → precache mặc định
- [ ] Thêm component `<InstallPWAButton />` + `<OfflineBadge />` (dùng `navigator.onLine` + `online`/`offline` event)
- [ ] Test: Chrome DevTools → Application → Service Workers, offline mode vẫn load trang

**Deliverables**: `dist/` build ra có SW + manifest, Lighthouse PWA score ≥ 90.

### Phase 5B — Offline queue cho mutations (2 ngày)

**Mục tiêu**: Tạo đơn hàng / thanh toán khi mất mạng, tự sync khi online.

- [ ] `cd client && npm i dexie`
- [ ] Tạo `client/src/offline/db.js` — Dexie schema:
  - Table `pendingMutations`: `{id, method, url, body, createdAt, retries, status}`
  - Table `cacheProducts`, `cacheCustomers`, `cacheOrders` (mirror last-known server state)
- [ ] `client/src/offline/queue.js`:
  - `enqueue(mutation)` — push vào pendingMutations
  - `flush()` — replay theo thứ tự FIFO, xóa khi thành công, tăng `retries` khi fail
  - Gọi `flush()` khi event `online` + mỗi 30s khi online
- [ ] Sửa `services/api.js` response interceptor:
  - Nếu request POST/PUT/DELETE + `!navigator.onLine` + `error.code === 'ERR_NETWORK'` → enqueue + trả về optimistic response
  - GET khi offline → đọc từ Dexie cache
- [ ] Conflict resolution: server thêm field `updatedAt` (đã có), client gửi `If-Unmodified-Since` hoặc `clientUpdatedAt`; server từ chối nếu server version mới hơn → UI báo "Đơn đã bị sửa bởi thiết bị khác, reload"
- [ ] UI component `<SyncStatusBadge />`:
  - Hiển thị: "🟢 Online" | "🟡 Offline — N thao tác chờ" | "🔴 Sync lỗi"
  - Click → mở modal xem queue + nút retry/xóa
- [ ] Giới hạn offline: chỉ enable cho Order create + Payment create (nghiệp vụ quầy chính); Product/Customer CRUD yêu cầu online (ít dùng lúc mất mạng)

**Pitfall cần lưu ý**:
- ID đơn offline: dùng `crypto.randomUUID()` ở client, BE accept `clientId` field, map sang `_id` khi sync
- Stock decrement: không check được tồn kho khi offline → chấp nhận oversell, khi sync nếu fail → đánh dấu đơn `status: 'sync_failed'` cho user xử lý tay
- Không offline delete (tránh xóa nhầm không undo được)

**Deliverables**: Tạo được đơn hàng khi tắt wifi, bật lại → đơn lên server trong 30s.

### Phase 5C — Remote access qua Cloudflare Tunnel (ĐÃ LÀM CODE 2026-04-14, chờ setup tunnel)

**Code đã làm:**

- [x] `server/app.js`: `trust proxy 1` + block `SERVE_CLIENT=true` serve `client/dist` với SPA fallback regex `^/(?!api|uploads).*` — 1 origin cho cả FE+BE.
- [x] `server/.env.example` thêm `SERVE_CLIENT=false` (mặc định off, dev không đụng).
- [x] `client/src/services/api.js`: detect `IS_PROD_ORIGIN` (port ≠ 5173/4173) → dùng `/api` same-origin, bỏ qua LAN/cloud detection.
- [x] `DEPLOY.md` — hướng dẫn đầy đủ: build, PM2 service, cloudflared install + tunnel + DNS + config.yml + service install, security checklist, troubleshooting.

**Còn lại (user tự làm trên PC cửa hàng):**

- [ ] Đăng ký Cloudflare + domain (`.id.vn` free hoặc `.xyz` 30k/năm)
- [ ] Cài `cloudflared.exe`, login, create tunnel, route DNS
- [ ] Tạo `config.yml` trỏ hostname → `localhost:5000`
- [ ] `cloudflared service install` + `pm2-windows-startup` cho Node
- [ ] Test từ 4G điện thoại

### ~~Phase 5C — Remote access qua Cloudflare Tunnel (0.5 ngày)~~ cũ

**Mục tiêu**: Điện thoại ở ngoài cửa hàng (4G) truy cập được server LAN.

- [ ] Đăng ký Cloudflare account (free), add domain (mua `.id.vn`/`.io.vn` free hoặc `.xyz` ~30k/năm)
- [ ] Cài `cloudflared` trên PC cửa hàng (Windows service):
  ```
  cloudflared tunnel login
  cloudflared tunnel create minhtho-store
  cloudflared tunnel route dns minhtho-store store.domain.xyz
  ```
- [ ] File `~/.cloudflared/config.yml`:
  ```yaml
  tunnel: <tunnel-id>
  credentials-file: ...
  ingress:
    - hostname: store.domain.xyz
      service: http://localhost:5000
    - service: http_status:404
  ```
- [ ] Cài thành Windows service: `cloudflared service install`
- [ ] BE `server.js`: serve static `client/dist` khi `NODE_ENV=production` → 1 tunnel cho cả FE+BE
- [ ] Sửa `ALLOWED_ORIGINS` env thêm domain tunnel
- [ ] Test: tắt wifi điện thoại, dùng 4G truy cập `https://store.domain.xyz`

**Ưu điểm**: HTTPS tự động, không cần mở port router, không cần IP tĩnh, free.

**Deliverables**: URL public, truy cập từ 4G ổn định.

### Phase 5D — Backup tự động (0.5 ngày)

**Mục tiêu**: Chống mất data nếu PC cửa hàng hỏng.

- [ ] Script `server/scripts/backup.js`:
  - `mongodump --uri=$MONGO_URI --archive=backup-$(date).gz --gzip`
  - Upload lên Cloudflare R2 (free 10GB) hoặc Google Drive API
  - Xóa backup cũ > 7 ngày
- [ ] Windows Task Scheduler: chạy `node backup.js` mỗi đêm 2h sáng
- [ ] Test restore: `mongorestore --archive=backup.gz --gzip --drop`

**Deliverables**: Thư mục R2/Drive có 7 file `.gz` xoay vòng.

### Phase 5E — Tối ưu mobile UX (1 ngày)

**Mục tiêu**: Dùng êm trên màn hình nhỏ.

- [ ] Audit các trang Admin với viewport 375px:
  - Bảng → chuyển sang card view trên `sm:hidden`
  - Filter bar → collapse trong `<details>` hoặc bottom sheet
  - Action buttons → sticky bottom bar trên mobile
- [ ] Tăng touch target ≥ 44px (nút xóa, checkbox)
- [ ] Input `type="tel"`, `inputMode="numeric"` cho SĐT/số tiền → bật numpad native
- [ ] Test trên Chrome DevTools device mode + điện thoại thật

**Deliverables**: Lighthouse Mobile score ≥ 85.

### Tổng chi phí Phase 5

| Hạng mục | Chi phí |
|---|---|
| Cloudflare Tunnel | 0đ |
| Cloudflare R2 (backup) | 0đ (10GB free) |
| Domain `.id.vn` | 0đ (hoặc `.xyz` ~30k/năm) |
| MongoDB (local) | 0đ |
| Hosting | 0đ (self-host PC cửa hàng) |
| **Tổng** | **0 – 30k/năm** |

### Thứ tự thực hiện đề xuất

1. **5A (PWA)** — value cao nhất / effort thấp nhất, deploy ngay cho mobile dùng.
2. **5C (Tunnel)** — unlock remote access, test ngay nhu cầu thực.
3. **5D (Backup)** — an toàn data trước khi đi xa hơn.
4. **5E (Mobile UX)** — sau khi có feedback thực tế từ điện thoại.
5. **5B (Offline queue)** — phức tạp nhất, chỉ làm khi xác nhận có nhu cầu ghi offline thực sự (có thể skip nếu mạng cửa hàng ổn).

### Rủi ro & Mitigation

- **PC cửa hàng tắt/restart** → cài BE + MongoDB + cloudflared thành Windows service, auto-start.
- **Mất điện** → PWA cache vẫn cho xem tồn kho / giá; UPS mini ~500k cho PC + router nếu cần 24/7.
- **Nhiều thiết bị ghi đồng thời** → last-write-wins + `updatedAt` check; conflict hiếm vì cửa hàng nhỏ.
- **IndexedDB đầy** (quota ~50MB-500MB) → chỉ cache N records gần nhất, cleanup định kỳ.
