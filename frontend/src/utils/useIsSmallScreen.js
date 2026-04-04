import { useState, useEffect } from 'react'

export function useIsSmallScreen(breakpoint = 768) {
  const [isSmall, setIsSmall] = useState(() => window.innerWidth <= breakpoint)

  useEffect(() => {
    const handler = () => setIsSmall(window.innerWidth <= breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])

  return isSmall
}
