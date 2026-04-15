const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Khởi tạo MongoDB in-memory trước tất cả test
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Đặt biến môi trường JWT cho test
  process.env.JWT_ACCESS_KEY = 'test_access_key_123';
  process.env.JWT_REFRESH_KEY = 'test_refresh_key_456';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(uri);
});

// Xoá sạch data sau mỗi test để đảm bảo độc lập
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Ngắt kết nối và dừng server sau tất cả test
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});
