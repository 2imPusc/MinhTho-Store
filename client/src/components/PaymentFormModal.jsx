import { useState } from "react";
import paymentService from "../services/paymentService";

const fmt = (n) => (n ?? 0).toLocaleString("vi-VN") + "đ";

export default function PaymentFormModal({ order, onClose, onSuccess }) {
  const remaining = (order.totalAmount || 0) - (order.paidAmount || 0);
  const [amount, setAmount] = useState(remaining);
  const [method, setMethod] = useState("Tien mat");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Số tiền không hợp lệ"); return; }
    if (amt > remaining) { setError(`Số tiền vượt quá công nợ (${fmt(remaining)})`); return; }
    setBusy(true);
    setError("");
    try {
      await paymentService.create({
        customerId: order.customer?._id || order.customer,
        orderId: order._id,
        amount: amt,
        method,
        note,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Tạo thanh toán thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Ghi nhận thanh toán</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm">
          <div className="rounded-lg bg-gray-50 p-3 space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Khách</span><span className="font-medium">{order.customer?.name || "Khách vãng lai"}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Tổng đơn</span><span>{fmt(order.totalAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Đã trả</span><span className="text-green-700">{fmt(order.paidAmount)}</span></div>
            <div className="flex justify-between border-t pt-1"><span className="text-gray-600">Còn nợ</span><span className="font-bold text-red-600">{fmt(remaining)}</span></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Số tiền trả</label>
            <input
              type="number"
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => setAmount(remaining)} className="text-xs text-blue-600 hover:underline">Trả đủ ({fmt(remaining)})</button>
              <button type="button" onClick={() => setAmount(Math.round(remaining / 2))} className="text-xs text-blue-600 hover:underline">Trả 50%</button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phương thức</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Tien mat">Tiền mặt</option>
              <option value="Chuyen khoan">Chuyển khoản</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-3">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50">Hủy</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {busy ? "Đang lưu..." : "Xác nhận thanh toán"}
          </button>
        </div>
      </form>
    </div>
  );
}
