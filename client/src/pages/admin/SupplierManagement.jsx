import { useState, useEffect, useMemo } from "react";
import supplierService from "../../services/supplierService";
import SupplierForm from "../../components/SupplierForm";
import Pagination from "../../components/Pagination";

const PAGE_SIZE = 20;

const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierService.getAll();
      setSuppliers(res.data || []);
    } catch {
      setError("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useMemo(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) return;
    try {
      await supplierService.delete(id);
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
    } catch {
      setError("Xóa nhà cung cấp thất bại");
    }
  };

  const handleEdit = (supplier) => {
    setEditing(supplier);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchSuppliers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{filtered.length}</span> / {suppliers.length} nhà cung cấp
          {filtered.length !== suppliers.length && <span className="text-blue-600"> (đang lọc)</span>}
        </p>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm nhà cung cấp
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm theo tên, SĐT, địa chỉ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SĐT</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Địa chỉ</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Thanh toán</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ghi chú</th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-16 text-center text-gray-400">
                  Không tìm thấy nhà cung cấp nào
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{s.phone || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-500">{s.address || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-500 max-w-[200px] truncate">{s.paymentInfo || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-400 max-w-[200px] truncate">{s.note || "-"}</td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(s)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />

      {showForm && (
        <SupplierForm supplier={editing} onClose={handleFormClose} onSuccess={handleFormSuccess} />
      )}
    </div>
  );
};

export default SupplierManagement;
