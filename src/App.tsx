import UpdateChecker from '@/components/Update/UpdateChecker';
import MainLayout from '@components/Layout/MainLayout';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import DebugPage from '@pages/DebugPage';
import MainPage from '@pages/MainPage';
import { initializeAccounts } from '@store/slices/AccountsSlice';
import { initRateLimitState } from '@store/slices/RateLimitSlice';
import { error, info } from '@tauri-apps/plugin-log';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import { PrimeReactContext } from 'primereact/api';
import { Button } from 'primereact/button';
import dark_deeppurple from 'primereact/resources/themes/mdc-dark-deeppurple/theme.css?url';
import light_deeppurple from 'primereact/resources/themes/mdc-light-deeppurple/theme.css?url';
import { useContext, useEffect, useState } from 'react';
import './App.scss';

function App() {
  const dispatch = useAppDispatch();
  const isProd = import.meta.env.PROD;

  const { changeTheme } = useContext(PrimeReactContext);

  const theme = useAppSelector((state) => state.settings.theme);
  const isDebugMode = useAppSelector((state) => state.settings.experimental.isDebugMode);

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    dispatch(initializeAccounts());
    dispatch(initRateLimitState());
  }, [dispatch]);

  useEffect(() => {
    const oldTheme = theme === 'dark' ? 'light' : 'dark';

    changeTheme!(`mdc-${oldTheme}-deeppurple`, `mdc-${theme}-deeppurple`, 'app-theme', () => {
      try {
        let link = document.getElementById('app-theme') as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.id = 'app-theme';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        // todo: add more themes and dynamically load the correct one based on the theme id instead of hardcoding
        link.href = theme === 'dark' ? dark_deeppurple : light_deeppurple;
      } catch (e) {
        // ignore link errors
        error(`Failed to apply theme error: ${e}`);
      }

      info(`Theme changed from ${oldTheme} to ${theme}`);
    });
  }, [theme, changeTheme]);

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
