import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import './styles/home-new.css';
import './styles/modal.css';
import './styles/admin-dashboard.css';
import './styles/navigation-fixes.css';
import './styles/enhanced-design.css';
// Import Tailwind last so existing styles take precedence
import './styles/tailwind.css';
// Nocturne redesign tokens + components — must win the cascade
import './styles/nocturne.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 