import { defaultThemeSetting } from '@/cache/migration/default-settings';
import { findThemeById } from '@/themeRegistry';
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

const resolveInitialThemeId = () => {

  const savedSettings = localStorage.getItem('settings');
  if (!savedSettings) {
    return defaultThemeSetting;
  }

  const parsedSettings = JSON.parse(savedSettings) as { theme?: string };
  const savedTheme = parsedSettings?.theme;

  if (savedTheme === 'dark') {
    return 'mdc-dark-deeppurple';
  }

  if (savedTheme === 'light') {
    return 'mdc-light-deeppurple';
  }

  if (savedTheme && findThemeById(savedTheme)) {
    return savedTheme;
  }

  return defaultThemeSetting;
};

const applyInitialTheme = () => {
  const themeId = resolveInitialThemeId();
  const themeEntry = findThemeById(themeId);
  if (!themeEntry) {
    return;
  }

  let link = document.getElementById('app-theme') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = 'app-theme';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  link.href = themeEntry.url;
};

applyInitialTheme();

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
