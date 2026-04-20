import './App.css'
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/layouts/Header';
import AdminLayout from './components/layouts/AdminLayout';
import ProductManagement from './pages/admin/ProductManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import OrderManagement from './pages/admin/OrderManagement';
import OrderCreate from './pages/admin/OrderCreate';
import CustomerDebt from './pages/admin/CustomerDebt';
import SupplierManagement from './pages/admin/SupplierManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import Dashboard from './pages/Dashboard';

function App() {
  const { user } = useAuth();
  const isAdmin = user && user.user.role === 'admin';

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={isAdmin ? <Navigate to="/admin/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={user ? <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace /> : <RegisterPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={isAdmin ? <AdminLayout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<ProductManagement />} />
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="customers/:customerId/debt" element={<CustomerDebt />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="orders/create" element={<OrderCreate />} />
          <Route path="suppliers" element={<SupplierManagement />} />
          <Route path="payments" element={<PaymentManagement />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
