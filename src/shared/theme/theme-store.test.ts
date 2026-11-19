import { useTheme } from './theme-store'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  useTheme.setState({ theme: 'light' })
})

describe('theme store', () => {
  it('toggles the theme, applies it to the page and remembers it', () => {
    useTheme.getState().toggle()

    expect(useTheme.getState().theme).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('growpath.theme')).toBe('dark')

    useTheme.getState().toggle()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('growpath.theme')).toBe('light')
  })
})
