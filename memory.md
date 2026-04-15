# Memory — MinhTho-Store

> Ghi chú các thông tin quan trọng, thay đổi cấu trúc, workflow, quyết định kiến trúc để Claude và team có ngữ cảnh khi tiếp tục công việc. Cập nhật mỗi khi có thay đổi đáng kể.
>
> Cập nhật lần cuối: 2026-04-14

---

## 1. Quyết định kiến trúc (Architecture Decisions)

- **JWT dual-token**: access token 1 ngày + refresh token 30 ngày. Refresh token lưu trong User model (field `refreshToken`).
- **Snapshot giá sản phẩm trong Order**: `Order.items[].price` là giá tại thời điểm tạo order, không join Product runtime → lịch sử order không bị ảnh hưởng khi đổi giá.
- **Công nợ 2 chiều**: Payment có thể gắn với `order` cụ thể hoặc là thanh toán chung cho khách (`order = null`). Xem `paymentController.js`.
- **Dual API endpoint detection** (`client/src/services/api.js`): ưu tiên LAN `192.168.1.100:5000`, fallback `localhost:5000`. Sửa tại đây nếu đổi IP.
- **Phân quyền**: chỉ 2 role `admin` / `user`. User chỉ đọc public routes.
- **Customer type enum**: `'le'` (lẻ) hoặc `'cong_trinh'` (công trình) — dùng nguyên tiếng Việt không đổi.

## 2. Workflow phát triển

- Backend: `cd server && npm start` (nodemon)
- Frontend: `cd client && npm run dev`
- Env backend bắt buộc: `MONGO_URI`, `JWT_ACCESS_KEY`, `JWT_REFRESH_KEY`, `PORT`. Tùy chọn: `ALLOWED_ORIGINS` (CSV), `NODE_ENV`. **Lưu ý**: code dùng `JWT_ACCESS_KEY/JWT_REFRESH_KEY`, không phải `JWT_SECRET` như CLAUDE.md ghi.
- Commit convention (theo git log): prefix `FE:` / `BE:` + mô tả ngắn
- Main branch: `main`. Hiện chưa có CI.

## 3. Thay đổi cấu trúc đã làm

- **Phase 5B/5C/5D — Offline sync + VPS + Backup (2026-04-14)**:
  - **Idempotent BE**: `Order` và `Payment` models thêm `clientId` (String, unique sparse index). `createOrder`/`createPayment` check đầu hàm → trả record cũ nếu `clientId` trùng. `validateOrderCreate` accept `clientId` optional. **Quan trọng**: khi thêm endpoint POST mới cho phép offline → phải thêm `clientId` theo pattern này, nếu không replay queue sẽ tạo duplicate.
  - **Offline queue FE** (`client/src/offline/`): Dexie DB `minhtho-offline` table `pendingMutations`. Whitelist chỉ queue 3 endpoint: `POST /orders`, `POST /orders/:id/payments`, `POST /payments`. KHÔNG queue PUT/DELETE (tránh conflict). `api.js` interceptor bắt network error → enqueue + trả fake 202 optimistic. Auto flush: event `online` + interval 30s + khởi động app. 4xx không-401 → mark FAILED; 5xx/network → giữ PENDING retry sau. Token luôn lấy mới nhất từ localStorage lúc replay (tránh 401).
  - **Deploy trên VPS** (thay thế self-host PC): `deploy/` có `setup-vps.sh` (Ubuntu 22.04 — cài Node 20, MongoDB 7, Nginx, Certbot, PM2, rclone, UFW), `nginx.conf` (proxy `:5000`, cache static 7d, sw.js no-cache), `ecosystem.config.cjs` (PM2 fork, 500M memory restart). Node serve cả FE (qua `SERVE_CLIENT=true`) và API — 1 origin, không CORS issue.
  - **Backup**: `deploy/backup.sh` `mongodump --gzip --archive` → rclone upload (Google Drive free 15GB hoặc Cloudflare R2 10GB). Giữ 7 ngày local + 30 ngày cloud. Cron 2h sáng qua `install-backup-cron.sh`. Restore qua `restore.sh` (có confirm).
  - **Quyết định kiến trúc**: chuyển từ self-host PC + Cloudflare Tunnel sang **VPS 2GB (Tinohost/Vietnix ~70-80k/tháng hoặc Oracle Free)**. Lý do: uptime 99.9%, không phụ thuộc phần cứng cửa hàng, HTTPS thật qua Let's Encrypt, khách truy cập 24/7 từ 4G. PWA offline cache + queue xử lý trường hợp mạng cửa hàng mất.

