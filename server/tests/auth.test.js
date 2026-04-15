require('./setup');
const request = require('supertest');
const app = require('../app');
const { createAdminAndLogin, createUserAndLogin } = require('./helpers');

describe('Auth API', () => {
  // ===================== ĐĂNG KÝ =====================
  describe('POST /api/auth/register', () => {
    it('đăng ký thành công với đầy đủ thông tin', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Nguyễn Văn Test',
          phone: '0901111111',
          password: 'matkhau123',
          role: 'user',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('Nguyễn Văn Test');
      expect(res.body.user.phone).toBe('0901111111');
      expect(res.body.user.role).toBe('user');
    });

    it('đăng ký trùng số điện thoại → 400', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'User 1', phone: '0902222222', password: 'pass123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'User 2', phone: '0902222222', password: 'pass456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/đã được đăng ký/i);
    });

    it('đăng ký thiếu field bắt buộc → 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Thiếu phone' });

      expect(res.status).toBe(400);
    });

    it('đăng ký mật khẩu quá ngắn → 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', phone: '0903333333', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ===================== ĐĂNG NHẬP =====================
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Login User', phone: '0904444444', password: 'pass123456' });
    });

    it('đăng nhập thành công', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '0904444444', password: 'pass123456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.phone).toBe('0904444444');
    });

    it('đăng nhập sai mật khẩu → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '0904444444', password: 'saimatkhau' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/không đúng/i);
    });

    it('đăng nhập sai số điện thoại → 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ phone: '0999999999', password: 'pass123456' });

      expect(res.status).toBe(400);
    });
  });

  // ===================== REFRESH TOKEN =====================
  describe('POST /api/auth/refresh-token', () => {
    it('refresh token thành công', async () => {
      const { refreshToken } = await createAdminAndLogin({ phone: '0905555555' });

      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('refresh token sai → 403', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid_token_here' });

      expect(res.status).toBe(403);
    });
  });

  // ===================== PHÂN QUYỀN =====================
  describe('Phân quyền', () => {
    it('truy cập route admin không có token → 401', async () => {
      const res = await request(app).get('/api/customers');

      expect(res.status).toBe(401);
    });

    it('truy cập route admin bằng token user → 403', async () => {
      const { token } = await createUserAndLogin({ phone: '0906666666' });

      const res = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });
});
