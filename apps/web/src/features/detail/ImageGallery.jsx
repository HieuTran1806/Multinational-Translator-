import { useState } from 'react';
import { mediaUrl } from '../../api/client.js';

/**
 * UC04 image gallery: cover + additional images from the POI detail. A failed image shows a
 * placeholder instead of breaking the page (E2 applies to a single resource, not the whole page).
 */
export default function ImageGallery({ images, alt }) {
  const list = images?.filter(Boolean) ?? [];
  const [selected, setSelected] = useState(0);
  const [broken, setBroken] = useState({});
  const current = list[Math.min(selected, list.length - 1)];

  if (list.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl bg-sand/70 text-sm text-earth">
        Địa điểm này chưa có hình ảnh.
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      {broken[selected] ? (
        <div
          role="img"
          aria-label="Không tải được hình ảnh"
          className="flex h-56 items-center justify-center rounded-xl bg-sand/70 text-sm text-earth"
        >
          Không tải được hình ảnh.
        </div>
      ) : (
        <img
          src={mediaUrl(current)}
          alt={alt}
          className="h-56 w-full rounded-xl object-cover sm:h-72"
          onError={() => setBroken((b) => ({ ...b, [selected]: true }))}
        />
      )}
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Chọn hình ảnh">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Xem hình ${i + 1}`}
              aria-pressed={i === selected}
              className={`shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === selected ? 'ring-olive' : 'ring-transparent hover:ring-stone/40'
              }`}
            >
              <img src={mediaUrl(src)} alt="" loading="lazy" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
