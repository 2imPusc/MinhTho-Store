require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');

  await Promise.all([
    Supplier.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Order.deleteMany({}),
    Payment.deleteMany({}),
  ]);
  console.log('Cleared collections');

  const suppliers = await Supplier.insertMany([
    { name: 'NCC Cadivi', phone: '0901111111', address: 'Q. Tân Bình, TP.HCM', paymentInfo: 'STK 123456789 Vietcombank' },
    { name: 'NCC Bình Minh', phone: '0902222222', address: 'Bình Dương', paymentInfo: 'STK 987654321 ACB' },
    { name: 'NCC Tiền Phong', phone: '0903333333', address: 'Hải Phòng' },
  ]);

  const products = await Product.insertMany([
    { code: 'DAY-CDV-2.5', name: 'Dây điện Cadivi 2.5mm', price: 15000, importPrice: 11000, unit: 'm', category: 'Dây điện', location: 'Kệ A1', stockQty: 500, lowStockThreshold: 50, supplier: suppliers[0]._id },
    { code: 'DAY-CDV-4.0', name: 'Dây điện Cadivi 4.0mm', price: 25000, importPrice: 19000, unit: 'm', category: 'Dây điện', location: 'Kệ A2', stockQty: 300, supplier: suppliers[0]._id },
    { code: 'ONG-BM-21', name: 'Ống nước Bình Minh Ø21', price: 22000, importPrice: 16000, unit: 'cây', category: 'Ống nước', location: 'Kệ B1', stockQty: 80, supplier: suppliers[1]._id },
    { code: 'ONG-BM-27', name: 'Ống nước Bình Minh Ø27', price: 32000, importPrice: 24000, unit: 'cây', category: 'Ống nước', location: 'Kệ B2', stockQty: 60, supplier: suppliers[1]._id },
    { code: 'ONG-TP-34', name: 'Ống Tiền Phong Ø34', price: 45000, importPrice: 33000, unit: 'cây', category: 'Ống nước', location: 'Kệ B3', stockQty: 5, lowStockThreshold: 10, supplier: suppliers[2]._id },
    { code: 'CO-21', name: 'Co nối Ø21', price: 3500, importPrice: 2000, unit: 'cái', category: 'Phụ kiện', location: 'Kệ C1', stockQty: 200, supplier: suppliers[1]._id },
    { code: 'TEE-21', name: 'Tê nối Ø21', price: 5000, importPrice: 3000, unit: 'cái', category: 'Phụ kiện', location: 'Kệ C2', stockQty: 150, supplier: suppliers[1]._id },
    { code: 'BONG-LED-9W', name: 'Bóng LED 9W Rạng Đông', price: 45000, importPrice: 32000, unit: 'cái', category: 'Thiết bị điện', location: 'Kệ D1', stockQty: 120, supplier: suppliers[0]._id },
    { code: 'CONG-TAC-1', name: 'Công tắc đơn Panasonic', price: 35000, importPrice: 25000, unit: 'cái', category: 'Thiết bị điện', location: 'Kệ D2', stockQty: 90, supplier: suppliers[0]._id },
    { code: 'O-CAM-3', name: 'Ổ cắm 3 lỗ Panasonic', price: 55000, importPrice: 40000, unit: 'cái', category: 'Thiết bị điện', location: 'Kệ D3', stockQty: 70, supplier: suppliers[0]._id },
    { code: 'BANG-DINH', name: 'Băng keo điện đen', price: 8000, importPrice: 5000, unit: 'cuộn', category: 'Phụ kiện', location: 'Kệ C3', stockQty: 250, supplier: suppliers[0]._id },
    { code: 'ATTOMAT-20A', name: 'Aptomat 20A LS', price: 85000, importPrice: 62000, unit: 'cái', category: 'Thiết bị điện', location: 'Kệ D4', stockQty: 40, supplier: suppliers[0]._id },
  ]);

  const customers = await Customer.insertMany([
    { name: 'Anh Minh', phone: '0911111111', address: 'Số 12 Nguyễn Huệ, Q1', type: 'le' },
    { name: 'Chị Hoa', phone: '0922222222', address: 'Số 5 Lê Lợi, Q1', type: 'le' },
    { name: 'Công ty Xây dựng Phát Đạt', phone: '0933333333', address: 'KCN Tân Bình', type: 'cong_trinh', note: 'Công trình nhà phố 5 tầng' },
    { name: 'Chú Tám', phone: '0944444444', address: 'Q. Bình Thạnh', type: 'le' },
    { name: 'Công trình Hòa Bình', phone: '0955555555', address: 'Thủ Đức', type: 'cong_trinh' },
  ]);

  const admin = await User.findOne({ role: 'admin' });

  const orders = [
    {
      customer: customers[0]._id,
      items: [
        { product: products[0]._id, quantity: 50, price: 15000 },
        { product: products[7]._id, quantity: 5, price: 45000 },
      ],
      totalAmount: 50 * 15000 + 5 * 45000,
      paidAmount: 50 * 15000 + 5 * 45000,
      paymentHistory: [{ amount: 975000, method: 'Tien mat', note: 'Thanh toán đủ' }],
      createdBy: admin?._id,
    },
    {
      customer: customers[2]._id,
      items: [
        { product: products[2]._id, quantity: 20, price: 22000 },
        { product: products[3]._id, quantity: 15, price: 32000 },
        { product: products[5]._id, quantity: 30, price: 3500 },
      ],
      totalAmount: 20 * 22000 + 15 * 32000 + 30 * 3500,
      paidAmount: 500000,
      paymentHistory: [{ amount: 500000, method: 'Chuyen khoan', note: 'Đặt cọc' }],
      createdBy: admin?._id,
    },
    {
      customer: customers[3]._id,
      items: [{ product: products[10]._id, quantity: 3, price: 8000 }],
      totalAmount: 24000,
      paidAmount: 0,
      createdBy: admin?._id,
    },
    {
      customer: customers[4]._id,
      items: [
        { product: products[1]._id, quantity: 100, price: 25000 },
        { product: products[11]._id, quantity: 4, price: 85000 },
      ],
      totalAmount: 100 * 25000 + 4 * 85000,
      paidAmount: 1000000,
      paymentHistory: [{ amount: 1000000, method: 'Chuyen khoan' }],
      createdBy: admin?._id,
    },
  ];
  const createdOrders = await Order.insertMany(orders);

  await Payment.insertMany([
    { customer: customers[0]._id, order: createdOrders[0]._id, amount: 975000, method: 'Tien mat', note: 'Thanh toán đủ' },
    { customer: customers[2]._id, order: createdOrders[1]._id, amount: 500000, method: 'Chuyen khoan', note: 'Đặt cọc' },
    { customer: customers[4]._id, order: createdOrders[3]._id, amount: 1000000, method: 'Chuyen khoan' },
    { customer: customers[2]._id, amount: 200000, method: 'Tien mat', note: 'Trả nợ chung' },
  ]);

  console.log(`Seeded: ${suppliers.length} suppliers, ${products.length} products, ${customers.length} customers, ${createdOrders.length} orders`);
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
