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
        <Route path="/pois" element={<PoiListPage />} />
        <Route path="/pois/new" element={<PoiEditPage />} />
        <Route path="/pois/:id" element={<PoiEditPage />} />
        <Route path="*" element={<p className="text-stone">Không tìm thấy trang.</p>} />
      </Route>
    </Routes>
  );
}
