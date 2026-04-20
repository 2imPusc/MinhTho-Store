const fmt = (n) => (n ?? 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function OrderDetailModal({ order, onClose, onPay }) {
  if (!order) return null;
  const remaining = (order.totalAmount || 0) - (order.paidAmount || 0);
  const isPaid = remaining <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-xs text-gray-500 font-mono">#{order._id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">Khách hàng</div>
              <div className="font-semibold text-gray-900">{order.customer?.name || "Khách vãng lai"}</div>
              {order.customer?.phone && <div className="text-gray-600">{order.customer.phone}</div>}
              {order.customer?.type && (
                <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {order.customer.type === "cong_trinh" ? "Công trình" : "Lẻ"}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500">Ngày tạo</div>
              <div className="text-gray-900">{fmtDate(order.createdAt)}</div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isPaid
                      ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                      : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                  }`}
                >
                  {isPaid ? "Đã thanh toán" : "Còn nợ"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Sản phẩm</h3>
            <div className="rounded-lg ring-1 ring-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Tên</th>
                    <th className="px-3 py-2 text-right">SL</th>
                    <th className="px-3 py-2 text-right">Đơn giá</th>
                    <th className="px-3 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">
                          {it.product?.name || "(Sản phẩm đã xóa)"}
                        </div>
                        {it.product?.code && (
                          <div className="text-xs text-gray-400 font-mono">{it.product.code}</div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {it.quantity} {it.product?.unit || ""}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">{fmt(it.price)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-gray-900">
                        {fmt(it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng tiền</span>
              <span className="font-semibold text-gray-900">{fmt(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đã thanh toán</span>
              <span className="font-semibold text-green-700">{fmt(order.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span className="text-gray-600">Còn nợ</span>
              <span className={`font-bold ${remaining > 0 ? "text-red-600" : "text-gray-400"}`}>
                {fmt(Math.max(remaining, 0))}
              </span>
            </div>
          </div>

          {order.paymentHistory?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Lịch sử thanh toán</h3>
              <div className="space-y-2">
                {order.paymentHistory.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-white ring-1 ring-gray-200 px-3 py-2 text-sm">
                    <div>
                      <div className="font-medium text-gray-800">{fmt(p.amount)}</div>
                      <div className="text-xs text-gray-500">
                        {p.method || "—"} • {fmtDate(p.date)}
                      </div>
                      {p.note && <div className="text-xs text-gray-600 mt-0.5">{p.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.note && (
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Ghi chú</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.note}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Đóng
          </button>
          {!isPaid && onPay && (
            <button
              onClick={() => onPay(order)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              Thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
