require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(express.json())
app.use(cors({
  origin: '*', // Hoặc domain cụ thể
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
//Auth
app.use('/api/auth', require('./routes/authRoutes'));

//Product
app.use('/api/products', require('./routes/productRoutes'));

//Supplier
app.use('/api/supplier', require('./routes/supplierRoutes'));

//Customer
app.use('/api/customers', require('./routes/customerRoutes'));

//Order
app.use('/api/orders', require('./routes/orderRoutes'));

//Payment
app.use('/api/payments', require('./routes/paymentRoutes'));

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server is running on port ${PORT}`));