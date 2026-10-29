import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PoiListPage from './pages/PoiListPage.jsx';
import PoiEditPage from './pages/PoiEditPage.jsx';
import AccessQrPage from './pages/AccessQrPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import AdminAccountsPage from './pages/AdminAccountsPage.jsx';

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
    'Chỉ tài khoản Admin mới được quản lý nội dung. Backend cũng từ chối mọi vai trò khác (403).',
};
const ADMIN_ANALYTICS_ONLY = {
  roles: ['ADMIN'],
  title: 'Không đủ quyền truy cập',
  message: 'Analytics chỉ dành cho Admin.',
};
const SUPER_ONLY = {
  roles: ['SUPER_ADMIN'],
  title: 'Không đủ quyền truy cập',
  message: 'Audit Log chỉ dành cho Super Admin (UC15).',
};
const ACCOUNTS_SUPER_ONLY = {
  roles: ['SUPER_ADMIN'],
  title: 'Không đủ quyền truy cập',
  message: 'Quản lý tài khoản Admin chỉ dành cho Super Admin (UC10). Backend cũng trả 403 cho vai trò khác.',
};

function HomeRedirect() {
  const { account } = useAuth();
  if (account?.role === 'SUPER_ADMIN') return <Navigate to="/accounts" replace />;
  return <Navigate to="/pois" replace />;
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
        {/* UC14: analytics — ADMIN only. */}
        <Route
          path="/analytics"
          element={
            <RequireRole {...ADMIN_ANALYTICS_ONLY}>
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
        {/* UC10: admin account management — SUPER_ADMIN only. */}
        <Route
          path="/accounts"
          element={
            <RequireRole {...ACCOUNTS_SUPER_ONLY}>
              <AdminAccountsPage />
            </RequireRole>
          }
        />
        <Route path="*" element={<p className="text-stone">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
