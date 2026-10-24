/** Remaining access time for the header, e.g. "23 giờ 40 phút" / "23 h 40 min". */
export function formatRemaining(ms, t) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? t('access.hours', { h, m }) : t('access.minutes', { m });
}
