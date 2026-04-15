const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

/**
 * Tạo user admin và trả về token
 */
const createAdminAndLogin = async (overrides = {}) => {
  const userData = {
    name: 'Admin Test',
    phone: overrides.phone || '0901234567',
    password: 'admin123',
    role: 'admin',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(userData);

  return {
    user: res.body.user,
    token: res.body.token,
    refreshToken: res.body.refreshToken,
  };
};

/**
 * Tạo user thường và trả về token
 */
const createUserAndLogin = async (overrides = {}) => {
  const userData = {
    name: 'User Test',
    phone: overrides.phone || '0909876543',
    password: 'user1234',
    role: 'user',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/auth/register')
    .send(userData);

  return {
    user: res.body.user,
    token: res.body.token,
    refreshToken: res.body.refreshToken,
  };
};

/**
 * Tạo sản phẩm test trực tiếp qua Model (nhanh hơn API)
 */
const createTestProduct = async (overrides = {}) => {
  const product = new Product({
    code: overrides.code || `SP-${Date.now()}`,
    name: overrides.name || 'Ống nước PVC',
    price: overrides.price ?? 50000,
    importPrice: overrides.importPrice ?? 30000,
    unit: overrides.unit || 'cái',
    category: overrides.category || 'Ống nước',
    stockQty: overrides.stockQty ?? 100,
    lowStockThreshold: overrides.lowStockThreshold ?? 10,
    ...overrides,
  });
  return product.save();
};

/**
 * Tạo khách hàng test
 */
const createTestCustomer = async (overrides = {}) => {
  const customer = new Customer({
    name: overrides.name || 'Nguyễn Văn A',
    phone: overrides.phone || '0912345678',
    address: overrides.address || '123 Đường ABC',
    type: overrides.type || 'le',
    ...overrides,
  });
  return customer.save();
};

/**
 * Tạo nhà cung cấp test
 */
const createTestSupplier = async (overrides = {}) => {
  const supplier = new Supplier({
    name: overrides.name || `NCC Test ${Date.now()}`,
    phone: overrides.phone || '0987654321',
    address: overrides.address || '456 Đường XYZ',
    ...overrides,
  });
  return supplier.save();
};

module.exports = {
  createAdminAndLogin,
  createUserAndLogin,
  createTestProduct,
  createTestCustomer,
  createTestSupplier,
};
