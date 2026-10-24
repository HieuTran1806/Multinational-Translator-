/** Small presentational components following the Penpot design tokens (shared with apps/admin). */

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

export function Badge({ children, className = 'bg-stone/10 text-stone' }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-stone/15 ${className}`} />;
}
