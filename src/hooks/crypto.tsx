import { useSettings } from '@providers/SettingsProvider';
import CryptoJS from 'crypto-js';

const useCrypto = () => {
  const { settings } = useSettings();

  return {
    encrypt: (text: string) => {
      return CryptoJS.AES.encrypt(text, settings?.secret_key!).toString();
    },
    decrypt: (ciphertext: string) => {
      const bytes = CryptoJS.AES.decrypt(ciphertext, settings?.secret_key!);
      return bytes.toString(CryptoJS.enc.Utf8);
    }
  };
};

export default useCrypto;
