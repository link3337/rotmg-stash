import { SettingsProvider } from '@providers/SettingsProvider.tsx';
import { store } from '@store/index.ts';
import { PrimeReactProvider } from 'primereact/api';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App.tsx';
import './index.scss';

console.log(`Mode: ${import.meta.env.MODE}`);

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Provider store={store}>
      <PrimeReactProvider value={{ ripple: true }}>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </PrimeReactProvider>
    </Provider>
  </StrictMode>
);
