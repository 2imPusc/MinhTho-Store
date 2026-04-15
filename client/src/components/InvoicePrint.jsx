import { useEffect } from "react";

const formatCurrency = (n) => (n || 0).toLocaleString("vi-VN") + "đ";

const InvoicePrint = ({ order, onClose }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!order) return null;

  const remaining = (order.totalAmount || 0) - (order.paidAmount || 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:static print:bg-transparent print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-print, .invoice-print * { visibility: visible; }
          .invoice-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      <div className="invoice-print bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto print:rounded-none print:shadow-none print:max-h-none">
        {/* Toolbar */}
        <div className="no-print flex items-center justify-between px-6 py-3 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800">Hóa đơn bán hàng</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              In hóa đơn
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="p-10 text-gray-800">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold uppercase">Cửa hàng Vật liệu Xây dựng Minh Thọ</h1>
            <p className="text-sm text-gray-600 mt-1">ĐT liên hệ: — / Địa chỉ: —</p>
            <h2 className="text-xl font-bold mt-4 uppercase">Hóa đơn bán hàng</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-5">
            <div>
              <p><span className="font-semibold">Khách hàng:</span> {order.customer?.name || "Khách vãng lai"}</p>
              <p><span className="font-semibold">SĐT:</span> {order.customer?.phone || "-"}</p>
              <p><span className="font-semibold">Địa chỉ:</span> {order.customer?.address || "-"}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Mã đơn:</span> {order._id?.slice(-8).toUpperCase()}</p>
              <p><span className="font-semibold">Ngày:</span> {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse mb-5">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-gray-800">
                <th className="py-2 px-2 text-left">STT</th>
                <th className="py-2 px-2 text-left">Mã</th>
                <th className="py-2 px-2 text-left">Tên sản phẩm</th>
                <th className="py-2 px-2 text-center">ĐVT</th>
                <th className="py-2 px-2 text-right">SL</th>
                <th className="py-2 px-2 text-right">Đơn giá</th>
                <th className="py-2 px-2 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-2 px-2">{i + 1}</td>
                  <td className="py-2 px-2 font-mono text-xs">{item.product?.code || "-"}</td>
                  <td className="py-2 px-2">{item.product?.name || "-"}</td>
                  <td className="py-2 px-2 text-center">{item.product?.unit || "-"}</td>
                  <td className="py-2 px-2 text-right">{item.quantity}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(item.price)}</td>
                  <td className="py-2 px-2 text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-80 text-sm space-y-1.5">
              <div className="flex justify-between py-1 border-b">
                <span>Tổng tiền:</span>
                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Đã thanh toán:</span>
                <span className="text-green-700">{formatCurrency(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-800 text-base font-bold">
                <span>Còn lại:</span>
                <span className={remaining > 0 ? "text-red-600" : "text-green-700"}>
                  {formatCurrency(remaining)}
                </span>
              </div>
            </div>
          </div>

          {order.note && (
            <p className="mt-4 text-sm italic text-gray-600">Ghi chú: {order.note}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-16 text-center text-sm">
            <div>
              <p className="font-semibold">Khách hàng</p>
              <p className="text-xs text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
            </div>
            <div>
              <p className="font-semibold">Người bán</p>
              <p className="text-xs text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8 italic">
            Cảm ơn quý khách. Vui lòng kiểm tra hàng hóa trước khi nhận.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
