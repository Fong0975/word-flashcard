import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';
import App from './App';
import { ApiVersionProvider } from './contexts/ApiVersionContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ApiVersionProvider>
        <App />
      </ApiVersionProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