- **Phase 5A — PWA (2026-04-14)**:
  - `vite-plugin-pwa` + `@vite-pwa/assets-generator` ở `client/` (devDeps). `vite.config.js` cấu hình manifest standalone, theme `#1e40af`, lang vi; workbox runtime caching: `/api/products|customers|supplier` StaleWhileRevalidate 1h, `/api/orders|payments` NetworkFirst 10ph timeout 5s, `/uploads/*` CacheFirst 30 ngày. `navigateFallbackDenylist` loại `/api` và `/uploads` — **không bỏ, nếu không SW sẽ chặn API khi offline trả HTML**.
  - Icons sinh từ `public/favicon.svg` qua `npm run generate-pwa-assets` (preset minimal-2023): `pwa-64/192/512`, `maskable-icon-512`, `apple-touch-icon-180`. Commit các PNG này vào `public/`.
  - `src/components/pwa/PWAStatus.jsx` mount global trong `main.jsx`: offline badge, install button (`beforeinstallprompt`), update prompt (dùng `useRegisterSW` từ `virtual:pwa-register/react`).
  - `devOptions.enabled: false` — SW chỉ active khi build prod, tránh cache stale lúc dev.

- **Phase 3 bắt đầu (2026-04-14)**:
  - **Bulk operations**: Checkbox cột đầu + action bar hiện khi `selectedIds.size > 0`. BE endpoints: `POST /orders/bulk-delete` (restore stockQty cho mỗi item), `POST /orders/bulk-mark-paid` (skip đơn đã đủ), `POST /products/bulk-delete`, `POST /customers/bulk-delete`. Tất cả nhận `{ ids: [] }`. FE có "select all trang hiện tại" qua checkbox header. Pattern dùng lại `Set` state trên 3 page.
  - **Payment Management page** (`/admin/payments`): list toàn bộ thanh toán, filter search (tên/SĐT) + phương thức + loại (theo đơn/công nợ chung) + khoảng ngày. BE thêm `GET /api/payments` (opt-in paginate, filter `customerId`, `method`, `from`, `to`). Nút xóa giữ nguyên logic cũ (trừ paidAmount của order nếu có).
  - **Export Excel**: `client/src/utils/exportExcel.js` dùng `xlsx` (SheetJS). Export client-side từ `filtered` array hiện tại của page (không gọi BE lại). Đã thêm nút "Xuất Excel" vào Products/Customers/Orders/Payments. Filename format `<tên>-<YYYY-MM-DD>.xlsx`. **Cần `cd client && npm install`** để lấy `xlsx`.
  - **Date range filter**: BE `getAllOrders` nhận `?from=&to=` (ISO date) → thêm vào `filter.createdAt` ($gte/$lte). `to` tự set 23:59:59 để bao trùm cả ngày. FE OrderManagement có 2 date input (client-side filter vì vẫn dùng full-load). CustomerDebt có 2 date input **và recompute totalOrdered/totalPaid/totalDebt theo khoảng đã lọc** — banner "Đang lọc" hiển thị khi active.
  - **Dashboard Recharts**: `client/src/pages/Dashboard.jsx` rewrite. Thêm selector 7/30/90 ngày; LineChart doanh thu + đã thu theo ngày; 2 BarChart ngang (top 5 sản phẩm theo revenue + top 5 khách nợ). Tính toán client-side từ `orders.items[]` (snapshot price). `client/package.json` thêm `recharts ^2.15.0` — **cần `cd client && npm install`**.

- **Phase 2 hoàn thành (2026-04-14)**:
  - **Server-side pagination**: `server/utils/paginate.js` (helper `paginate(model, {...})` + `buildSearchFilter`). Áp vào `GET /products`, `/customers`, `/orders` theo dạng **opt-in**: có `?page` hoặc `?limit` → trả `{data, total, page, limit, totalPages}`; không có → trả array như cũ (tránh vỡ FE). Hỗ trợ `?search=` (regex trên các field text) + filter (`category`, `type`, `status`). Services FE đã nhận `params` nhưng các page Management hiện vẫn gọi `getAll()` không tham số (client-side pagination 20/page). Khi dataset lớn mới cần migrate.
  - **Upload ảnh**: `server/middlewares/upload.js` (Multer disk, limit 5MB, filter jpg/jpeg/png/webp/gif). `server/uploads/` static serve tại `/uploads/:filename`. Route `POST /api/products/upload` (admin, field `image`) → trả `{url, filename}`. FE: `productService.uploadImage(file)` + file input trong `ProductForm` có preview, trả URL về field `imageUrl`. **Cần `npm install` trong `server/`** để lấy multer.
  - **In hóa đơn A4**: component `InvoicePrint.jsx` dùng print CSS `@media print` + `body *{visibility:hidden}` trick để chỉ in phần invoice. Nút "In" trong mỗi dòng `OrderManagement`.

