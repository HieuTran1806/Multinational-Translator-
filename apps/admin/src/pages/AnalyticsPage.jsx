import { useState } from 'react';
import { analyticsApi } from '../api/endpoints.js';
import UsageSummary, { RangePicker } from '../components/UsageSummary.jsx';

/** UC14 — system-wide analytics for Admin only. */
const fetchSummary = (range) => analyticsApi.summary(range);

export default function AnalyticsPage() {
  const [rangeState, setRangeState] = useState({});
  const [reloadToken, setReloadToken] = useState(0);
  return (
    <div className="space-y-6">
      <RangePicker
        rangeState={rangeState}
        setRangeState={setRangeState}
        onReload={() => setReloadToken((n) => n + 1)}
      />
      <UsageSummary
        title="Analytics toàn hệ thống"
        subtitle="Số liệu sử dụng tổng hợp từ backend, theo khoảng thời gian đã chọn"
        fetchSummary={fetchSummary}
        rangeState={rangeState}
        reloadToken={reloadToken}
      />
    </div>
  );
}
