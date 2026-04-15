require('./setup');
const request = require('supertest');
const app = require('../app');
const {
  createAdminAndLogin,
  createUserAndLogin,
  createTestProduct,
  createTestSupplier,
} = require('./helpers');

describe('Product API', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await createAdminAndLogin({ phone: '0901234567' });
    adminToken = admin.token;
  });

  // ===================== PUBLIC =====================
  describe('GET /api/products (public)', () => {
    it('liệt kê tất cả sản phẩm (không cần token)', async () => {
      await createTestProduct({ code: 'SP-001', name: 'Ống PVC 21' });
      await createTestProduct({ code: 'SP-002', name: 'Van nước' });

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('server-side pagination (?page=1&limit=1)', async () => {
      await createTestProduct({ code: 'SP-P1', name: 'SP Page 1' });
      await createTestProduct({ code: 'SP-P2', name: 'SP Page 2' });
      await createTestProduct({ code: 'SP-P3', name: 'SP Page 3' });

      const res = await request(app).get('/api/products?page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total', 3);
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('totalPages', 3);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /api/products/:id', () => {
    it('lấy chi tiết sản phẩm theo ID', async () => {
      const product = await createTestProduct({ code: 'SP-DT01' });

      const res = await request(app).get(`/api/products/${product._id}`);

      expect(res.status).toBe(200);
      expect(res.body.product.code).toBe('SP-DT01');
    });

    it('ID không tồn tại → 404', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/products/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  // ===================== ADMIN =====================
  describe('POST /api/products (admin)', () => {
    it('tạo sản phẩm mới thành công', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SP-NEW',
          name: 'Ống nhựa Bình Minh',
          price: 75000,
          importPrice: 50000,
          unit: 'cây',
          category: 'Ống nước',
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SP-NEW');
      expect(res.body.name).toBe('Ống nhựa Bình Minh');
    });

    it('tạo trùng mã sản phẩm → 400', async () => {
      await createTestProduct({ code: 'SP-TRUNG' });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SP-TRUNG',
          name: 'Sản phẩm khác',
          price: 10000,
          importPrice: 5000,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/đã tồn tại/i);
    });

    it('thiếu field bắt buộc → 400', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Thiếu code và price' });

      expect(res.status).toBe(400);
    });

    it('tạo sản phẩm với supplierInfo → auto-create supplier', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SP-NCC',
          name: 'Sản phẩm có NCC mới',
          price: 60000,
          importPrice: 40000,
          supplierInfo: {
            name: 'NCC Tự động tạo',
            phone: '0912345678',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.supplier).toBeTruthy();
    });
  });

  describe('PUT /api/products/:id (admin)', () => {
    it('cập nhật sản phẩm thành công', async () => {
      const product = await createTestProduct({ code: 'SP-UPDATE' });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SP-UPDATE',
          name: 'Tên mới',
          price: 99000,
          importPrice: 60000,
        });

      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe('Tên mới');
      expect(res.body.product.price).toBe(99000);
    });
  });

  describe('DELETE /api/products/:id (admin)', () => {
    it('xóa sản phẩm thành công', async () => {
      const product = await createTestProduct({ code: 'SP-DEL' });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/xóa/i);
    });
  });

  describe('POST /api/products/bulk-delete (admin)', () => {
    it('xóa hàng loạt sản phẩm', async () => {
      const p1 = await createTestProduct({ code: 'SP-BK1' });
      const p2 = await createTestProduct({ code: 'SP-BK2' });

      const res = await request(app)
        .post('/api/products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [p1._id, p2._id] });

      expect(res.status).toBe(200);
      expect(res.body.deletedCount).toBe(2);
    });
  });

  // ===================== PHÂN QUYỀN =====================
  describe('Phân quyền', () => {
    it('user thường không được tạo sản phẩm → 403', async () => {
      const { token } = await createUserAndLogin({ phone: '0909876543' });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'SP-403',
          name: 'Không được phép',
          price: 10000,
          importPrice: 5000,
        });

      expect(res.status).toBe(403);
    });
  });
});
