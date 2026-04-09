import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { SessionProvider } from './context/SessionContext';
import { BanProvider } from './context/BanContext';
import { CategoriesProvider } from './context/CategoriesContext';
import { DialogProvider } from './context/DialogContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BanProvider>
        <SessionProvider>
          <LeaderboardProvider>
            <CategoriesProvider>
              <DialogProvider>
                <App />
              </DialogProvider>
            </CategoriesProvider>
          </LeaderboardProvider>
        </SessionProvider>
      </BanProvider>
    </BrowserRouter>
  </React.StrictMode>
);
