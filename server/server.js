require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(express.json())
app.use(cors);

//Auth
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//Product
app.use('/api/products', require('./routes/productRoutes'));

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));