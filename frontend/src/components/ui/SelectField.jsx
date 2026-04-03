export default function SelectField({ label, options, value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[0.58rem] tracking-[0.14em] uppercase"
        style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dim)' }}
      >
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-10 rounded-xl text-sm font-medium transition-all duration-150"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
            fontFamily: 'Inter, sans-serif',
            backdropFilter: 'blur(10px)',
            appearance: 'none',
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ color: 'var(--fg-dim)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  )
}

