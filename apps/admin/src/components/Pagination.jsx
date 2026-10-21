import { Button } from './ui.jsx';

export default function Pagination({ page, totalPages, totalItems, onChange }) {
  if (totalPages <= 1) {
    return <p className="text-sm text-stone">{totalItems} địa điểm</p>;
  }
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-2 text-sm">
      <span className="text-stone">
        Trang {page + 1}/{totalPages} · {totalItems} địa điểm
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 0} onClick={() => onChange(page - 1)}>
          ‹ Trước
        </Button>
        <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
          Sau ›
        </Button>
      </div>
    </nav>
  );
}
