import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";

const RANGE_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 30, label: "30 ngày" },
  { value: 90, label: "90 ngày" },
];

const formatShortCurrency = (n) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "tr";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(n);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, debtsRes] = await Promise.all([
          orderService.getAll(),
          paymentService.getAllDebts(),
        ]);
        setOrders(ordersRes.data);
        setDebts(debtsRes.data);
      } catch (err) {
        // silent fail on dashboard
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalCollected = orders.reduce((s, o) => s + o.paidAmount, 0);
    const totalDebt = debts.reduce((s, d) => s + d.totalDebt, 0);
    const customersWithDebt = debts.filter((d) => d.totalDebt > 0);
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      (o) => new Date(o.createdAt).toDateString() === today
    );
    const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);
    return { totalRevenue, totalCollected, totalDebt, customersWithDebt, todayOrders, todayRevenue };
  }, [orders, debts]);

  // Revenue series: last N days, bucket theo ngày
  const revenueSeries = useMemo(() => {
    const now = new Date();
    const buckets = new Map();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, revenue: 0, collected: 0, count: 0 });
    }
    const cutoff = new Date(now);
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (rangeDays - 1));

    orders.forEach((o) => {
      const od = new Date(o.createdAt);
      if (od < cutoff) return;
      const key = od.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (!b) return;
      b.revenue += o.totalAmount || 0;
      b.collected += o.paidAmount || 0;
      b.count += 1;
    });
    return Array.from(buckets.values());
  }, [orders, rangeDays]);

  // Top products trong range
  const topProducts = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (rangeDays - 1));
    const map = new Map();
    orders.forEach((o) => {
      if (new Date(o.createdAt) < cutoff) return;
      (o.items || []).forEach((it) => {
        const id = it.product?._id || it.product;
        if (!id) return;
        const name = it.product?.name || "Sản phẩm";
        const cur = map.get(id) || { id, name, quantity: 0, revenue: 0 };
        cur.quantity += it.quantity || 0;
        cur.revenue += (it.price || 0) * (it.quantity || 0);
        map.set(id, cur);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ ...p, shortName: p.name.length > 18 ? p.name.slice(0, 17) + "…" : p.name }));
  }, [orders, rangeDays]);

  // Top debt customers
  const topDebtors = useMemo(() => {
    return [...stats.customersWithDebt]
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5)
      .map((d) => ({
        id: d.customer._id,
        name: d.customer.name,
        shortName: d.customer.name.length > 18 ? d.customer.name.slice(0, 17) + "…" : d.customer.name,
        debt: d.totalDebt,
      }));
  }, [stats.customersWithDebt]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [orders]
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Tổng quan</h2>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {RANGE_OPTIONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRangeDays(r.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                rangeDays === r.value ? "bg-white shadow-sm text-blue-700" : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Đơn hàng hôm nay</p>
          <p className="text-2xl font-bold text-gray-800">{stats.todayOrders.length}</p>
          <p className="text-sm text-gray-400 mt-1">{stats.todayRevenue.toLocaleString("vi-VN")}đ</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-indigo-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          <p className="text-sm text-gray-400 mt-1">{stats.totalRevenue.toLocaleString("vi-VN")}đ</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Đã thu</p>
          <p className="text-2xl font-bold text-green-600">{stats.totalCollected.toLocaleString("vi-VN")}đ</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng công nợ</p>
          <p className={`text-2xl font-bold ${stats.totalDebt > 0 ? "text-red-600" : "text-green-600"}`}>
            {stats.totalDebt.toLocaleString("vi-VN")}đ
          </p>
          <p className="text-sm text-gray-400 mt-1">{stats.customersWithDebt.length} khách còn nợ</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Doanh thu {rangeDays} ngày qua</h3>
          <p className="text-xs text-gray-500">Tổng: {revenueSeries.reduce((s, d) => s + d.revenue, 0).toLocaleString("vi-VN")}đ</p>
        </div>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={revenueSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatShortCurrency} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value, name) => [value.toLocaleString("vi-VN") + "đ", name === "revenue" ? "Doanh thu" : "Đã thu"]}
                labelFormatter={(l) => `Ngày ${l}`}
              />
              <Legend formatter={(v) => (v === "revenue" ? "Doanh thu" : "Đã thu")} />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two column: top products + top debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top 5 sản phẩm ({rangeDays} ngày)</h3>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Chưa có dữ liệu</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={formatShortCurrency} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="shortName" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => v.toLocaleString("vi-VN") + "đ"} labelFormatter={(l) => l} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Top 5 khách nợ</h3>
          {topDebtors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Không có khách nợ</p>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topDebtors} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={formatShortCurrency} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="shortName" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => v.toLocaleString("vi-VN") + "đ"} labelFormatter={(l) => l} />
                  <Bar dataKey="debt" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Two column: debt list + recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Khách hàng còn nợ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Loại</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Còn nợ</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.customersWithDebt.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-gray-400">Không có khách nợ</td>
                  </tr>
                ) : (
                  stats.customersWithDebt.slice(0, 8).map((d) => (
                    <tr key={d.customer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{d.customer.name}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            d.customer.type === "cong_trinh" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {d.customer.type === "cong_trinh" ? "Công trình" : "Lẻ"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-red-600 font-semibold">
                        {d.totalDebt.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => navigate(`/admin/customers/${d.customer._id}/debt`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Đơn hàng gần đây</h3>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">Tổng tiền</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-gray-400">Chưa có đơn hàng</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const isPaid = order.paidAmount >= order.totalAmount;
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-800">{order.customer?.name || "Vãng lai"}</td>
                        <td className="px-5 py-3 text-right font-medium text-gray-800">
                          {order.totalAmount?.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isPaid ? "Đã trả" : "Còn nợ"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
