import * as XLSX from "xlsx";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "");

const downloadSheet = (rows, sheetName, fileName) => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${fileName}-${stamp}.xlsx`);
};

export const exportOrders = (orders) => {
  const rows = orders.map((o, i) => ({
    STT: i + 1,
    "Mã đơn": o._id?.slice(-8).toUpperCase(),
    "Khách hàng": o.customer?.name || "Khách vãng lai",
    "SĐT": o.customer?.phone || "",
    "Số SP": o.items?.length || 0,
    "Tổng tiền": o.totalAmount || 0,
    "Đã trả": o.paidAmount || 0,
    "Còn nợ": (o.totalAmount || 0) - (o.paidAmount || 0),
    "Trạng thái": (o.paidAmount || 0) >= (o.totalAmount || 0) ? "Đã trả" : "Còn nợ",
    "Ngày tạo": fmtDateTime(o.createdAt),
    "Ghi chú": o.note || "",
  }));
  downloadSheet(rows, "DonHang", "don-hang");
};

export const exportCustomers = (customers) => {
  const rows = customers.map((c, i) => ({
    STT: i + 1,
    "Tên": c.name,
    "SĐT": c.phone || "",
    "Địa chỉ": c.address || "",
    "Loại": c.type === "cong_trinh" ? "Công trình" : "Lẻ",
    "Ngày tạo": fmtDate(c.createdAt),
  }));
  downloadSheet(rows, "KhachHang", "khach-hang");
};

export const exportPayments = (payments) => {
  const rows = payments.map((p, i) => ({
    STT: i + 1,
    "Ngày": fmtDateTime(p.createdAt),
    "Khách hàng": p.customer?.name || "",
    "SĐT": p.customer?.phone || "",
    "Số tiền": p.amount || 0,
    "Phương thức": p.method === "Chuyen khoan" ? "Chuyển khoản" : "Tiền mặt",
    "Loại": p.order ? "Theo đơn" : "Công nợ chung",
    "Ghi chú": p.note || "",
  }));
  downloadSheet(rows, "ThanhToan", "thanh-toan");
};

export const exportDebts = (debts) => {
  const rows = debts.map((d, i) => ({
    STT: i + 1,
    "Khách hàng": d.customer?.name || "",
    "SĐT": d.customer?.phone || "",
    "Loại": d.customer?.type === "cong_trinh" ? "Công trình" : "Lẻ",
    "Số đơn": d.orderCount || 0,
    "Tổng mua": d.totalOrdered || 0,
    "Đã trả": d.totalPaid || 0,
    "Còn nợ": d.totalDebt || 0,
  }));
  downloadSheet(rows, "CongNo", "cong-no");
};

export const exportProducts = (products) => {
  const rows = products.map((p, i) => ({
    STT: i + 1,
    "Mã": p.code || "",
    "Tên": p.name || "",
    "Danh mục": p.category || "",
    "ĐVT": p.unit || "",
    "Giá nhập": p.importPrice || 0,
    "Giá bán": p.price || 0,
    "Tồn kho": p.stockQty ?? 0,
    "Ngưỡng cảnh báo": p.lowStockThreshold ?? 0,
    "Vị trí": p.location || "",
    "Nhà cung cấp": p.supplier?.name || "",
  }));
  downloadSheet(rows, "SanPham", "san-pham");
};
