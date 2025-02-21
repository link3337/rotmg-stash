import { useLazyGetSettingsQuery } from '@api/tauri/tauriApi';
import { createContext, useContext, useEffect, useState } from 'react';

interface Settings {
  secret_key: string | null;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  error: null
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  );
};
