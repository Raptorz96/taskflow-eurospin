import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/mobile-fix.css'
import './styles/input-fix.css'
import App from './App.jsx'

// Add viewport meta tag for mobile optimization
if (!document.querySelector('meta[name="viewport"]')) {
  const viewport = document.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1.0'
  document.head.appendChild(viewport)
}

// Add theme color for mobile browsers
if (!document.querySelector('meta[name="theme-color"]')) {
  const themeColor = document.createElement('meta')
  themeColor.name = 'theme-color'
  themeColor.content = '#0066CC'
  document.head.appendChild(themeColor)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
