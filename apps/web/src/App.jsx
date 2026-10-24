import { Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ExplorePage from './features/explore/ExplorePage.jsx';
import PoiDetailPage from './features/detail/PoiDetailPage.jsx';

/** UC03–UC05: the visitor-facing routes. All backend endpoints used here are public. */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ExplorePage />} />
        <Route path="/pois/:id" element={<PoiDetailPage />} />
        <Route
          path="*"
          element={
            <div className="mx-auto max-w-xl p-8">
              <h1 className="text-xl font-bold text-forest">Không tìm thấy trang</h1>
              <a href="/" className="mt-2 inline-block text-sm font-semibold text-olive underline">
                Về trang khám phá
              </a>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
