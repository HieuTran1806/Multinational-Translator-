import { useState } from 'react';
import { sellerReportsApi } from '../api/endpoints.js';
import UsageSummary, { RangePicker } from '../components/UsageSummary.jsx';

/** UC13 — the Seller's own usage and QR statistics; the backend scopes everything to the session. */
const fetchSummary = (range) => sellerReportsApi.summary(range);

export default function SellerReportsPage() {
  const [rangeState, setRangeState] = useState({});
  return (
    <div className="space-y-6">
      <RangePicker rangeState={rangeState} setRangeState={setRangeState} />
      <UsageSummary
        title="Báo cáo của tôi"
        subtitle="Thống kê mức sử dụng gắn với mã QR của bạn (dữ liệu của chính bạn)"
        fetchSummary={fetchSummary}
        rangeState={rangeState}
      />
    </div>
  );
}
