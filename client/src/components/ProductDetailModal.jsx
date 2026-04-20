import { useState } from "react";
import InfoModal from "./InfoModal";

const fmt = (n) => (n ?? 0).toLocaleString("vi-VN") + "đ";

export default function ProductDetailModal({ product, onClose, onEdit, onDelete }) {
  const [showSupplier, setShowSupplier] = useState(false);
  if (!product) return null;

  const qty = product.stockQty ?? 0;
  const threshold = product.lowStockThreshold ?? 10;
  const stockCls =
    qty <= 0
      ? "bg-red-50 text-red-700 ring-red-600/20"
      : qty <= threshold
      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
      : "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

  const supplier = product.supplier;

  const supplierCell = supplier?.name ? (
    <button
      onClick={() => setShowSupplier(true)}
      className="text-blue-700 hover:text-blue-900 hover:underline"
    >
      {supplier.name}
    </button>
  ) : "-";

  const rows = [
    ["Mã SP", product.code],
    ["Tên", product.name],
    ["Danh mục", product.category || "-"],
    ["Đơn vị", product.unit || "-"],
    ["Giá bán", fmt(product.price)],
    ["Giá nhập", fmt(product.importPrice)],
    ["Tồn kho", "__STOCK__"],
    ["Ngưỡng cảnh báo", product.lowStockThreshold ?? 10],
    ["Vị trí", product.location || "-"],
    ["Nhà cung cấp", supplierCell],
    ["Ghi chú", product.note || "-"],
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h3 className="text-lg font-bold text-gray-900">Chi tiết sản phẩm</h3>
            <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="px-6 py-4">
            {product.imageUrl ? (
              <div className="mb-4 flex justify-center">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-56 rounded-lg border border-gray-200 object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            ) : (
              <div className="mb-4 flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
                Chưa có ảnh
              </div>
            )}
            <dl className="divide-y divide-gray-100">
              {rows.map(([label, value]) => (
                <div key={label} className="grid grid-cols-3 gap-3 py-2.5 text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="col-span-2 font-medium text-gray-900">
                    {value === "__STOCK__" ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${stockCls}`}>
                        {qty} {product.unit || ""}
                      </span>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-3">
            <button onClick={onClose} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
              Đóng
            </button>
            {onDelete && (
              <button onClick={onDelete} className="rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                Xóa
              </button>
            )}
            {onEdit && (
              <button onClick={onEdit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Sửa
              </button>
            )}
          </div>
        </div>
      </div>

      <InfoModal
        open={showSupplier && !!supplier}
        title="Thông tin nhà cung cấp"
        rows={supplier ? [
          ["Tên", supplier.name],
          ["SĐT", supplier.phone || "-"],
          ["Địa chỉ", supplier.address || "-"],
          ["Thanh toán", supplier.paymentInfo || "-"],
          ["Ghi chú", supplier.note || "-"],
        ] : []}
        onClose={() => setShowSupplier(false)}
        footer={<button onClick={() => setShowSupplier(false)} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Đóng</button>}
      />
    </>
  );
}
