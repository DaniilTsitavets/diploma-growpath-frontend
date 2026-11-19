// Sets the theme before the first paint so a stored dark choice does not flash light.
try {
  var stored = localStorage.getItem('growpath.theme')
  var dark = stored ? stored === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
} catch {
  document.documentElement.dataset.theme = 'light'
}
