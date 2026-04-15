require('./setup');
const request = require('supertest');
const app = require('../app');
const Product = require('../models/Product');
const {
  createAdminAndLogin,
  createTestProduct,
  createTestCustomer,
} = require('./helpers');

describe('Order API', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await createAdminAndLogin({ phone: '0901234567' });
    adminToken = admin.token;
  });

  // ===================== TẠO ĐƠN HÀNG =====================
  describe('POST /api/orders', () => {
    it('tạo đơn hàng thành công — giảm tồn kho', async () => {
      const product = await createTestProduct({ code: 'SP-ORD1', price: 50000, stockQty: 100 });
      const customer = await createTestCustomer({ name: 'KH Order' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 3 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.order.totalAmount).toBe(150000); // 50000 * 3
      expect(res.body.order.paidAmount).toBe(0);

      // Kiểm tra tồn kho đã giảm
      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.stockQty).toBe(97); // 100 - 3
    });

    it('snapshot giá — giá trong order = giá hiện tại', async () => {
      const product = await createTestProduct({ code: 'SP-SNAP', price: 80000, stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH Snap', phone: '0911111111' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 2 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.order.items[0].price).toBe(80000);
    });

    it('tạo đơn với thanh toán ngay (paidAmount)', async () => {
      const product = await createTestProduct({ code: 'SP-PAID', price: 100000, stockQty: 20 });
      const customer = await createTestCustomer({ name: 'KH Paid', phone: '0922222222' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
          paidAmount: 50000,
          paymentMethod: 'Tien mat',
        });

      expect(res.status).toBe(201);
      expect(res.body.order.paidAmount).toBe(50000);
      expect(res.body.order.totalAmount).toBe(100000);
    });

    it('vượt tồn kho → 400 + rollback', async () => {
      const product = await createTestProduct({ code: 'SP-OOS', price: 10000, stockQty: 2 });
      const customer = await createTestCustomer({ name: 'KH OOS', phone: '0933333333' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 5 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/tồn kho/i);

      // Tồn kho không bị thay đổi
      const p = await Product.findById(product._id);
      expect(p.stockQty).toBe(2);
    });

    it('paidAmount > totalAmount → 400', async () => {
      const product = await createTestProduct({ code: 'SP-OVER', price: 50000, stockQty: 10 });
      const customer = await createTestCustomer({ name: 'KH Over', phone: '0944444444' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
          paidAmount: 999999,
        });

      expect(res.status).toBe(400);
    });

    it('đơn hàng không có items → 400', async () => {
      const customer = await createTestCustomer({ name: 'KH Empty', phone: '0955555555' });

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [],
        });

      expect(res.status).toBe(400);
    });
  });

  // ===================== ĐỌC =====================
  describe('GET /api/orders', () => {
    it('liệt kê đơn hàng', async () => {
      const product = await createTestProduct({ code: 'SP-LIST', stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH List', phone: '0966666666' });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
        });

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('lọc đơn hàng theo khoảng ngày (?from=&to=)', async () => {
      const product = await createTestProduct({ code: 'SP-DATE', stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH Date', phone: '0977777777' });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
        });

      const today = new Date().toISOString().slice(0, 10);
      const res = await request(app)
        .get(`/api/orders?from=${today}&to=${today}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/orders/customer/:customerId', () => {
    it('lấy đơn hàng theo khách hàng', async () => {
      const product = await createTestProduct({ code: 'SP-CUST', stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH Filter', phone: '0988888888' });

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 2 }],
        });

      const res = await request(app)
        .get(`/api/orders/customer/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  // ===================== THANH TOÁN =====================
  describe('PUT /api/orders/:id/payment', () => {
    it('thêm thanh toán thành công', async () => {
      const product = await createTestProduct({ code: 'SP-PAY', price: 100000, stockQty: 20 });
      const customer = await createTestCustomer({ name: 'KH Pay', phone: '0912121212' });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
        });

      const res = await request(app)
        .put(`/api/orders/${orderRes.body.order._id}/payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 60000, method: 'Chuyen khoan' });

      expect(res.status).toBe(200);
      expect(res.body.order.paidAmount).toBe(60000);
    });

    it('thanh toán vượt tổng tiền → 400', async () => {
      const product = await createTestProduct({ code: 'SP-PAYOVER', price: 50000, stockQty: 20 });
      const customer = await createTestCustomer({ name: 'KH PayOver', phone: '0913131313' });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
        });

      const res = await request(app)
        .put(`/api/orders/${orderRes.body.order._id}/payment`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 999999 });

      expect(res.status).toBe(400);
    });
  });

  // ===================== MARK PAID =====================
  describe('PATCH /api/orders/:id/mark-paid', () => {
    it('đánh dấu đã thanh toán đủ', async () => {
      const product = await createTestProduct({ code: 'SP-MK', price: 200000, stockQty: 10 });
      const customer = await createTestCustomer({ name: 'KH Mark', phone: '0914141414' });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
        });

      const res = await request(app)
        .patch(`/api/orders/${orderRes.body.order._id}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.paidAmount).toBe(res.body.order.totalAmount);
    });
  });

  // ===================== XOÁ =====================
  describe('DELETE /api/orders/:id', () => {
    it('xóa đơn hàng + hoàn trả tồn kho', async () => {
      const product = await createTestProduct({ code: 'SP-DELORD', price: 50000, stockQty: 30 });
      const customer = await createTestCustomer({ name: 'KH Del', phone: '0915151515' });

      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 5 }],
        });

      // Tồn kho giảm xuống 25
      let p = await Product.findById(product._id);
      expect(p.stockQty).toBe(25);

      const res = await request(app)
        .delete(`/api/orders/${orderRes.body.order._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Tồn kho hoàn trả về 30
      p = await Product.findById(product._id);
      expect(p.stockQty).toBe(30);
    });
  });

  // ===================== BULK =====================
  describe('POST /api/orders/bulk-delete', () => {
    it('xóa hàng loạt + hoàn trả tồn kho', async () => {
      const product = await createTestProduct({ code: 'SP-BKDEL', price: 10000, stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH Bulk', phone: '0916161616' });

      const o1 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 3 }],
        });

      const o2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 7 }],
        });

      // Tồn kho: 50 - 3 - 7 = 40
      let p = await Product.findById(product._id);
      expect(p.stockQty).toBe(40);

      const res = await request(app)
        .post('/api/orders/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [o1.body.order._id, o2.body.order._id] });

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBe(2);

      // Hoàn trả: 40 + 3 + 7 = 50
      p = await Product.findById(product._id);
      expect(p.stockQty).toBe(50);
    });
  });

  describe('POST /api/orders/bulk-mark-paid', () => {
    it('đánh dấu thanh toán hàng loạt', async () => {
      const product = await createTestProduct({ code: 'SP-BKPAY', price: 100000, stockQty: 50 });
      const customer = await createTestCustomer({ name: 'KH BulkPay', phone: '0917171717' });

      const o1 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 1 }],
        });

      const o2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customerId: customer._id.toString(),
          items: [{ product: product._id.toString(), quantity: 2 }],
        });

      const res = await request(app)
        .post('/api/orders/bulk-mark-paid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [o1.body.order._id, o2.body.order._id] });

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(2);
    });
  });
});
