import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RegisterPage = () => {
    const [form, setForm] = useState({ name: "", phone: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (form.password !== form.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setLoading(true);
        try {
            await register({
                name: form.name,
                phone: form.phone || undefined,
                password: form.password,
            });
            navigate("/");
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.errors?.join(", ") || data?.message || "Đăng ký thất bại";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Đăng ký tài khoản
                </h2>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ tên <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Nhập họ tên"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="phone"
                            placeholder="Nhập số điện thoại"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Ít nhất 6 ký tự"
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Xác nhận mật khẩu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {loading ? "Đang đăng ký..." : "Đăng ký"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className="text-blue-600 hover:underline font-medium">
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
