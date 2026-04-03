export default function AppCard({ children, style = {}, ...props }) {
  return (
    <div className="glass-card" style={{ overflow: 'hidden', ...style }} {...props}>
      {children}
    </div>
  )
}

