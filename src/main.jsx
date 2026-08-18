import React from 'react'
import { createRoot } from 'react-dom/client'
import AppV2 from './AppV2.jsx'
import './styles.css'
import './nav-connectors.css'
import './chat-density.css'
import './status-overlay.css'
import './final-mobile-fixes.css'
import { configureNativeUi } from './native.js'

configureNativeUi()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppV2 />
  </React.StrictMode>
)
