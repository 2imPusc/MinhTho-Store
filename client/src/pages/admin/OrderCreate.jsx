import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import productService from "../../services/productService";
import customerService from "../../services/customerService";
import orderService from "../../services/orderService";

const OrderCreate = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [cart, setCart] = useState([]); // [{product, quantity}]
  const [productSearch, setProductSearch] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Tien mat");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getAll(),
          productService.getAll(),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const s = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.phone && c.phone.includes(s))
    );
  }, [customers, customerSearch]);

  // Filter products (exclude already in cart)
  const cartProductIds = useMemo(() => new Set(cart.map((c) => c.product._id)), [cart]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const s = productSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          !cartProductIds.has(p._id) &&
          (p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s))
      )
      .slice(0, 10);
  }, [products, productSearch, cartProductIds]);

  // Cart helpers
  const addToCart = (product) => {
    setCart((prev) => [...prev, { product, quantity: 1 }]);
    setProductSearch("");
  };

  const updateQuantity = (index, qty) => {
    const val = Math.max(1, parseInt(qty) || 1);
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, quantity: val } : item)));
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Vui lòng thêm ít nhất 1 sản phẩm");
      return;
    }

    const paid = Number(paidAmount) || 0;
    if (paid > totalAmount) {
      setError("Số tiền trả không được vượt quá tổng tiền");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomerId || undefined,
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
        })),
        paidAmount: paid,
        paymentMethod,
        paymentNote: paid > 0 ? "Thanh toán khi tạo đơn" : "",
        note,
      };

      await orderService.create(payload);
      navigate("/admin/orders");
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
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
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Tạo đơn hàng mới</h2>
        <p className="mt-1 text-sm text-gray-500">Điền thông tin bên dưới để tạo đơn hàng</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Khách hàng */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Khách hàng</h3>
          </div>
          <div className="p-5">
            {!selectedCustomerId ? (
              <>
                <div className="relative">
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
                    placeholder="Tìm khách hàng theo tên hoặc SĐT..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (!e.target.value) setSelectedCustomerId("");
                    }}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {customerSearch && filteredCustomers.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 shadow-sm">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c._id);
                          setCustomerSearch(c.name + (c.phone ? ` - ${c.phone}` : ""));
                        }}
                        className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm transition last:border-b-0 hover:bg-blue-50"
                      >
                        <div className="flex-1 text-left">
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          {c.phone && (
                            <span className="ml-2 text-gray-400">{c.phone}</span>
                          )}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            c.type === "cong_trinh"
                              ? "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20"
                              : "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                          }`}
                        >
                          {c.type === "cong_trinh" ? "Công trình" : "Lẻ"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  Có thể bỏ trống nếu là khách vãng lai
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-900">{customerSearch}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId("");
                    setCustomerSearch("");
                  }}
                  className="rounded-md px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Bỏ chọn
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Sản phẩm */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Sản phẩm</h3>
          </div>
          <div className="p-5">
            {/* Product search */}
            <div className="relative">
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
                placeholder="Tìm sản phẩm theo tên hoặc mã..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Product dropdown */}
            {productSearch && filteredProducts.length > 0 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-200 shadow-sm">
                {filteredProducts.map((p) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addToCart(p)}
                    className="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-sm transition last:border-b-0 hover:bg-blue-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
                        {p.code}
                      </span>
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {p.location && (
                        <span className="text-xs text-gray-400">({p.location})</span>
                      )}
                    </div>
                    <span className="font-semibold text-blue-600">
                      {p.price?.toLocaleString("vi-VN")}đ/{p.unit || "cái"}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Cart table */}
            {cart.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                        Sản phẩm
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 w-20">
                        Vị trí
                      </th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 w-24">
                        SL
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 w-28">
                        Đơn giá
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 w-32">
                        Thành tiền
                      </th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cart.map((item, idx) => (
                      <tr key={item.product._id} className="transition hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <span className="mr-1.5 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
                            {item.product.code}
                          </span>
                          <span className="text-gray-900">{item.product.name}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {item.product.location || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(idx, e.target.value)}
                            className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-center text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {item.product.price?.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {(item.product.price * item.quantity)?.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="rounded-md p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                      <td colSpan="4" className="px-4 py-3 text-right text-sm font-bold text-gray-700">
                        Tổng cộng:
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold text-blue-600">
                        {totalAmount.toLocaleString("vi-VN")}đ
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {cart.length === 0 && (
              <div className="mt-4 flex flex-col items-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
                <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="mt-2 text-sm text-gray-400">Chưa có sản phẩm nào trong đơn hàng</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Thanh toán */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Thanh toán</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Số tiền trả
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalAmount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0 = ghi nợ toàn bộ"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Phương thức
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Tien mat">Tiền mặt</option>
                  <option value="Chuyen khoan">Chuyển khoản</option>
                </select>
              </div>
            </div>

            {totalAmount > 0 && (
              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tổng đơn:</span>
                    <span className="font-semibold text-gray-900">
                      {totalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Trả trước:</span>
                    <span className="font-semibold text-green-600">
                      {(Number(paidAmount) || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Còn nợ:</span>
                      <span className="text-base font-bold text-red-600">
                        {Math.max(0, totalAmount - (Number(paidAmount) || 0)).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Ghi chú */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Ghi chú</h3>
          </div>
          <div className="p-5">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ghi chú thêm cho đơn hàng..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || cart.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {submitting ? "Đang tạo..." : "Tạo đơn hàng"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderCreate;
