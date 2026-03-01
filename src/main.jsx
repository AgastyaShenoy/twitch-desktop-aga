import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// CRITICAL DEBUGGING: Catch any deep React crashes or runtime errors in production
window.addEventListener('error', (event) => {
  if (window.electronAPI) {
    window.electronAPI.log('FATAL WINDOW ERROR:', event.message, event.filename, event.lineno, event.error?.stack);
  }
});
window.addEventListener('unhandledrejection', (event) => {
  if (window.electronAPI) {
    window.electronAPI.log('UNHANDLED PROMISE REJECTION:', event.reason?.stack || event.reason);
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
