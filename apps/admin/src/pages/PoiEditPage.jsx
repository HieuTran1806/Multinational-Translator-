import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { fetchMediaObjectUrl, languageApi, poiApi, ttsApi } from '../api/endpoints.js';
import { Alert, Button, Card, Field, PoiStatusBadge, Spinner, inputClass } from '../components/ui.jsx';
import TranslationEditor from '../features/TranslationEditor.jsx';
import { validatePoiForm } from './poiForm.js';

const EMPTY = { code: '', defaultName: '', latitude: '', longitude: '', category: '', triggerRadius: '50' };

function toForm(poi) {
  return poi
    ? { code: poi.code ?? '', defaultName: poi.defaultName ?? '', latitude: String(poi.latitude ?? ''), longitude: String(poi.longitude ?? ''), category: poi.category ?? '', triggerRadius: String(poi.triggerRadius ?? 50) }
    : EMPTY;
}

export default function PoiEditPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [poi, setPoi] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [ttsStatus, setTtsStatus] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeLang, setActiveLang] = useState(null);
  const [imageItems, setImageItems] = useState([]);
  const [imageBusy, setImageBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (isNew) return;
    const data = await poiApi.get(id);
    setPoi(data);
    setForm(toForm(data));
  }, [id, isNew]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [langs, tts] = await Promise.all([languageApi.list(), ttsApi.status()]);
        if (cancelled) return;
        setLanguages(langs);
        // Language codes come from the backend; never assume 'vi'/'en' exist.
        setActiveLang((current) => (langs.some((l) => l.code === current) ? current : langs[0]?.code ?? null));
        setTtsStatus(tts);
        if (!isNew) await refresh();
      } catch (e) {
        if (!cancelled) setLoadError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, refresh]);

  useEffect(() => {
    const ctrl = new AbortController();
    const urls = [];
    const sources = poi?.images?.length ? poi.images : poi?.imageUrl ? [{ id: 'cover', url: poi.imageUrl, sortOrder: 0 }] : [];
    Promise.all(sources.map(async (image) => {
      const url = await fetchMediaObjectUrl(image.url, ctrl.signal);
      urls.push(url);
      return { ...image, objectUrl: url };
    })).then((items) => {
      setImageItems(items);
    }).catch(() => {});
    return () => {
      ctrl.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [poi?.images, poi?.imageUrl, poi?.updatedAt]);

  async function onSaveBasic(e) {
    e.preventDefault();
    if (saving) return;
    const v = validatePoiForm(form);
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    setMessage(null);
    const payload = {
      code: form.code,
      defaultName: form.defaultName.trim(),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      category: form.category.trim() || null,
      triggerRadius: Number(form.triggerRadius),
      rowVersion: poi?.rowVersion,
    };
    try {
      if (isNew) {
        const created = await poiApi.create(payload);
        navigate(`/pois/${created.id}`, { replace: true });
      } else {
        const updated = await poiApi.update(id, payload);
        setPoi(updated);
        setMessage({ kind: 'success', text: 'Đã lưu thông tin địa điểm.' });
      }
    } catch (err) {
      setErrors(err.fieldMap ? err.fieldMap() : {});
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function deletePoi() {
    if (statusBusy || !window.confirm('Xóa mềm POI này? POI sẽ ẩn khỏi danh sách và dữ liệu liên quan được giữ lại.')) return;
    setStatusBusy(true);
    setMessage(null);
    try {
      await poiApi.remove(id);
      navigate('/pois', { replace: true });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setStatusBusy(false);
    }
  }

  async function togglePublish() {
    if (statusBusy) return;
    const isPublished = poi.status === 'PUBLISHED';
    const action = isPublished ? 'chuyển POI này về nháp' : 'công khai POI này';
    if (!window.confirm(`Bạn có chắc muốn ${action}?`)) return;
    setStatusBusy(true);
    setMessage(null);
    try {
      const updated = isPublished ? await poiApi.unpublish(id) : await poiApi.publish(id);
      setPoi(updated);
      setMessage({
        kind: 'success',
        text: updated.status === 'PUBLISHED' ? 'Địa điểm đã được công khai.' : 'Địa điểm đã chuyển về nháp.',
      });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setStatusBusy(false);
    }
  }

  async function onImage(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    if (files.length > 6 - (poi.images?.length ?? 0)) {
      setMessage({ kind: 'error', text: `Chỉ có thể thêm tối đa ${6 - (poi.images?.length ?? 0)} ảnh nữa.` });
      return;
    }
    setImageBusy(true);
    setMessage(null);
    try {
      let updated = poi;
      for (const file of files) updated = await poiApi.uploadImage(id, file);
      setPoi(updated);
      setMessage({ kind: 'success', text: `Đã tải lên ${files.length} ảnh.` });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
      await refresh();
    } finally {
      setImageBusy(false);
    }
  }

  async function removeImage(image) {
    if (imageBusy || !window.confirm('Xóa ảnh này khỏi POI?')) return;
    setImageBusy(true);
    try {
      setPoi(await poiApi.deleteImage(id, image.id));
      setMessage({ kind: 'success', text: 'Đã xóa ảnh.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setImageBusy(false);
    }
  }

  async function moveImage(index, delta) {
    const next = [...(poi.images ?? [])];
    const target = index + delta;
    if (imageBusy || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImageBusy(true);
    try {
      setPoi(await poiApi.reorderImages(id, next.map((image) => image.id)));
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    } finally {
      setImageBusy(false);
    }
  }

  // Covers the create → edit transition: after create we navigate to /pois/{id}
  // while this component stays mounted, so `poi` is still null for one render
  // before the effect fetches it.
  if (loading || (!isNew && !poi)) {
    return (
      <div className="py-20 text-center text-stone">
        <Spinner label="Đang tải POI…" />
      </div>
    );
  }
  if (loadError) {
    return (
      <Alert
        title={loadError.status === 404 ? 'Không tìm thấy POI' : 'Không thể tải POI'}
        action={<Link to="/pois" className="text-olive underline">Quay lại danh sách</Link>}
      >
        {loadError.message}
      </Alert>
    );
  }

  const translationsByLang = Object.fromEntries((poi?.translations ?? []).map((t) => [t.languageCode, t]));
  const field = (name, label, props = {}) => (
    <Field label={label} htmlFor={name} error={errors[name]}>
      <input
        id={name}
        className={inputClass}
        value={form[name]}
        aria-invalid={!!errors[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        {...props}
      />
    </Field>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/pois" className="text-sm text-olive hover:underline">
            ‹ Quay lại
          </Link>
          <h1 className="text-[26px] font-bold text-forest">{isNew ? 'Tạo POI' : poi.defaultName}</h1>
          {!isNew && (
            <div className="mt-1 flex items-center gap-2 text-sm text-stone">
              <PoiStatusBadge status={poi.status} /> <span>{poi.code}</span>
              {poi.demo && <span className="rounded bg-terracotta/15 px-1 text-terracotta">Dữ liệu DEMO</span>}
            </div>
          )}
        </div>
        {!isNew && (
          <div className="flex flex-wrap gap-2">
            <Button variant={poi.status === 'PUBLISHED' ? 'secondary' : 'primary'} loading={statusBusy} onClick={togglePublish}>
              {poi.status === 'PUBLISHED' ? 'Chuyển về nháp' : 'Công khai'}
            </Button>
            <Button variant="secondary" loading={statusBusy} onClick={deletePoi}>
              Xóa POI
            </Button>
          </div>
        )}
      </header>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      <Card title="Thông tin chung">
        <form onSubmit={onSaveBasic} noValidate className="grid gap-4 md:grid-cols-2">
          {field('code', 'Mã địa điểm', { placeholder: 'VD: BEN-DUOC', autoCapitalize: 'characters' })}
          {field('defaultName', 'Tên mặc định')}
          {field('latitude', 'Vĩ độ (latitude)', { inputMode: 'decimal', placeholder: '11.1430' })}
          {field('longitude', 'Kinh độ (longitude)', { inputMode: 'decimal', placeholder: '106.4618' })}
          {field('category', 'Danh mục', { placeholder: 'VD: Di tích lịch sử' })}
          {field('triggerRadius', 'Bán kính kích hoạt (mét)', { inputMode: 'decimal', type: 'number', min: 1, max: 5000 })}
          <div className="md:col-span-2">
            <Button type="submit" loading={saving}>
              {isNew ? 'Tạo POI (nháp)' : 'Lưu thông tin'}
            </Button>
          </div>
        </form>
        {!isNew && (
          <div className="mt-6 space-y-3 border-t border-stone/15 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone">Ảnh POI: {imageItems.length}/6. Ảnh đầu tiên là ảnh đại diện.</p>
              <label className="cursor-pointer text-sm font-semibold text-olive hover:underline">
                Tải ảnh (JPEG/PNG/WEBP, mỗi ảnh ≤ 5 MB)
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={imageBusy || imageItems.length >= 6} className="hidden" onChange={onImage} />
              </label>
            </div>
            {imageItems.length === 0 ? <p className="text-sm text-stone">Chưa có ảnh</p> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageItems.map((image, index) => (
                  <div key={image.id} className="space-y-2 rounded-lg border border-stone/15 p-2">
                    <img src={image.objectUrl} alt={`Ảnh POI ${index + 1}`} className="h-28 w-full rounded object-cover" />
                    <p className="text-xs text-stone">Ảnh {index + 1}{index === 0 ? ' · Đại diện' : ''}</p>
                    {image.id !== 'cover' && <div className="flex flex-wrap gap-1">
                      <Button variant="secondary" size="sm" disabled={imageBusy || index === 0} onClick={() => moveImage(index, -1)}>Lên</Button>
                      <Button variant="secondary" size="sm" disabled={imageBusy || index === imageItems.length - 1} onClick={() => moveImage(index, 1)}>Xuống</Button>
                      <Button variant="secondary" size="sm" disabled={imageBusy} onClick={() => removeImage(image)}>Xóa</Button>
                    </div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {!isNew && (
        <Card title="Nội dung theo ngôn ngữ">
          <div role="tablist" className="mb-4 flex gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                role="tab"
                aria-selected={activeLang === l.code}
                onClick={() => setActiveLang(l.code)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  activeLang === l.code ? 'bg-olive text-paper' : 'bg-sand text-charcoal hover:bg-sand/70'
                }`}
              >
                {l.nativeName}
                {!translationsByLang[l.code] && <span className="ml-1 text-xs opacity-70">(trống)</span>}
              </button>
            ))}
          </div>
          {languages
            .filter((l) => l.code === activeLang)
            .map((l) => (
              <TranslationEditor
                key={`${l.code}-${translationsByLang[l.code]?.contentVersion ?? 0}-${translationsByLang[l.code]?.updatedAt ?? ''}`}
                poiId={poi.id}
                language={l}
                translation={translationsByLang[l.code]}
                ttsStatus={ttsStatus}
                onSaved={refresh}
              />
            ))}
        </Card>
      )}
    </div>
  );
}
