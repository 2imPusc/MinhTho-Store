import { useState, useEffect } from "react";
import customerService from "../services/customerService";

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  type: "le",
  note: "",
};

const CustomerForm = ({ customer, onClose, onSuccess }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(customer);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        address: customer.address || "",
        type: customer.type || "le",
        note: customer.note || "",
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      if (isEdit) {
        await customerService.update(customer._id, form);
      } else {
        await customerService.create(form);
      }
      onSuccess();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setErrors([data?.message || "Có lỗi xảy ra"]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {isEdit ? "Sửa khách hàng" : "Thêm khách hàng mới"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errors.map((err, i) => (
                <p key={i} className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {err}
                </p>
              ))}
            </div>
          )}

          {/* Tên khách hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên khách hàng <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              placeholder="VD: Anh Tuấn / Công trình Nhà A"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Số điện thoại
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              placeholder="0901234567"
            />
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Địa chỉ</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
              placeholder="VD: 123 Nguyễn Trãi, Q5"
            />
          </div>

          {/* Loại khách hàng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Loại khách hàng
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow bg-white"
            >
              <option value="le">Khách lẻ</option>
              <option value="cong_trinh">Công trình</option>
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow resize-none"
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang lưu...
                </span>
              ) : isEdit ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
