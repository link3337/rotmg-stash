import useCrypto from '@hooks/crypto';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useState } from 'react';

interface PasswordEditorProps {
  initialValue: string;
  value: string;
  editorCallback: (value: string) => void;
}

const PasswordEditor: React.FC<PasswordEditorProps> = (props) => {
  const { decrypt } = useCrypto();

  const [showPassword, setShowPassword] = useState(false);
  const [displayPassword, setDisplayPassword] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && props.initialValue) {
      setDisplayPassword(decrypt(props.initialValue));
      setIsInitialized(true);
    }
  }, [props.initialValue, isInitialized]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setDisplayPassword(newPassword);
    // Encrypt before sending to parent
    props.editorCallback(newPassword);
  };

  return (
    <div className="p-inputgroup">
      <InputText
        type={showPassword ? 'text' : 'password'}
        value={displayPassword}
        onChange={handleChange}
      />
      <Button
        icon={`pi pi-eye${showPassword ? '-slash' : ''}`}
        onClick={() => setShowPassword(!showPassword)}
        className="p-button-secondary"
        type="button"
      />
    </div>
  );
};

export default PasswordEditor;
