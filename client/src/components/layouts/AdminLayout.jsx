import { NavLink, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import orderService from "../../services/orderService";
import paymentService from "../../services/paymentService";
import productService from "../../services/productService";

const tabs = [
  {
    to: "/admin/products",
    label: "Sản phẩm",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
  },
  {
    to: "/admin/orders",
    label: "Đơn hàng",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
  },
  {
    to: "/admin/customers",
    label: "Khách hàng",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
];

const formatCurrency = (amount) => {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + "k";
  }
  return amount.toLocaleString("vi-VN");
};

const AdminLayout = () => {
  const [stats, setStats] = useState({
    productCount: 0,
    orderCount: 0,
    totalCollected: 0,
    totalDebt: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsRes, ordersRes, debtsRes] = await Promise.all([
          productService.getAll(),
          orderService.getAll(),
          paymentService.getAllDebts(),
        ]);

        const products = productsRes.data || [];
        const orders = ordersRes.data || [];
        const debts = debtsRes.data || [];

        const totalCollected = orders.reduce(
          (sum, order) => sum + (order.paidAmount || 0),
          0
        );
        const totalDebt = debts.reduce(
          (sum, debt) => sum + (debt.totalDebt || 0),
          0
        );

        setStats({
          productCount: products.length,
          orderCount: orders.length,
          totalCollected,
          totalDebt,
        });
      } catch (error) {
        console.error("Lỗi khi tải thống kê:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Stats bar */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
              <span className="text-slate-400">Sản phẩm:</span>
              <span className="font-semibold">{stats.productCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
              </svg>
              <span className="text-slate-400">Đơn hàng:</span>
              <span className="font-semibold">{stats.orderCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-slate-400">Đã thu:</span>
              <span className="font-semibold text-emerald-400">
                {formatCurrency(stats.totalCollected)}đ
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span className="text-slate-400">Công nợ:</span>
              <span className="font-semibold text-red-400">
                {formatCurrency(stats.totalDebt)}đ
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <nav className="max-w-5xl mx-auto px-4 flex">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={false}
              className={({ isActive }) =>
                `flex-1 flex items-center justify-center gap-2.5 px-8 py-4 text-base font-medium transition-colors border-b-[3px] ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
            >
              {tab.icon}
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Content area */}
      <main className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
