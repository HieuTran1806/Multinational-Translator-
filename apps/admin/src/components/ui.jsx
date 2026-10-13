/** Small presentational components following the Penpot design tokens. */

export function Button({ variant = 'primary', className = '', loading = false, children, disabled, ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-olive/50 disabled:cursor-not-allowed disabled:opacity-50';
  const variants = {
    primary: 'bg-olive text-paper hover:bg-olive-dark',
    secondary: 'border border-stone/40 bg-white text-charcoal hover:bg-sand/50',
    danger: 'bg-danger text-white hover:opacity-90',
    ghost: 'text-olive hover:bg-sand/60',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Spinner small />}
      {children}
    </button>
  );
}

export function Spinner({ small = false, label }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`${small ? 'h-3.5 w-3.5' : 'h-5 w-5'} animate-spin rounded-full border-2 border-current border-t-transparent`}
      />
      {label ? <span>{label}</span> : <span className="sr-only">Đang tải</span>}
    </span>
  );
}

export function Alert({ kind = 'error', title, children, action }) {
  const styles = {
    error: 'border-danger/30 bg-danger/10 text-danger',
    success: 'border-olive/30 bg-olive/10 text-forest',
    info: 'border-stone/30 bg-sand/60 text-charcoal',
    warning: 'border-terracotta/30 bg-terracotta/10 text-earth',
  };
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${styles[kind]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Field({ label, error, hint, htmlFor, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-stone">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-stone/40 bg-white px-3 py-2 text-sm focus:border-olive focus:outline-none ' +
  'focus:ring-2 focus:ring-olive/30 aria-[invalid=true]:border-danger';

export function Card({ title, actions, children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone/15 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-lg font-semibold text-forest">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS = {
  PUBLISHED: { text: 'Công khai', cls: 'bg-olive/15 text-forest' },
  DRAFT: { text: 'Nháp', cls: 'bg-stone/15 text-stone' },
};

export function PoiStatusBadge({ status }) {
  const s = STATUS[status] ?? { text: status, cls: 'bg-stone/15 text-stone' };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.text}</span>;
}

const AUDIO = {
  READY: { text: 'Có audio', cls: 'bg-olive/15 text-forest' },
  PROCESSING: { text: 'Đang tạo', cls: 'bg-sand text-earth' },
  FAILED: { text: 'Lỗi tạo audio', cls: 'bg-danger/15 text-danger' },
  NONE: { text: 'Chưa có audio', cls: 'bg-stone/10 text-stone' },
};

export function AudioBadge({ status }) {
  const s = AUDIO[status] ?? AUDIO.NONE;
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.text}</span>;
}
