require('./setup');
const request = require('supertest');
const app = require('../app');
const { createAdminAndLogin, createTestSupplier, createTestProduct } = require('./helpers');

describe('Supplier API', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await createAdminAndLogin({ phone: '0901234567' });
    adminToken = admin.token;
  });

  // ===================== TẠO =====================
  describe('POST /api/supplier', () => {
    it('tạo nhà cung cấp thành công', async () => {
      const res = await request(app)
        .post('/api/supplier')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'NCC Bình Minh',
          phone: '0987654321',
          address: 'TPHCM',
        });

      expect(res.status).toBe(201);
      expect(res.body.supplier.name).toBe('NCC Bình Minh');
    });

    it('tạo trùng tên hoặc SĐT → 400', async () => {
      await createTestSupplier({ name: 'NCC Trùng', phone: '0912345678' });

      const res = await request(app)
        .post('/api/supplier')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NCC Trùng', phone: '0999888777' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/đã tồn tại/i);
    });
  });

  // ===================== ĐỌC =====================
  describe('GET /api/supplier', () => {
    it('liệt kê nhà cung cấp', async () => {
      await createTestSupplier({ name: 'NCC A', phone: '0911111111' });
      await createTestSupplier({ name: 'NCC B', phone: '0922222222' });

      const res = await request(app)
        .get('/api/supplier')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.allSuppliers.length).toBe(2);
    });
  });

  // ===================== CẬP NHẬT =====================
  describe('PUT /api/supplier/:id', () => {
    it('cập nhật nhà cung cấp thành công', async () => {
      const supplier = await createTestSupplier({ name: 'NCC Cũ', phone: '0933333333' });

      const res = await request(app)
        .put(`/api/supplier/${supplier._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'NCC Mới' });

      expect(res.status).toBe(200);
      expect(res.body.supplier.name).toBe('NCC Mới');
    });
  });

  // ===================== XOÁ =====================
  describe('DELETE /api/supplier/:id', () => {
    it('xóa nhà cung cấp thành công', async () => {
      const supplier = await createTestSupplier({ name: 'NCC Xóa', phone: '0944444444' });

      const res = await request(app)
        .delete(`/api/supplier/${supplier._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/xóa/i);
    });

    it('xóa nhà cung cấp còn sản phẩm liên kết → 400', async () => {
      const supplier = await createTestSupplier({ name: 'NCC Linked', phone: '0955555555' });
      await createTestProduct({ code: 'SP-LINKED', supplier: supplier._id });

      const res = await request(app)
        .delete(`/api/supplier/${supplier._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/sản phẩm/i);
    });
  });
});
