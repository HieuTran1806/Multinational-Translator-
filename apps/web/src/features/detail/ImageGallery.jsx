import { useState } from 'react';
import ProtectedImage from '../../components/ProtectedImage.jsx';
import { useT } from '../../i18n/LanguageContext.jsx';

/**
 * UC04 image gallery: cover + additional images from the POI detail. A failed image shows a
 * placeholder instead of breaking the page (E2 applies to a single resource, not the whole page).
 * Images need the UC02 grant, so they are downloaded with it (ProtectedImage) rather than via <img src>.
 */
export default function ImageGallery({ images, alt }) {
  const t = useT();
  const list = images?.filter(Boolean) ?? [];
  const [selected, setSelected] = useState(0);
  const [broken, setBroken] = useState({});
  const current = list[Math.min(selected, list.length - 1)];

  if (list.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl bg-sand/70 text-sm text-earth">
        {t('gallery.empty')}
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      {broken[selected] ? (
        <div
          role="img"
          aria-label={t('gallery.broken')}
          className="flex h-56 items-center justify-center rounded-xl bg-sand/70 text-sm text-earth"
        >
          {t('gallery.broken')}
        </div>
      ) : (
        <ProtectedImage
          key={current}
          path={current}
          alt={alt}
          className="h-56 w-full rounded-xl object-cover sm:h-72"
          onError={() => setBroken((b) => ({ ...b, [selected]: true }))}
        />
      )}
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label={t('gallery.pick')}>
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={t('gallery.view', { n: i + 1 })}
              aria-pressed={i === selected}
              className={`shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                i === selected ? 'ring-olive' : 'ring-transparent hover:ring-stone/40'
              }`}
            >
              <ProtectedImage path={src} alt="" loading="lazy" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
