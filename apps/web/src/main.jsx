import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { AccessProvider } from './access/AccessContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AccessProvider>
          <App />
        </AccessProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
