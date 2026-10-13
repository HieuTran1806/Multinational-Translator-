/** Client-side validation mirroring the backend rules (the backend remains the source of truth). */
export function validatePoiForm(f) {
  const e = {};
  if (!/^[A-Z0-9][A-Z0-9_-]{1,49}$/.test(f.code)) e.code = 'Mã gồm chữ IN HOA, số, "-" hoặc "_" (2–50 ký tự)';
  if (!f.defaultName.trim()) e.defaultName = 'Tên mặc định là bắt buộc';
  const lat = Number(f.latitude);
  const lng = Number(f.longitude);
  if (f.latitude === '' || Number.isNaN(lat) || lat < -90 || lat > 90) e.latitude = 'Vĩ độ phải trong khoảng -90..90';
  if (f.longitude === '' || Number.isNaN(lng) || lng < -180 || lng > 180)
    e.longitude = 'Kinh độ phải trong khoảng -180..180';
  return e;
}
