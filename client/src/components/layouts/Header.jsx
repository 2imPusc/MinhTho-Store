import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
    navigate("/");
  };

  const roleBadge = (role) => {
    const styles = {
      admin: "bg-red-50 text-red-600 border-red-200",
      staff: "bg-blue-50 text-blue-600 border-blue-200",
      user: "bg-gray-50 text-gray-500 border-gray-200",
    };
    const labels = { admin: "Admin", staff: "Nhân viên", user: "Khách hàng" };
    return (
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${styles[role] || styles.user}`}
      >
        {labels[role] || role}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-2">
        {/* Logo */}
        <Link to="/" className="flex flex-col leading-tight hover:opacity-80 transition-opacity">
          <span className="text-xl font-bold text-slate-800 tracking-wide">
            MINH THO
          </span>
          <span className="text-xs text-gray-400 -mt-0.5">Điện Nước</span>
        </Link>

        {/* User Actions */}
        <div className="flex items-center">
          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-sm font-medium text-slate-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="w-8 h-8 bg-slate-700 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                  {user.user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user.user.name}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              <div
                className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 transition-all duration-200 origin-top-right ${
                  showDropdown
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {/* User info */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{user.user.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {roleBadge(user.user.role)}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  {user.user.role === "admin" && (
                    <button
                      onClick={() => {
                        navigate("/admin/products");
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Quản trị
                    </button>
                  )}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
