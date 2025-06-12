import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoginModal from "../Auth/LoginModal";

const categories = [
  "Điện thoại",
  "Laptop",
  "Phụ kiện",
  "Đồng hồ",
];

const Header = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLoginSuccess = (userData) => {
    if (userData.user.role === 'admin') {
      navigate('/admin/dashboard');
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      {/* Line 1 */}
      <div>
        {/* Logo */}
        <div>
          LOGO MINHTHO
        </div>
        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="px-4 py-2 rounded w-full max-w-md"
          />
          <button>Tim kiem</button>
        </div>
        {/* User Actions */}
        <div>
          {!user ? (
            <div>
              <button
              onClick={() => setShowModal(true)}
              >
                Dang nhap
              </button>
            </div>
          ):(
            <div
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span>{user.user.name}</span>
              {showDropdown && (
                <div>
                  <button>Thong tin tai khoan</button>
                  <button>Lich su don hang</button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    Dang xuat
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Line 2 */}
      <nav>
        {categories.map((category, index) => (
          <button
            key={index}
          >
            {category}
          </button>
        ))}
      </nav>
      {/* Login Modal */}
      <LoginModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </header>
  );
}
export default Header;