const paths = {
  leaf: ['M5 19c0-8 5-14 14-14 0 9-6 14-14 14z', 'M5 19c3-4 6-7 10-9'],
  calendar: [
    'M4 5h16a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
    'M3 10h18',
    'M8 3v4',
    'M16 3v4',
  ],
  clock: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 7v5l3 2'],
  check: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8 12.5l2.5 2.5L16 9.5'],
  tick: ['M5 12.5l4.5 4.5L19 7.5'],
  dot: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  camera: ['M4 8h3l2-3h6l2 3h3v11H4z', 'M12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'],
  chat: ['M4 5h16v11H9l-5 4z'],
  image: [
    'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
    'M9 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    'M3 17l5-5 4 4 3-3 6 6',
  ],
  arrow: ['M5 12h14', 'M13 6l6 6-6 6'],
  alert: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 8v5', 'M12 16.5v.01'],
} as const

export type IconName = keyof typeof paths

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

/** Decorative: the text next to an icon always says the same thing, so screen readers skip it. */
export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