- **Phase 2 — Supplier UI + Tồn kho (2026-04-14)**:
  - FE: thêm `supplierService`, `SupplierForm.jsx`, `SupplierManagement.jsx`, route `/admin/suppliers`, tab "Nhà cung cấp" trong `AdminLayout`.
  - **Tồn kho**: Product thêm field `stockQty` (default 0) và `lowStockThreshold` (default 10). `orderController.createOrder` decrement atomic bằng `findOneAndUpdate` với condition `stockQty >= qty`; nếu fail ở item thứ N, rollback các item đã decrement trước đó. `deleteOrder` restore tồn kho. Pitfall: **không có transaction MongoDB** — rollback là best-effort trong code, chấp nhận rủi ro ở single-node Mongo. Nếu sau này scale lên replica set, nên bọc bằng session/transaction.
  - UI hiển thị badge tồn kho: đỏ (≤0), amber (≤threshold), xanh (>threshold) ở bảng `ProductManagement`.

- **Phase 1 tiếp (2026-04-14)**:
  - Refactor toàn bộ controllers (auth, product, customer, order, supplier, payment) sang dùng `asyncHandler` + `throw new AppError(msg, status)` thay cho try/catch + `res.status().json()`.
  - **Quyết định**: giữ nguyên shape response cũ (không bọc vào `{success, data, message}` toàn cục) để tránh vỡ hàng loạt frontend services. Khi thêm endpoint mới từ Phase 2, mới áp shape chuẩn.
  - Chuẩn hóa error message sang tiếng Việt có dấu, HTTP status code đồng nhất (404 not-found, 400 validation/business rule, 403 auth).
- **Phase 1 (2026-04-14)**:
  - Thêm `server/utils/AppError.js`, `server/utils/asyncHandler.js`, `server/middlewares/errorHandler.js`.
  - `server.js` siết CORS theo env `ALLOWED_ORIGINS`; 404 + errorHandler cuối pipeline.
  - `paymentController.getAllDebts` rewrite sang MongoDB aggregate (thay vòng lặp O(n²)).
  - `validate.js → validateOrderCreate` đổi schema `user` → `customerId` cho khớp controller.
  - FE: `services/api.js` thêm response interceptor tự refresh access token khi 401 + toast lỗi (react-hot-toast). Có hàng đợi request khi refresh đang chạy. Khi refresh fail → force logout về `/login`.
  - FE: `main.jsx` wrap `<Toaster>` global. `package.json` thêm `react-hot-toast` — **cần chạy `npm install` trong `client/`**.
  - Xóa file rỗng `client/src/components/ProductCard.jsx`.
- (`b026dff`) Pagination client-side (20 items/page) cho Products/Customers/Orders.
- (`9a00f7c`) Backend core routes xong.
- (`cea3ded`) FE auth flow xong.

## 4. Quy ước code

- Ngôn ngữ UI & error message: **tiếng Việt**. Tránh mix tiếng Anh trong message trả về user.
- Validation: Joi schema trong `server/middlewares/validate.js`, áp qua `validateRequest` wrapper.
- Response format (đang inconsistent, cần chuẩn hóa ở Phase 1): hướng tới `{ success: bool, data, message }`.
- Tên tiếng Việt không dấu cho enum (ví dụ `Tien mat`, `le`, `cong_trinh`).

## 5. Pitfall / lưu ý quan trọng

- **Route Express thứ tự quan trọng**: `/customer/:customerId` phải đặt TRƯỚC `/:id` trong cùng file route, nếu không Express match nhầm.
- **Snapshot price**: khi sửa Product, order cũ vẫn giữ giá cũ. Đừng "fix" bằng cách join runtime.
- **Delete Supplier** bị chặn nếu còn Product link → phải gỡ/đổi supplier trước.
- **Delete Order** hiện không restore tồn kho (vì chưa có tồn kho). Khi thêm stockQty ở Phase 2, nhớ cộng lại khi xóa.
- CORS đang mở `*` → production phải siết.

## 6. Khi nào cần cập nhật file này

Cập nhật `memory.md` mỗi khi:
- Thêm/đổi/xóa model hoặc field
- Thêm route/endpoint mới
- Đổi workflow chạy dev/build/deploy
- Đổi biến môi trường bắt buộc
- Ra quyết định kiến trúc (chọn thư viện, pattern, cấu trúc thư mục)
- Gặp pitfall / bug non-obvious mà người sau dễ đạp lại
- Đổi quy ước code, commit, branch

Không ghi vào đây:
- TODO ngắn hạn (dùng `plan.md`)
- Chi tiết đã có trong `CLAUDE.md` (khỏi lặp)
- Thay đổi code nhỏ có thể thấy qua `git log`
