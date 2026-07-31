import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { syncAll, getIsOnline } from './api/sync'

// Initialize cloud sync on app startup
async function initSync() {
  if (getIsOnline()) {
    try {
      await syncAll();
      console.log('[Cloud Sync] Initial sync completed');
    } catch (err) {
      console.warn('[Cloud Sync] Initial sync failed:', err);
    }
  }
}

initSync();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
