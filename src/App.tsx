import UpdateChecker from '@/components/Update/UpdateChecker';
import { findThemeById } from '@/themeRegistry';
import MainLayout from '@components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import DebugPage from '@pages/DebugPage';
import MainPage from '@pages/MainPage';
import { initializeAccounts } from '@store/slices/AccountsSlice';
import { initRateLimitState } from '@store/slices/RateLimitSlice';
import { error, info } from '@tauri-apps/plugin-log';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import { Button } from 'primereact/button';
import { useEffect, useState } from 'react';
import './App.scss';

function App() {
  const dispatch = useAppDispatch();
  const isProd = import.meta.env.PROD;

  const theme = useAppSelector((state) => state.settings.theme);
  const isDebugMode = useAppSelector((state) => state.settings.experimental.isDebugMode);

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    dispatch(initializeAccounts());
    dispatch(initRateLimitState());
  }, [dispatch]);

  useEffect(() => {
    const themeEntry = findThemeById(theme);
    if (!themeEntry?.url) {
      return;
    }

    const currentLink = document.getElementById('app-theme') as HTMLLinkElement | null;
    if (currentLink?.href === themeEntry.url) {
      return;
    }

    const nextLink = document.createElement('link');
    nextLink.rel = 'stylesheet';
    nextLink.id = 'app-theme-next';
    nextLink.href = themeEntry.url;

    nextLink.onload = () => {
      const activeLink = document.getElementById('app-theme') as HTMLLinkElement | null;
      nextLink.id = 'app-theme';
      if (activeLink) {
        activeLink.remove();
      }
      info(`Theme changed to ${theme}`);
    };

    nextLink.onerror = (e) => {
      error(`Failed to apply theme error: ${String(e)}`);
      nextLink.remove();
    };

    document.head.appendChild(nextLink);
  }, [theme]);

  return (
    <div className="App">
      {isProd && <UpdateChecker />}
      <MainLayout>
        {isDebugMode && (
          <Button
            onClick={() => setShowDebug(!showDebug)}
            style={{ position: 'fixed', top: '5rem', left: '1rem', zIndex: 1000 }}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
        )}
        {showDebug && <DebugPage />}
        <MainPage />
      </MainLayout>
    </div>
  );
}

export default App;
