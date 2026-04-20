require('dotenv').config();
const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');

const SUPPLIERS = [
  { name: 'NCC Cadivi', phone: '0901111111', address: 'Q. Tân Bình, TP.HCM', paymentInfo: 'STK 123456789 Vietcombank', note: 'Dây điện chủ lực' },
  { name: 'NCC Bình Minh', phone: '0902222222', address: 'Bình Dương', paymentInfo: 'STK 987654321 ACB', note: 'Ống nhựa PVC' },
  { name: 'NCC Tiền Phong', phone: '0903333333', address: 'Hải Phòng', paymentInfo: 'STK 112233445 BIDV', note: 'Ống nước cao cấp' },
  { name: 'NCC Panasonic VN', phone: '0904444444', address: 'Khu CN Bình Dương', paymentInfo: 'STK 556677889 Techcombank', note: 'Thiết bị điện dân dụng' },
  { name: 'NCC Rạng Đông', phone: '0905555555', address: 'Hạ Đình, Hà Nội', paymentInfo: 'STK 667788990 Vietinbank', note: 'Đèn LED, bóng đèn' },
  { name: 'NCC Sino', phone: '0906666666', address: 'Q. Bình Tân, TP.HCM', paymentInfo: 'STK 778899001 MB', note: 'Công tắc, ổ cắm' },
  { name: 'NCC LS Vina', phone: '0907777777', address: 'Hải Dương', paymentInfo: 'STK 889900112 ACB', note: 'Aptomat, thiết bị đóng cắt' },
  { name: 'NCC Schneider', phone: '0908888888', address: 'Q.7, TP.HCM', paymentInfo: 'STK 990011223 HSBC', note: 'Thiết bị điện công nghiệp' },
  { name: 'NCC Trần Anh', phone: '0909999999', address: 'Long An', paymentInfo: 'Tiền mặt / CK ACB 001122334', note: 'Phụ kiện ống nước, co tê' },
  { name: 'NCC Hoa Sen', phone: '0910101010', address: 'Bình Dương', paymentInfo: 'STK 223344556 Vietcombank', note: 'Tôn, thép, vật liệu xây dựng' },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  let added = 0, updated = 0;
  for (const s of SUPPLIERS) {
    const existing = await Supplier.findOne({ name: s.name });
    if (existing) {
      await Supplier.updateOne({ _id: existing._id }, s);
      updated++;
    } else {
      await Supplier.create(s);
      added++;
    }
  }
  console.log(`Suppliers — added: ${added}, updated: ${updated}, total in list: ${SUPPLIERS.length}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
