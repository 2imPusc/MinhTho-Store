import { useState, useEffect, useMemo } from "react";
import paymentService from "../../services/paymentService";
import Pagination from "../../components/Pagination";
import { exportPayments } from "../../utils/exportExcel";

const PAGE_SIZE = 20;

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getAll();
      setPayments(res.data);
    } catch (err) {
      setError("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = useMemo(() => {
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (q) {
        const name = (p.customer?.name || "").toLowerCase();
        const phone = (p.customer?.phone || "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      if (methodFilter && p.method !== methodFilter) return false;
      if (typeFilter === "order" && !p.order) return false;
      if (typeFilter === "general" && p.order) return false;
      const ts = new Date(p.createdAt).getTime();
      if (fromTs !== null && ts < fromTs) return false;
      if (toTs !== null && ts > toTs) return false;
      return true;
    });
  }, [payments, search, methodFilter, typeFilter, fromDate, toDate]);

  const totalAmount = useMemo(
    () => filtered.reduce((s, p) => s + (p.amount || 0), 0),
    [filtered]
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useMemo(() => { setCurrentPage(1); }, [search, methodFilter, typeFilter, fromDate, toDate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa thanh toán này? Đơn hàng liên quan sẽ được trừ ngược số tiền đã trả.")) return;
    try {
      await paymentService.delete(id);
      setPayments((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Xóa thất bại");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <span className="ml-3 text-sm text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{filtered.length}</span> / {payments.length} thanh toán
            {filtered.length !== payments.length && <span className="text-blue-600"> (đang lọc)</span>}
          </p>
          <p className="text-sm text-gray-600 mt-0.5">
            Tổng tiền hiển thị: <span className="font-bold text-green-600">{totalAmount.toLocaleString("vi-VN")}đ</span>
          </p>
        </div>
        <button
          onClick={() => exportPayments(filtered)}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Xuất Excel
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-4 font-semibold text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          placeholder="Tìm theo tên / SĐT khách..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] max-w-sm rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Tất cả phương thức</option>
          <option value="Tien mat">Tiền mặt</option>
          <option value="Chuyen khoan">Chuyển khoản</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Tất cả loại</option>
          <option value="order">Theo đơn</option>
          <option value="general">Công nợ chung</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="text-xs text-gray-500 hover:text-red-600 px-2"
            >✕</button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Ngày</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Khách hàng</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Số tiền</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Phương thức</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Loại</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Ghi chú</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center text-sm text-gray-400">
                    Không có thanh toán nào
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/70 transition">
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(p.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{p.customer?.name || "-"}</div>
                      {p.customer?.phone && <div className="text-xs text-gray-500">{p.customer.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-green-600">
                      +{p.amount?.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">
                      {p.method === "Chuyen khoan" ? "Chuyển khoản" : "Tiền mặt"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        p.order ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20" : "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                      }`}>
                        {p.order ? "Theo đơn" : "Công nợ chung"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-xs truncate" title={p.note}>{p.note || "-"}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-xs font-medium text-red-500 transition hover:text-red-700 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
};

export default PaymentManagement;
