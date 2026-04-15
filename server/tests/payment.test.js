require('./setup');
const request = require('supertest');
const app = require('../app');
const Order = require('../models/Order');
const {
  createAdminAndLogin,
  createTestProduct,
  createTestCustomer,
} = require('./helpers');

describe('Payment API', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await createAdminAndLogin({ phone: '0901234567' });
    adminToken = admin.token;
  });

  /**
   * Helper: tạo đơn hàng chưa thanh toán
   */
  const createUnpaidOrder = async (customer, product, qty = 1) => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customer._id.toString(),
        items: [{ product: product._id.toString(), quantity: qty }],
      });
    return res.body.order;
  };

  // ===================== TẠO THANH TOÁN =====================
  describe('POST /api/payments', () => {
    it('thanh toán cho đơn hàng cụ thể', async () => {
      const product = await createTestProduct({ code: 'SP-PMT1', price: 200000, stockQty: 20 });
      const customer = await createTestCustomer({ name: 'KH PMT1' });
      const order = await createUnpaidOrder(customer, product);

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          orderId: order._id,
          amount: 100000,
          method: 'Chuyen khoan',
        });

      expect(res.status).toBe(201);
      expect(res.body.payment.amount).toBe(100000);

      // Kiểm tra paidAmount của order đã tăng
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paidAmount).toBe(100000);
    });

    it('thanh toán công nợ chung (không gắn đơn hàng)', async () => {
      const customer = await createTestCustomer({ name: 'KH PMT2', phone: '0911111111' });

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          amount: 500000,
          method: 'Tien mat',
          note: 'Trả nợ chung',
        });

      expect(res.status).toBe(201);
      expect(res.body.payment.order).toBeNull();
    });

    it('thanh toán vượt nợ đơn hàng → 400', async () => {
      const product = await createTestProduct({ code: 'SP-PMT3', price: 50000, stockQty: 20 });
      const customer = await createTestCustomer({ name: 'KH PMT3', phone: '0922222222' });
      const order = await createUnpaidOrder(customer, product);

      const res = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          orderId: order._id,
          amount: 999999,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/vượt quá/i);
    });
  });

  // ===================== ĐỌC =====================
  describe('GET /api/payments', () => {
    it('liệt kê tất cả thanh toán', async () => {
      const customer = await createTestCustomer({ name: 'KH PMT4', phone: '0933333333' });

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId: customer._id.toString(), amount: 100000 });

      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/payments/debts', () => {
    it('tổng hợp công nợ (aggregate)', async () => {
      const product = await createTestProduct({ code: 'SP-DEBT', price: 100000, stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH Debt', phone: '0944444444' });

      // Tạo đơn hàng chưa thanh toán
      await createUnpaidOrder(customer, product, 2); // 200000 nợ

      const res = await request(app)
        .get('/api/payments/debts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].totalDebt).toBe(200000);
      expect(res.body[0].customer.name).toBe('KH Debt');
    });
  });

  describe('GET /api/payments/customer/:customerId', () => {
    it('thanh toán theo khách hàng', async () => {
      const customer = await createTestCustomer({ name: 'KH PMT5', phone: '0955555555' });

      await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customerId: customer._id.toString(), amount: 200000 });

      const res = await request(app)
        .get(`/api/payments/customer/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  // ===================== XOÁ =====================
  describe('DELETE /api/payments/:id', () => {
    it('xóa thanh toán + giảm paidAmount của order', async () => {
      const product = await createTestProduct({ code: 'SP-DELPMT', price: 100000, stockQty: 20 });
      const customer = await createTestCustomer({ name: 'KH DelPMT', phone: '0966666666' });
      const order = await createUnpaidOrder(customer, product);

      // Tạo thanh toán
      const payRes = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          orderId: order._id,
          amount: 60000,
        });

      // Xóa thanh toán
      const res = await request(app)
        .delete(`/api/payments/${payRes.body.payment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // paidAmount của order phải giảm trở lại
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paidAmount).toBe(0);
    });
  });
});
