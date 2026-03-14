import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    navigate("/");
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      {/* Line 1 */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-wide hover:opacity-90">
          MINH THO STORE
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg mx-8">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 border border-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                  {user.user.name.charAt(0).toUpperCase()}
                </span>
                <span className="font-medium">{user.user.name}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg py-1 z-50">
                  {user.user.role === "admin" && (
                    <button
                      onClick={() => { navigate("/admin/dashboard"); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 font-medium text-blue-600"
                    >
                      Quản trị
                    </button>
                  )}
                  <button
                    onClick={() => { setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Thông tin tài khoản
                  </button>
                  <button
                    onClick={() => { setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Lịch sử đơn hàng
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
