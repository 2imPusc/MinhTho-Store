require('./setup');
const request = require('supertest');
const app = require('../app');
const { createAdminAndLogin, createTestCustomer } = require('./helpers');

describe('Customer API', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await createAdminAndLogin({ phone: '0901234567' });
    adminToken = admin.token;
  });

  // ===================== TẠO =====================
  describe('POST /api/customers', () => {
    it('tạo khách hàng lẻ thành công', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Trần Văn B',
          phone: '0912345678',
          address: '789 Đường DEF',
          type: 'le',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Trần Văn B');
      expect(res.body.type).toBe('le');
    });

    it('tạo khách hàng công trình thành công', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Công trình ABC',
          phone: '0998877665',
          type: 'cong_trinh',
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('cong_trinh');
    });

    it('thiếu tên → 400', async () => {
      const res = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '0911111111' });

      expect(res.status).toBe(400);
    });
  });

  // ===================== ĐỌC =====================
  describe('GET /api/customers', () => {
    it('liệt kê tất cả khách hàng', async () => {
      await createTestCustomer({ name: 'KH 1', phone: '0911111111' });
      await createTestCustomer({ name: 'KH 2', phone: '0922222222' });

      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('lấy chi tiết khách hàng', async () => {
      const customer = await createTestCustomer({ name: 'Chi tiết KH' });

      const res = await request(app)
        .get(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Chi tiết KH');
    });
  });

  // ===================== CẬP NHẬT =====================
  describe('PUT /api/customers/:id', () => {
    it('cập nhật thông tin khách hàng', async () => {
      const customer = await createTestCustomer({ name: 'KH Cũ' });

      const res = await request(app)
        .put(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'KH Mới', type: 'cong_trinh' });

      expect(res.status).toBe(200);
      expect(res.body.customer.name).toBe('KH Mới');
      expect(res.body.customer.type).toBe('cong_trinh');
    });
  });

  // ===================== XOÁ =====================
  describe('DELETE /api/customers/:id', () => {
    it('xóa khách hàng thành công', async () => {
      const customer = await createTestCustomer({ name: 'KH Xóa' });

      const res = await request(app)
        .delete(`/api/customers/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/xóa/i);
    });
  });

  describe('POST /api/customers/bulk-delete', () => {
    it('xóa hàng loạt khách hàng', async () => {
      const c1 = await createTestCustomer({ name: 'KH BK1', phone: '0933333333' });
      const c2 = await createTestCustomer({ name: 'KH BK2', phone: '0944444444' });

      const res = await request(app)
        .post('/api/customers/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [c1._id, c2._id] });

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBe(2);
    });
  });

  // ===================== AUTH =====================
  describe('Không có token → 401', () => {
    it('GET /api/customers không có token', async () => {
      const res = await request(app).get('/api/customers');
      expect(res.status).toBe(401);
    });
  });
});
