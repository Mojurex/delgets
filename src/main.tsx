import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/science-gothic/wdth.css';
import '@fontsource-variable/onest/wght.css';
import './styles/tokens.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
