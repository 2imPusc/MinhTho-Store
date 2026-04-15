require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(express.json());

// CORS: nếu ALLOWED_ORIGINS không set, mặc định cho phép tất cả (dev)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // requests không có origin (Postman, curl, SSR) → cho qua
        if (!origin) return cb(null, true);
        if (allowedOrigins.length === 0) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS: origin ${origin} không được phép`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));

// Trust proxy (cần khi chạy sau Cloudflare Tunnel / reverse proxy để lấy đúng IP client)
app.set('trust proxy', 1);

// Static files (ảnh upload)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/supplier', require('./routes/supplierRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Serve FE build trong production (1 origin cho cả FE + BE → đơn giản CORS, tunnel 1 endpoint)
if (process.env.SERVE_CLIENT === 'true') {
    const clientDist = path.join(__dirname, '..', 'client', 'dist');
    app.use(express.static(clientDist));
    // SPA fallback: mọi route không phải /api, /uploads → trả index.html
    app.get(/^\/(?!api|uploads).*/, (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// 404 + error handler (phải đặt sau routes)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
