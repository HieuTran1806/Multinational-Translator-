import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { fetchMediaObjectUrl, languageApi, poiApi, ttsApi } from '../api/endpoints.js';
import { Alert, Button, Card, Field, PoiStatusBadge, Spinner, inputClass } from '../components/ui.jsx';
import TranslationEditor from '../features/TranslationEditor.jsx';
import { validatePoiForm } from './poiForm.js';

const EMPTY = { code: '', defaultName: '', latitude: '', longitude: '' };

function toForm(poi) {
  return poi
    ? { code: poi.code, defaultName: poi.defaultName, latitude: String(poi.latitude), longitude: String(poi.longitude) }
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
  const [activeLang, setActiveLang] = useState('vi');
  const [imageUrl, setImageUrl] = useState(null);

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
    if (!poi?.imageUrl) return undefined;
    let url;
    const ctrl = new AbortController();
    fetchMediaObjectUrl(poi.imageUrl, ctrl.signal)
      .then((u) => {
        url = u;
        setImageUrl(u);
      })
      .catch(() => {});
    return () => {
      ctrl.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [poi?.imageUrl, poi?.updatedAt]);

  async function onSaveBasic(e) {
    e.preventDefault();
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

  async function togglePublish() {
    setStatusBusy(true);
    setMessage(null);
    try {
      const updated = poi.status === 'PUBLISHED' ? await poiApi.unpublish(id) : await poiApi.publish(id);
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
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMessage(null);
    try {
      setPoi(await poiApi.uploadImage(id, file));
      setMessage({ kind: 'success', text: 'Đã cập nhật ảnh.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err.message });
    }
  }

  if (loading) {
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
          <h1 className="text-3xl font-bold text-forest">{isNew ? 'Tạo POI' : poi.defaultName}</h1>
          {!isNew && (
            <div className="mt-1 flex items-center gap-2 text-sm text-stone">
              <PoiStatusBadge status={poi.status} /> <span>{poi.code}</span>
              {poi.demo && <span className="rounded bg-terracotta/15 px-1 text-terracotta">Dữ liệu DEMO</span>}
            </div>
          )}
        </div>
        {!isNew && (
          <Button variant={poi.status === 'PUBLISHED' ? 'secondary' : 'primary'} loading={statusBusy} onClick={togglePublish}>
            {poi.status === 'PUBLISHED' ? 'Chuyển về nháp' : 'Công khai'}
          </Button>
        )}
      </header>

      {message && <Alert kind={message.kind}>{message.text}</Alert>}

      <Card title="Thông tin chung">
        <form onSubmit={onSaveBasic} noValidate className="grid gap-4 md:grid-cols-2">
          {field('code', 'Mã địa điểm', { placeholder: 'VD: BEN-DUOC', autoCapitalize: 'characters' })}
          {field('defaultName', 'Tên mặc định')}
          {field('latitude', 'Vĩ độ (latitude)', { inputMode: 'decimal', placeholder: '11.1430' })}
          {field('longitude', 'Kinh độ (longitude)', { inputMode: 'decimal', placeholder: '106.4618' })}
          <div className="md:col-span-2">
            <Button type="submit" loading={saving}>
              {isNew ? 'Tạo POI (nháp)' : 'Lưu thông tin'}
            </Button>
          </div>
        </form>
        {!isNew && (
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-stone/15 pt-4">
            {imageUrl ? (
              <img src={imageUrl} alt="Ảnh đại diện" className="h-24 w-36 rounded-lg object-cover" />
            ) : (
              <div className="flex h-24 w-36 items-center justify-center rounded-lg bg-sand text-xs text-stone">
                Chưa có ảnh
              </div>
            )}
            <label className="cursor-pointer text-sm font-semibold text-olive hover:underline">
              Tải ảnh đại diện (JPEG/PNG/WEBP, ≤ 5 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onImage} />
            </label>
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
