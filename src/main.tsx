import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { bootstrap } from './app/bootstrap'
import './shared/styles/fonts.css'
import './shared/styles/tokens.css'
import './shared/styles/global.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element is missing')

try {
  bootstrap()
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
} catch (error) {
  root.textContent = error instanceof Error ? error.message : 'The application failed to start.'
}
