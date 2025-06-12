import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const LoginModal = ({ show, onClose, onSuccess }) => {
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useAuth();
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const userData = await login(phone, password);
            onSuccess && onSuccess(userData);
            onClose();
        } catch (err) {
            setError(err.message || "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.");
        }
    };

    if (!show) return null;

    return (
        <div>
            <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                onClick={onClose}
            >
                &times;
            </button>
            <h2>Đăng nhập</h2>
            <form onSubmit={handleLogin}>
                <input 
                    name="phone"
                    type="text"
                    placeholder="Số điện thoại"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)} 
                />
                <input 
                    name="password"
                    type="password"
                    placeholder="Mật khẩu"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                { error && <p className="text-red-500">{error}</p> }
                <button type="submit">Đăng nhập</button>
            </form>
        </div>
    )
}

export default LoginModal;