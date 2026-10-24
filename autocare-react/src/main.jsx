import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Bootstrap + icons come from node_modules (no CDN links needed)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './bootstrap.js'

// Your three stylesheets. site.css and mechanic.css only apply inside their own area.
import './styles/admin.css'
import './styles/site.css'
import './styles/site-extra.css'
import './styles/mechanic.css'
import './index.css'

import AuthProvider from './auth/AuthProvider.jsx'
import ApiStoreProvider from './data/ApiStoreProvider.jsx'
import DialogProvider from './ui/DialogProvider.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DialogProvider>
          {/* admin + mechanic data, loaded from the backend (MySQL) */}
          <ApiStoreProvider>
            <App />
          </ApiStoreProvider>
        </DialogProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
