import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './lib/store.jsx';
import { selfTest } from './lib/geo.js';
import App from './App.jsx';
import './styles.css';

if (new URLSearchParams(location.search).get('test') === '1')
  console.table(selfTest().map(t => ({ 이름: t.name, 통과: t.ok })));

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider><App /></AppProvider>
  </StrictMode>
);
