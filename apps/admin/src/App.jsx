import { Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PoiListPage from './pages/PoiListPage.jsx';
import PoiEditPage from './pages/PoiEditPage.jsx';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/** UC07 actor is ADMIN only: SUPER_ADMIN manages accounts/RBAC/audit, never POI content. Backend enforces this too. */
function RequirePoiAdmin({ children }) {
  const { account } = useAuth();
  if (account?.role === 'ADMIN') return children;
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 ring-1 ring-stone/15">
      <h1 className="text-xl font-bold text-forest">Không đủ quyền truy cập</h1>
      <p className="mt-2 text-sm text-stone">
        Tài khoản {account?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'hiện tại'} không có quyền quản lý POI. Chỉ tài
        khoản Admin mới được tạo, sửa nội dung và quản lý hình ảnh/audio.
      </p>
    </div>
  );
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
        <Route index element={<Navigate to="/pois" replace />} />
        <Route
          path="/pois"
          element={
            <RequirePoiAdmin>
              <PoiListPage />
            </RequirePoiAdmin>
          }
        />
        <Route
          path="/pois/new"
          element={
            <RequirePoiAdmin>
              <PoiEditPage />
            </RequirePoiAdmin>
          }
        />
        <Route
          path="/pois/:id"
          element={
            <RequirePoiAdmin>
              <PoiEditPage />
            </RequirePoiAdmin>
          }
        />
        <Route path="*" element={<p className="text-stone">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
