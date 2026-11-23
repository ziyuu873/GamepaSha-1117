import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
console.log('%cGamepaSha - made by Sego-ZiYu', 'color: #fddde6; background: #333; padding: 4px 8px; font-weight: bold;');
