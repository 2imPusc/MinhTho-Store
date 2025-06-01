require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(express.json())
app.use(cors({
  origin: '*', // Hoặc domain cụ thể
  methods: ['GET', 'POST', 'PUT','DELETE'],
}));
//Auth
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

//Product
app.use('/api/products', require('./routes/productRoutes'));

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));