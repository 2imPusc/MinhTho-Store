import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../../services/orderService";

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getAll();
      setOrders(res.data);
    } catch (err) {
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const customerName = o.customer?.name || "";
      const matchSearch =
        !search || customerName.toLowerCase().includes(search.toLowerCase());
      const isPaid = o.paidAmount >= o.totalAmount;
      const matchStatus =
        !statusFilter ||
        (statusFilter === "paid" && isPaid) ||
        (statusFilter === "unpaid" && !isPaid);
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await orderService.delete(id);
      setOrders((prev) => prev.filter((o) => o._id !== id));
    } catch (err) {
      setError("Xóa đơn hàng thất bại");
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await orderService.markPaid(id);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h2>
        <button
          onClick={() => navigate("/admin/orders/create")}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Tạo đơn hàng
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-4 font-semibold text-red-500 transition hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="paid">Đã thanh toán</option>
          <option value="unpaid">Còn nợ</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500">
        Hiển thị <span className="font-medium text-gray-700">{filtered.length}</span> / {orders.length} đơn hàng
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Khách hàng
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                  SP
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Tổng tiền
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Đã trả
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Còn nợ
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Trạng thái
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Ngày tạo
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="h-10 w-10 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-400">Không tìm thấy đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const isPaid = order.paidAmount >= order.totalAmount;
                  const remaining = order.totalAmount - order.paidAmount;
                  return (
                    <tr key={order._id} className="transition hover:bg-gray-50/70">
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {order.customer?.name || "Khách vãng lai"}
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        {order.items?.length || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">
                        {order.totalAmount?.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">
                        {order.paidAmount?.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        {remaining > 0 ? (
                          <span className="text-red-600">
                            {remaining.toLocaleString("vi-VN")}đ
                          </span>
                        ) : (
                          <span className="text-gray-400">0đ</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            isPaid
                              ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                              : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                          }`}
                        >
                          {isPaid ? "Đã trả" : "Còn nợ"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="inline-flex items-center gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkPaid(order._id)}
                              className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                            >
                              Trả đủ
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(order._id)}
                            className="text-xs font-medium text-red-500 transition hover:text-red-700 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
