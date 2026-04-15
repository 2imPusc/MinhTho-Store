# MinhTho-Store

Ứng dụng quản lý cửa hàng vật liệu xây dựng — fullstack React + Express + MongoDB.

## Kiến trúc

- **Frontend**: `client/` — React 19, Vite, TailwindCSS 4, React Router 7, Axios
- **Backend**: `server/` — Node.js, Express 5, Mongoose 8, JWT, Joi, Swagger
- **Database**: MongoDB (kết nối qua `MONGO_URI` trong `server/.env`)

## Lệnh thường dùng

```bash
# Backend
cd server && npm start          # nodemon auto-reload

# Frontend
cd client && npm run dev        # Vite dev server
cd client && npm run build      # Build production
cd client && npm run lint       # ESLint
```

## Cấu trúc thư mục

```
client/src/
  pages/          # Các trang: HomePage, LoginPage, Dashboard, ProductManagement, CustomerManagement, OrderManagement, CustomerDebt...
  components/     # Auth, layouts (Header, AdminLayout), ProductCard, ProductForm, CustomerForm
  contexts/       # AuthContext — trạng thái xác thực toàn cục
  services/       # api.js (Axios instance) + authService, productService, customerService, orderService, paymentService

server/
  controllers/    # authController, productController, customerController, orderController, paymentController, supplierController
  routes/         # 6 route files tương ứng controllers
  models/         # User, Product, Order, Customer, Supplier, Payment
  middlewares/    # verifyToken, requireAdmin, validateRequest
  config/db.js    # Kết nối MongoDB
  server.js       # Entry point
```

## API

Base URL: `/api`

| Route            | Mô tả                                         |
| ---------------- | --------------------------------------------- |
| `/api/auth`      | Đăng ký, đăng nhập, đăng xuất, refresh token  |
| `/api/products`  | CRUD sản phẩm (GET public, CUD yêu cầu admin) |
| `/api/customers` | Quản lý khách hàng                            |
| `/api/orders`    | Quản lý đơn hàng                              |
| `/api/payments`  | Xử lý thanh toán                              |
| `/api/supplier`  | Quản lý nhà cung cấp                          |

Swagger UI có sẵn khi chạy backend.

## Dữ liệu models chính

- **User**: role (admin/user), name, phone, password (bcrypt), location, refreshToken
- **Product**: code, name, price, importPrice, unit, category, supplier ref
- **Order**: customer ref, items[], totalAmount, paidAmount, paymentHistory[], createdBy ref
- **Customer**: name, phone, address, type (le/cong_trinh)
- **Supplier**: name, phone, paymentInfo, address
- **Payment**: liên kết với đơn hàng

## Biến môi trường

File `server/.env` cần có:

```
MONGO_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PORT=5000
```

## Tài liệu dự án (đọc trước khi làm task)

- **`plan.md`** — kế hoạch phát triển theo phase, danh sách bug cần fix, backlog. Cập nhật khi hoàn thành task hoặc đổi ưu tiên.
- **`memory.md`** — ghi chú quyết định kiến trúc, workflow, pitfall, quy ước code. **Đọc file này trước khi bắt đầu task để có ngữ cảnh.**

## Khi nào cần cập nhật `memory.md`

Cập nhật ngay khi có các thay đổi sau (tránh để người/AI sau mất ngữ cảnh):

- Thêm/đổi/xóa model Mongoose hoặc field quan trọng
- Thêm route/endpoint mới hoặc đổi contract API
- Đổi workflow chạy dev/build/deploy hoặc biến môi trường bắt buộc
- Ra quyết định kiến trúc (thư viện mới, pattern, cấu trúc thư mục)
- Phát hiện pitfall / bug non-obvious mà người khác dễ đạp lại
- Đổi quy ước code, commit message, branch strategy

Không ghi vào `memory.md` những thứ đã có trong `CLAUDE.md`, TODO ngắn hạn (dùng `plan.md`), hoặc thay đổi nhỏ thấy được qua `git log`.

## Lưu ý khi phát triển

- API endpoint được detect tự động: ưu tiên `192.168.1.100:5000` (LAN), fallback về `localhost:5000`
- Xác thực dùng JWT Bearer token — access token ngắn hạn + refresh token dài hạn
- Phân quyền: `admin` có toàn quyền, `user` chỉ đọc
- Validation input phía backend dùng Joi schema
- Docker Compose có sẵn (`docker-compose.yml`) cho backend
