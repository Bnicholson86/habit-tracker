import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AppProvider } from './contexts/AppContext.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
