import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import paymentService from "../../services/paymentService";

const CustomerDebt = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false);
  const [payOrderId, setPayOrderId] = useState(""); // "" = general payment
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Tien mat");
  const [payNote, setPayNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDebt = async () => {
    try {
      setLoading(true);
      const res = await paymentService.getCustomerDebt(customerId);
      setData(res.data);
    } catch (err) {
      setError("Không thể tải thông tin công nợ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebt();
  }, [customerId]);

  const handlePay = async (e) => {
    e.preventDefault();
    setError("");
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setError("Số tiền phải lớn hơn 0");
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.create({
        customerId,
        orderId: payOrderId || undefined,
        amount,
        method: payMethod,
        note: payNote,
      });
      setShowPayForm(false);
      setPayOrderId("");
      setPayAmount("");
      setPayNote("");
      fetchDebt();
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  };

  const openPayForOrder = (orderId) => {
    setPayOrderId(orderId);
    setShowPayForm(true);
  };

  const openGeneralPay = () => {
    setPayOrderId("");
    setShowPayForm(true);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <span className="ml-3 text-sm text-gray-500">Đang tải dữ liệu...</span>
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="h-12 w-12 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-3 text-sm text-red-500">{error}</p>
      </div>
    );

  const { customer, totalOrdered, totalPaid, totalDebt, orders, generalPayments } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/customers")}
            className="mb-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại
          </button>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            Công nợ: {customer.name}
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
                customer.type === "cong_trinh"
                  ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                  : "bg-green-50 text-green-700 ring-1 ring-green-600/20"
              }`}
            >
              {customer.type === "cong_trinh" ? "Công trình" : "Khách lẻ"}
            </span>
          </h2>
          <div className="mt-1 space-y-0.5">
            {customer.phone && (
              <p className="text-sm text-gray-500">
                <span className="text-gray-400">SĐT:</span> {customer.phone}
              </p>
            )}
            {customer.address && (
              <p className="text-sm text-gray-500">
                <span className="text-gray-400">Địa chỉ:</span> {customer.address}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={openGeneralPay}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          + Ghi nhận thanh toán
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-l-4 border-l-blue-500 bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Tổng mua</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {totalOrdered.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="rounded-xl border-l-4 border-l-green-500 bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Đã trả</p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {totalPaid.toLocaleString("vi-VN")}đ
          </p>
        </div>
        <div className="rounded-xl border-l-4 border-l-red-500 bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-500">Còn nợ</p>
          <p className={`mt-1 text-2xl font-bold ${totalDebt > 0 ? "text-red-600" : "text-green-600"}`}>
            {totalDebt.toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Đơn hàng
            <span className="ml-1.5 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {orders.length}
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Ngày
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Sản phẩm
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
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-400">Chưa có đơn hàng</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const remaining = order.totalAmount - order.paidAmount;
                  return (
                    <tr key={order._id} className="transition hover:bg-gray-50/70">
                      <td className="px-5 py-3.5 text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {order.items?.map((item, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                            >
                              {item.product?.name || "?"} &times;{item.quantity}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">
                        {order.totalAmount.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-700">
                        {order.paidAmount.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">
                        {remaining > 0 ? (
                          <span className="text-red-600">
                            {remaining.toLocaleString("vi-VN")}đ
                          </span>
                        ) : (
                          <span className="text-green-600">0đ</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {remaining > 0 && (
                          <button
                            onClick={() => openPayForOrder(order._id)}
                            className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            Trả tiền
                          </button>
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

      {/* General Payments */}
      {generalPayments.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Thanh toán công nợ chung
              <span className="ml-1.5 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                {generalPayments.length}
              </span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Ngày
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Số tiền
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Phương thức
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {generalPayments.map((p) => (
                  <tr key={p._id} className="transition hover:bg-gray-50/70">
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-green-600">
                      +{p.amount.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-5 py-3.5 text-gray-700">{p.method}</td>
                    <td className="px-5 py-3.5 text-gray-400">{p.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-800">
                {payOrderId ? "Trả tiền theo đơn hàng" : "Trả công nợ chung"}
              </h3>
              <button
                onClick={() => setShowPayForm(false)}
                className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Số tiền <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="Nhập số tiền..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phương thức
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="Tien mat">Tiền mặt</option>
                  <option value="Chuyen khoan">Chuyển khoản</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Ghi chú
                </label>
                <textarea
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="Ghi chú thêm..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPayForm(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {submitting ? "Đang lưu..." : "Xác nhận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDebt;
