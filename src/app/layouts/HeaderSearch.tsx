import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import styles from './HeaderSearch.module.css'

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent)

/** Sends the query to the shop, where the results are filtered; Ctrl K or Cmd K focuses the field. */
export function HeaderSearch() {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const text = query.trim()
    void navigate(text ? `/shop?q=${encodeURIComponent(text)}` : '/shop')
  }

  return (
    <form className={styles.search} role="search" onSubmit={onSubmit}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        ref={input}
        className={styles.input}
        type="search"
        enterKeyHint="search"
        aria-label="Search plants and care needs"
        placeholder="Search plants, care needs"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <kbd className={styles.hint} aria-hidden="true">
        {isMac ? '⌘K' : 'Ctrl K'}
      </kbd>
    </form>
  )
}
