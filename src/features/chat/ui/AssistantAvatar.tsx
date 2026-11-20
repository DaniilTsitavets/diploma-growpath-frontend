export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 27V15m0 0c0-6 4.5-9.5 11-9.5 0 6-4.5 9.5-11 9.5Zm0 5c0-4.5-3.5-7-8.5-7 0 4.5 3.5 7 8.5 7Z" />
      </svg>
    </span>
  )
}
