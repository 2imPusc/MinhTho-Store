# MinhTho Store — Hệ thống quản lý cửa hàng điện nước

Ứng dụng web quản lý bán hàng và công nợ dành cho cửa hàng điện nước MinhTho. Hỗ trợ chạy trên mạng nội bộ (LAN) và truy cập từ xa qua internet.

---

## Tính năng chính

| Module | Chức năng |
| --- | --- |
| **Sản phẩm** | Thêm, sửa, xóa, tìm kiếm theo mã/tên, lọc theo danh mục |
| **Khách hàng** | Quản lý khách lẻ & khách công trình, phân loại theo loại |
| **Đơn hàng** | Tạo đơn, theo dõi thanh toán, xem lịch sử |
| **Công nợ** | Xem nợ theo khách, ghi nhận thanh toán, lịch sử chi tiết |
| **Nhà cung cấp** | CRUD nhà cung cấp, liên kết với sản phẩm |
| **Xác thực** | Đăng nhập/đăng ký bằng SĐT, phân quyền Admin/User |

---

## Công nghệ sử dụng

### Frontend

- **React 19** + Vite 6 — giao diện người dùng
- **React Router DOM 7** — điều hướng
- **Tailwind CSS 4** — giao diện responsive
- **Axios** — gọi API

### Backend

- **Node.js** + Express 5 — REST API
- **MongoDB** + Mongoose 8 — cơ sở dữ liệu
- **JWT** (access token 1 ngày + refresh token 30 ngày) — xác thực
- **Joi** — validation đầu vào với thông báo tiếng Việt
- **bcryptjs** — mã hóa mật khẩu

---

## Cấu trúc thư mục

```text
MinhTho-Store/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── components/      # UI components (Pagination, ProductForm, ...)
│   │   ├── contexts/        # AuthContext
│   │   ├── pages/admin/     # ProductManagement, OrderManagement, ...
│   │   └── services/        # API clients (productService, orderService, ...)
│   └── .env                 # Cấu hình URL backend
│
└── server/                  # Backend Express
    ├── controllers/         # Business logic
    ├── models/              # MongoDB schemas
    ├── routes/              # API routes
    ├── middlewares/         # JWT auth, Joi validation
    └── config/db.js         # Kết nối MongoDB
```

---

## Cài đặt & Chạy

### Yêu cầu

- Node.js >= 18
- MongoDB Atlas account (hoặc MongoDB local)

### 1. Clone và cài dependencies

```bash
git clone <repo-url>
cd MinhTho-Store

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 2. Cấu hình Backend

Tạo file `server/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/minhThoStore
JWT_ACCESS_KEY=your_secret_access_key
JWT_REFRESH_KEY=your_secret_refresh_key
PORT=5000
```

### 3. Cấu hình Frontend

Sửa file `client/.env`:

```env
# IP của máy tính tại cửa hàng (trong mạng LAN)
VITE_LOCAL_API_URL=http://192.168.1.100:5000/api

# URL backend khi deploy lên cloud (Render, Railway, ...)
VITE_CLOUD_API_URL=https://your-app-name.onrender.com/api
```

### 4. Chạy development

```bash
# Terminal 1 — Backend
cd server
npm run dev       # nodemon server.js, port 5000

# Terminal 2 — Frontend
cd client
npm run dev       # Vite dev server, port 5173
```

Truy cập: `http://localhost:5173`

---

## Cơ chế chạy Local + Cloud song song

Ứng dụng được thiết kế để **tự động detect backend** mà không cần cấu hình thủ công:

```text
Khi mở app:
  1. Thử kết nối tới LOCAL_API (IP LAN, timeout 1.5s)
     ✓ Thành công → dùng server máy tính cửa hàng
     ✗ Timeout   → fallback sang CLOUD_API (Render/Railway)
```

**Ý nghĩa thực tế:**

- Khi ở cửa hàng (cùng WiFi): dùng server local → nhanh, không phụ thuộc internet
- Khi ở ngoài / điện thoại 4G: tự động dùng cloud backend

Xem cấu hình tại [client/src/services/api.js](client/src/services/api.js).

---

## Deploy lên Cloud

### Backend (Render / Railway / Heroku)

1. Push code lên GitHub
2. Tạo Web Service mới trên [Render](https://render.com)
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `node server.js`
3. Thêm Environment Variables: `MONGO_URI`, `JWT_ACCESS_KEY`, `JWT_REFRESH_KEY`

### Frontend (Vercel / Netlify)

1. Tạo project mới trên [Vercel](https://vercel.com)
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`
2. Thêm Environment Variables:
   - `VITE_LOCAL_API_URL` = IP LAN cửa hàng
   - `VITE_CLOUD_API_URL` = URL backend Render

---

## API Overview

| Method | Endpoint | Mô tả | Auth |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Đăng ký | Public |
| POST | `/api/auth/login` | Đăng nhập | Public |
| POST | `/api/auth/refresh-token` | Làm mới token | Public |
| GET | `/api/products` | Danh sách sản phẩm | Public |
| POST | `/api/products` | Tạo sản phẩm | Admin |
| GET | `/api/customers` | Danh sách khách hàng | Admin |
| POST | `/api/orders` | Tạo đơn hàng | Admin |
| PUT | `/api/orders/:id/payment` | Ghi nhận thanh toán | Admin |
| GET | `/api/payments/debts` | Tổng hợp công nợ | Admin |

---

## Phân quyền

| Role | Quyền |
| --- | --- |
| `admin` | Toàn quyền: sản phẩm, khách hàng, đơn hàng, thanh toán, nhà cung cấp |
| `user` | Chỉ xem danh sách sản phẩm (public) |

---

## Ghi chú kỹ thuật

- **Snapshot giá**: Giá sản phẩm được snapshot vào đơn hàng lúc tạo, tránh thay đổi giá làm sai lịch sử
- **Thanh toán kép**: Hỗ trợ thanh toán theo từng đơn hàng và ghi nhận thanh toán tổng nợ khách hàng
- **Pagination**: 20 bản ghi mỗi trang, filter thực hiện client-side trước khi phân trang
- **CORS**: Backend cho phép tất cả origin — nên giới hạn lại theo domain cụ thể khi production
