export default function AppButton({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  style = {},
  ...props
}) {
  const variants = {
    primary: {
      background: 'var(--teal)',
      color: '#fff',
      border: '1px solid transparent',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--fg-dim)',
      border: '1px solid var(--border)',
    },
    subtle: {
      background: 'rgba(0,122,100,0.08)',
      color: 'var(--teal)',
      border: '1px solid rgba(0,122,100,0.2)',
    },
    danger: {
      background: 'rgba(204,0,0,0.08)',
      color: '#cc0000',
      border: '1px solid rgba(204,0,0,0.2)',
    },
  }

  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        borderRadius: 10,
        padding: '8px 14px',
        fontFamily: 'Space Mono, monospace',
        fontSize: '0.62rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.15s ease',
        ...variants[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

