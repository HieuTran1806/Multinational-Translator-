import { Link, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import RequireAccess from './access/RequireAccess.jsx';
import ScanPage from './features/access/ScanPage.jsx';
import ActivatePage from './features/access/ActivatePage.jsx';
import ExplorePage from './features/explore/ExplorePage.jsx';
import PoiDetailPage from './features/detail/PoiDetailPage.jsx';
import { useT } from './i18n/LanguageContext.jsx';

function NotFound() {
  const t = useT();
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-xl font-bold text-forest">{t('app.notFound')}</h1>
      <Link to="/" className="mt-2 inline-block text-sm font-semibold text-olive underline">
        {t('app.backToExplore')}
      </Link>
    </div>
  );
}

/**
 * Visitor routes. /welcome and /activate are open (UC02: scan + redeem the QR); every other feature
 * (UC03–UC05) sits behind RequireAccess and needs a valid, unexpired grant for this device.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/welcome" element={<ScanPage />} />
        <Route path="/activate" element={<ActivatePage />} />
        <Route element={<RequireAccess />}>
          <Route index element={<ExplorePage />} />
          <Route path="/pois/:id" element={<PoiDetailPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
