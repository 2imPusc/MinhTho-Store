import { useState, useEffect } from "react";
import productService from "../services/productService";

const emptyForm = {
  code: "",
  name: "",
  price: "",
  importPrice: "",
  unit: "",
  imageUrl: "",
  location: "",
  category: "",
  description: "",
  stockQty: "",
  lowStockThreshold: "",
  supplierId: "",
};

const ProductForm = ({ product, onClose, onSuccess }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = Boolean(product);

  useEffect(() => {
    if (product) {
      setForm({
        code: product.code || "",
        name: product.name || "",
        price: product.price ?? "",
        importPrice: product.importPrice ?? "",
        unit: product.unit || "",
        imageUrl: product.imageUrl || "",
        location: product.location || "",
        category: product.category || "",
        description: product.description || "",
        stockQty: product.stockQty ?? "",
        lowStockThreshold: product.lowStockThreshold ?? "",
        supplierId: product.supplier?._id || "",
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await productService.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      setErrors([err.response?.data?.message || "Upload thất bại"]);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        importPrice: Number(form.importPrice),
      };

      if (form.stockQty === "" || form.stockQty === null) delete payload.stockQty;
      else payload.stockQty = Number(form.stockQty);
      if (form.lowStockThreshold === "" || form.lowStockThreshold === null) delete payload.lowStockThreshold;
      else payload.lowStockThreshold = Number(form.lowStockThreshold);

      // Remove empty optional fields
      if (!payload.supplierId) delete payload.supplierId;
      if (!payload.imageUrl) delete payload.imageUrl;

      if (isEdit) {
        await productService.update(product._id, payload);
      } else {
        await productService.create(payload);
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
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

          <div className="grid grid-cols-2 gap-4">
            {/* Mã sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mã sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="VD: DN001"
              />
            </div>

            {/* Tên sản phẩm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="VD: Ống nước PVC 21mm"
              />
            </div>

            {/* Giá bán */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Giá bán <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="0"
              />
            </div>

            {/* Giá nhập */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Giá nhập <span className="text-red-500">*</span>
              </label>
              <input
                name="importPrice"
                type="number"
                min="0"
                value={form.importPrice}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="0"
              />
            </div>

            {/* Đơn vị */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn vị</label>
              <input
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="VD: cây, mét, cái, bao"
              />
            </div>

            {/* Vị trí lấy hàng */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vị trí lấy hàng
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="VD: Kệ A3, Tầng 2"
              />
            </div>

            {/* Danh mục */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Danh mục
              </label>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="VD: Ống nước, Dây điện"
              />
            </div>

            {/* Tồn kho */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tồn kho
              </label>
              <input
                name="stockQty"
                type="number"
                min="0"
                value={form.stockQty}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="0"
              />
            </div>

            {/* Ngưỡng cảnh báo sắp hết */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ngưỡng cảnh báo
              </label>
              <input
                name="lowStockThreshold"
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                placeholder="10"
              />
            </div>

            {/* Ảnh sản phẩm */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ảnh sản phẩm
              </label>
              <div className="flex items-start gap-3">
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <input
                    name="imageUrl"
                    value={form.imageUrl}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Hoặc nhập URL..."
                  />
                  {uploading && (
                    <p className="text-xs text-blue-600">Đang upload...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow resize-none"
              placeholder="Mô tả thêm về sản phẩm..."
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

export default ProductForm;
