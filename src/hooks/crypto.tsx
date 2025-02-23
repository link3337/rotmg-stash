import { useSettings } from '@providers/SettingsProvider';
import CryptoJS from 'crypto-js';

/**
 * Custom hook that provides encryption and decryption functionalities using AES algorithm.
 *
 * @returns {Object} An object containing two functions:
 * - `encrypt`: Encrypts a given text using a secret key from settings.
 * - `decrypt`: Decrypts a given ciphertext using a secret key from settings.
 *
 * @example
 * const { encrypt, decrypt } = useCrypto();
 * const encryptedText = encrypt("Hello B)");
 * const decryptedText = decrypt(encryptedText);
 */
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
