import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </div>
    );

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCollected = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalDebt = debts.reduce((sum, d) => sum + d.totalDebt, 0);
  const customersWithDebt = debts.filter((d) => d.totalDebt > 0);

  // Today's orders
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  // Recent orders (last 10)
  const recentOrders = orders.slice(0, 10);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Today */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Đơn hàng hôm nay</p>
          <p className="text-2xl font-bold text-gray-800">{todayOrders.length}</p>
          <p className="text-sm text-gray-400 mt-1">
            {todayRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>

        {/* Total orders */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-indigo-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
          <p className="text-sm text-gray-400 mt-1">
            {totalRevenue.toLocaleString("vi-VN")}đ
          </p>
        </div>

        {/* Collected */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-green-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Đã thu</p>
          <p className="text-2xl font-bold text-green-600">
            {totalCollected.toLocaleString("vi-VN")}đ
          </p>
        </div>

        {/* Debt */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-5">
          <p className="text-sm font-medium text-gray-500 mb-1">Tổng công nợ</p>
          <p
            className={`text-2xl font-bold ${
              totalDebt > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {totalDebt.toLocaleString("vi-VN")}đ
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {customersWithDebt.length} khách còn nợ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers with debt */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Khách hàng còn nợ</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">
                    Còn nợ
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-center">
                    Chi tiết
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customersWithDebt.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      Không có khách nợ
                    </td>
                  </tr>
                ) : (
                  customersWithDebt.map((d) => (
                    <tr
                      key={d.customer._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {d.customer.name}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            d.customer.type === "cong_trinh"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {d.customer.type === "cong_trinh"
                            ? "Công trình"
                            : "Lẻ"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-red-600 font-semibold">
                        {d.totalDebt.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `/admin/customers/${d.customer._id}/debt`
                            )
                          }
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

        {/* Recent orders */}
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
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">
                    Tổng tiền
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-5 py-8 text-center text-gray-400"
                    >
                      Chưa có đơn hàng
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const isPaid = order.paidAmount >= order.totalAmount;
                    return (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {order.customer?.name || "Vãng lai"}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-800">
                          {order.totalAmount?.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isPaid
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isPaid ? "Đã trả" : "Còn nợ"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
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
