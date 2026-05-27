import { useState, useEffect } from 'react'

export function useCountUp(end: number, duration: number = 800, visible: boolean = true) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!visible || duration <= 0) {
      setCount(end)
      return undefined
    }
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return (): void => { clearInterval(timer) }
  }, [end, duration, visible])
  return count
}
