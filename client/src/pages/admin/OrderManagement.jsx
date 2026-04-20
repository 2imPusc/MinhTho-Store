import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../../services/orderService";
import Pagination from "../../components/Pagination";
import InvoicePrint from "../../components/InvoicePrint";
import OrderDetailModal from "../../components/OrderDetailModal";
import ConfirmModal from "../../components/ConfirmModal";
import PaymentFormModal from "../../components/PaymentFormModal";
import { exportOrders } from "../../utils/exportExcel";

const PAGE_SIZE = 20;

const OrderManagement = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [printOrder, setPrintOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [payOrder, setPayOrder] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    if (openMenuId) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

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
    const fromTs = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
    const toTs = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
    return orders.filter((o) => {
      const customerName = o.customer?.name || "";
      const matchSearch =
        !search || customerName.toLowerCase().includes(search.toLowerCase());
      const isPaid = o.paidAmount >= o.totalAmount;
      const matchStatus =
        !statusFilter ||
        (statusFilter === "paid" && isPaid) ||
        (statusFilter === "unpaid" && !isPaid);
      const ts = new Date(o.createdAt).getTime();
      const matchFrom = fromTs === null || ts >= fromTs;
      const matchTo = toTs === null || ts <= toTs;
      return matchSearch && matchStatus && matchFrom && matchTo;
    });
  }, [orders, search, statusFilter, fromDate, toDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useMemo(() => { setCurrentPage(1); }, [search, statusFilter, fromDate, toDate]);

  const askDelete = (order) => {
    setConfirm({
      title: "Xóa đơn hàng",
      message: `Xóa đơn của "${order.customer?.name || "Khách vãng lai"}" (${order.totalAmount?.toLocaleString("vi-VN")}đ)?\nTồn kho sẽ được hoàn trả.`,
      confirmText: "Xóa",
      variant: "danger",
      action: async () => {
        await orderService.delete(order._id);
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
      },
      errorMsg: "Xóa đơn hàng thất bại",
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pageIds = paginated.map((o) => o._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleSelectPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const askBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirm({
      title: "Xóa hàng loạt",
      message: `Xóa ${ids.length} đơn hàng đã chọn? Tồn kho sẽ được hoàn trả.`,
      confirmText: "Xóa tất cả",
      variant: "danger",
      action: async () => {
        await orderService.bulkDelete(ids);
        clearSelection();
        fetchOrders();
      },
      errorMsg: "Xóa hàng loạt thất bại",
    });
  };

  const askBulkMarkPaid = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setConfirm({
      title: "Đánh dấu đã trả",
      message: `Đánh dấu ${ids.length} đơn đã thanh toán đầy đủ?`,
      confirmText: "Xác nhận",
      variant: "success",
      action: async () => {
        await orderService.bulkMarkPaid(ids);
        clearSelection();
        fetchOrders();
      },
      errorMsg: "Thao tác hàng loạt thất bại",
    });
  };

  const askMarkPaid = (order) => {
    const remaining = order.totalAmount - order.paidAmount;
    setConfirm({
      title: "Đánh dấu đã trả đủ",
      message: `Xác nhận khách "${order.customer?.name || "Khách vãng lai"}" đã trả đủ ${remaining.toLocaleString("vi-VN")}đ?`,
      confirmText: "Đã trả đủ",
      variant: "success",
      action: async () => {
        await orderService.markPaid(order._id);
        fetchOrders();
      },
      errorMsg: "Có lỗi xảy ra",
    });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBulkBusy(true);
    try {
      await confirm.action();
      setConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || confirm.errorMsg || "Thao tác thất bại");
      setConfirm(null);
    } finally {
      setBulkBusy(false);
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
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{filtered.length}</span> / {orders.length} đơn hàng
          {filtered.length !== orders.length && <span className="text-blue-600"> (đang lọc)</span>}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportOrders(filtered)}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
            Xuất Excel
          </button>
          <button onClick={() => navigate("/admin/orders/create")} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tạo đơn hàng
          </button>
        </div>
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
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="Từ ngày"
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            title="Đến ngày"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(""); setToDate(""); }}
              className="text-xs text-gray-500 hover:text-red-600 px-2"
              title="Xóa bộ lọc ngày"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-semibold text-blue-800">Đã chọn {selectedIds.size} đơn</span>
          <button
            onClick={askBulkMarkPaid}
            disabled={bulkBusy}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            Đánh dấu đã trả
          </button>
          <button
            onClick={askBulkDelete}
            disabled={bulkBusy}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Xóa đã chọn
          </button>
          <button
            onClick={clearSelection}
            disabled={bulkBusy}
            className="ml-auto text-xs font-medium text-gray-600 hover:text-gray-800"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectPage}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
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
                  <td colSpan="9" className="px-5 py-16 text-center">
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
                paginated.map((order) => {
                  const isPaid = order.paidAmount >= order.totalAmount;
                  const remaining = order.totalAmount - order.paidAmount;
                  return (
                    <tr key={order._id} className={`transition hover:bg-gray-50/70 ${selectedIds.has(order._id) ? "bg-blue-50/50" : ""}`}>
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(order._id)}
                          onChange={() => toggleSelect(order._id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {order.customer?.name || "Khách vãng lai"}
                        </button>
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
                      <td className="px-5 py-3.5 text-center relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === order._id ? null : order._id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          aria-label="Mở menu"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                          </svg>
                        </button>
                        {openMenuId === order._id && (
                          <div
                            ref={menuRef}
                            className="absolute right-4 top-12 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                          >
                            <button
                              onClick={() => { setOpenMenuId(null); setPrintOrder(order); }}
                              className="block w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
                            >
                              In hóa đơn
                            </button>
                            {!isPaid && (
                              <>
                                <button
                                  onClick={() => { setOpenMenuId(null); setPayOrder(order); }}
                                  className="block w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50"
                                >
                                  Thanh toán
                                </button>
                                <button
                                  onClick={() => { setOpenMenuId(null); askMarkPaid(order); }}
                                  className="block w-full px-4 py-2 text-left text-sm text-green-700 hover:bg-green-50"
                                >
                                  Đánh dấu trả đủ
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => { setOpenMenuId(null); askDelete(order); }}
                              className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
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

      {printOrder && (
        <InvoicePrint order={printOrder} onClose={() => setPrintOrder(null)} />
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onPay={(o) => { setDetailOrder(null); setPayOrder(o); }}
        />
      )}

      {payOrder && (
        <PaymentFormModal
          order={payOrder}
          onClose={() => setPayOrder(null)}
          onSuccess={() => { setPayOrder(null); fetchOrders(); }}
        />
      )}

      <ConfirmModal
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.confirmText}
        variant={confirm?.variant}
        loading={bulkBusy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};

export default OrderManagement;
