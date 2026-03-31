import { useState, useEffect } from 'react'

const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

const MoonIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const navLinks = [
  { href: '#dashboard',       label: 'Dashboard' },
  { href: '#content-studio',  label: 'Content Studio' },
  { href: '#scheduler',       label: 'Scheduler' },
  { href: '#history',         label: 'History' },
]

export default function NavBar({ theme, setTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 lg:px-12 py-4 transition-all duration-300"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderBottom: scrolled ? '1px solid var(--border-dim)' : '1px solid transparent',
        boxShadow: scrolled ? 'var(--shadow)' : 'none',
      }}
    >
      {/* Logo */}
      <a href="#dashboard" className="flex items-center gap-2.5 group no-underline">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{ background: 'var(--teal)' }}
        >
          {/* GrubGain logo placeholder — fork/spoon icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
          </svg>
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="text-xs font-black tracking-wider uppercase"
            style={{ fontFamily: 'Unbounded, sans-serif', color: 'var(--fg)' }}
          >
            Grub<span style={{ color: 'var(--teal)' }}>Gain</span>
          </span>
          <span
            className="text-[0.42rem] tracking-[0.14em] uppercase mt-0.5"
            style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dimmer)' }}
          >
            AI Digital Marketing
          </span>
        </div>
      </a>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(link => (
          <a
            key={link.href}
            href={link.href}
            className="text-[0.62rem] tracking-[0.1em] uppercase transition-colors duration-150 no-underline hover:opacity-100"
            style={{
              fontFamily: 'Space Mono, monospace',
              color: 'var(--fg-dim)',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--fg)'}
            onMouseLeave={e => e.target.style.color = 'var(--fg-dim)'}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Right side: Theme toggle + avatar */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <div
          className="flex items-center rounded-full p-1 gap-0.5 cursor-pointer transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
          onClick={toggleTheme}
          title="Toggle Light / Dark mode"
        >
          <button
            className="w-8 h-7 rounded-full flex items-center justify-center transition-all duration-200 border-none cursor-pointer"
            style={{
              background: theme === 'dark' ? 'var(--teal)' : 'transparent',
              color: theme === 'dark' ? '#fff' : 'var(--fg-dim)',
            }}
            onClick={e => { e.stopPropagation(); setTheme('dark') }}
          >
            <MoonIcon />
          </button>
          <button
            className="w-8 h-7 rounded-full flex items-center justify-center transition-all duration-200 border-none cursor-pointer"
            style={{
              background: theme === 'light' ? 'var(--teal)' : 'transparent',
              color: theme === 'light' ? '#fff' : 'var(--fg-dim)',
            }}
            onClick={e => { e.stopPropagation(); setTheme('light') }}
          >
            <SunIcon />
          </button>
        </div>

        {/* Avatar placeholder */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #007A64 0%, #00b89a 100%)', fontFamily: 'Unbounded, sans-serif' }}
          title="Profile"
        >
          G
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-1 cursor-pointer border-none"
          style={{ background: 'transparent', color: 'var(--fg-dim)' }}
          onClick={() => setMenuOpen(o => !o)}
        >
          <MenuIcon />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div
          className="absolute top-full left-0 right-0 flex flex-col py-3 md:hidden"
          style={{
            background: 'var(--nav-bg)',
            backdropFilter: 'blur(28px)',
            borderBottom: '1px solid var(--border-dim)',
          }}
        >
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="px-8 py-3 text-[0.7rem] tracking-[0.1em] uppercase no-underline"
              style={{ fontFamily: 'Space Mono, monospace', color: 'var(--fg-dim)' }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
