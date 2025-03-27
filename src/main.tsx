import { SettingsProvider } from '@providers/SettingsProvider.tsx';
import { store } from '@store/index.ts';
import { PrimeReactProvider } from 'primereact/api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import './index.scss';
import { ItemsProvider } from './providers/ItemsProvider.tsx';

console.log(`Mode: ${import.meta.env.MODE}`);
console.log(`ASSETS URL From env: ${import.meta.env.ROTMG_STASH_ASSETS_URL}`);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <SettingsProvider>
        <ItemsProvider>
          <PrimeReactProvider value={{ ripple: true }}>
            <App />
          </PrimeReactProvider>
        </ItemsProvider>
      </SettingsProvider>
    </Provider>
  </StrictMode>
);
