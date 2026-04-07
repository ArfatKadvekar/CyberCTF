import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SessionProvider } from './context/SessionContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { DialogProvider } from './context/DialogContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <CategoriesProvider>
          <DialogProvider>
            <App />
          </DialogProvider>
        </CategoriesProvider>
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
