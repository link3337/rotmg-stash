import { useLazyGetSettingsQuery } from '@api/tauri/tauriApi';
import { createContext, useContext, useEffect, useState } from 'react';

interface Settings {
  secret_key: string | null;
}

interface SettingsContext {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContext>({
  settings: null,
  loading: true,
  error: null
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [getSettings] = useLazyGetSettingsQuery();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsResponse = await getSettings().unwrap();
        setSettings(settingsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading: isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContext => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
