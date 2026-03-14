import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import customerService from "../../services/customerService";
import CustomerForm from "../../components/CustomerForm";

const typeLabels = {
  le: "Khách lẻ",
  cong_trinh: "Công trình",
};

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getAll();
      setCustomers(res.data);
    } catch (err) {
      setError("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.includes(search));
      const matchType = !typeFilter || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [customers, search, typeFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa khách hàng này?")) return;
    try {
      await customerService.delete(id);
      setCustomers((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError("Xóa khách hàng thất bại");
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    fetchCustomers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-gray-500 text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h2>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm khách hàng
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow bg-white"
        >
          <option value="">Tất cả</option>
          <option value="le">Khách lẻ</option>
          <option value="cong_trinh">Công trình</option>
        </select>
      </div>

      {/* Customer count */}
      <p className="text-sm text-gray-500">
        Hiển thị <span className="font-semibold text-gray-700">{filtered.length}</span> / {customers.length} khách hàng
      </p>

      {/* Customer table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tên</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SĐT</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Địa chỉ</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loại</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ghi chú</th>
              <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-400 font-medium">Không tìm thấy khách hàng nào</p>
                    <p className="text-gray-300 text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-gray-900">{customer.name}</td>
                  <td className="px-4 py-3.5 text-gray-500 font-mono text-xs">{customer.phone || "-"}</td>
                  <td className="px-4 py-3.5 text-gray-500">{customer.address || "-"}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.type === "cong_trinh"
                          ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                      }`}
                    >
                      {typeLabels[customer.type] || customer.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 max-w-[200px] truncate">
                    {customer.note || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/customers/${customer._id}/debt`)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        Công nợ
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
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

      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default CustomerManagement;
