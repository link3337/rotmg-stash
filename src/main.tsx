import { SettingsProvider } from '@providers/SettingsProvider.tsx';
import { store } from '@store/index.ts';
import { PrimeReactProvider } from 'primereact/api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import './index.scss';
import { ConstantsProvider } from './providers/ConstantsProvider.tsx';

console.log(`Mode: ${import.meta.env.MODE}`);
console.log(`ASSETS URL From env: ${import.meta.env.ROTMG_STASH_ASSETS_URL}`);

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <SettingsProvider>
        <ConstantsProvider>
          <PrimeReactProvider value={{ ripple: true }}>
            <App />
          </PrimeReactProvider>
        </ConstantsProvider>
      </SettingsProvider>
    </Provider>
  </StrictMode>
);
