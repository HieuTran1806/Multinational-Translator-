import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PoiListPage from './pages/PoiListPage.jsx';
import PoiEditPage from './pages/PoiEditPage.jsx';
import AccessQrPage from './pages/AccessQrPage.jsx';
import SellersPage from './pages/SellersPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import SellerReportsPage from './pages/SellerReportsPage.jsx';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RequireRole({ roles, title, message, children }) {
  const { account } = useAuth();
  if (roles.includes(account?.role)) return children;
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 ring-1 ring-stone/15">
      <h1 className="text-xl font-bold text-forest">{title}</h1>
      <p className="mt-2 text-sm text-stone">{message}</p>
    </div>
  );
}

const ADMIN_ONLY = {
  roles: ['ADMIN'],
  title: 'Không đủ quyền truy cập',
  message:
    'Chỉ tài khoản Admin mới được quản lý nội dung và Seller. Backend cũng từ chối mọi vai trò khác (403).',
};
const ADMIN_OR_SUPER = {
  roles: ['ADMIN', 'SUPER_ADMIN'],
  title: 'Không đủ quyền truy cập',
  message: 'Analytics chỉ dành cho Admin và Super Admin.',
};
const SUPER_ONLY = {
  roles: ['SUPER_ADMIN'],
  title: 'Không đủ quyền truy cập',
  message: 'Audit Log chỉ dành cho Super Admin (UC15).',
};

function HomeRedirect() {
  const { account } = useAuth();
  return <Navigate to={account?.role === 'SELLER' ? '/reports' : '/pois'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        {/* UC07: POI content — ADMIN only, enforced by the backend too. */}
        <Route
          path="/pois"
          element={
            <RequireRole {...ADMIN_ONLY}>
              <PoiListPage />
            </RequireRole>
          }
        />
        <Route
          path="/pois/new"
          element={
            <RequireRole {...ADMIN_ONLY}>
              <PoiEditPage />
            </RequireRole>
          }
        />
        <Route
          path="/pois/:id"
          element={
            <RequireRole {...ADMIN_ONLY}>
              <PoiEditPage />
            </RequireRole>
          }
        />
        <Route
          path="/access-qrs"
          element={
            <RequireRole {...ADMIN_ONLY}>
              <AccessQrPage />
            </RequireRole>
          }
        />
        {/* UC09: seller management — ADMIN only (Super Admin must not manage Sellers). */}
        <Route
          path="/sellers"
          element={
            <RequireRole {...ADMIN_ONLY}>
              <SellersPage />
            </RequireRole>
          }
        />
        {/* UC14: analytics — ADMIN + SUPER_ADMIN. */}
        <Route
          path="/analytics"
          element={
            <RequireRole {...ADMIN_OR_SUPER}>
              <AnalyticsPage />
            </RequireRole>
          }
        />
        {/* UC15: audit log — SUPER_ADMIN only. */}
        <Route
          path="/audit"
          element={
            <RequireRole {...SUPER_ONLY}>
              <AuditLogPage />
            </RequireRole>
          }
        />
        {/* UC13: the seller's own reports. */}
        <Route path="/reports" element={<SellerReportsPage />} />
        <Route path="*" element={<p className="text-stone">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
