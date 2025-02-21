import { portrait } from '@utils/portrait';
import { Skeleton } from 'primereact/skeleton';
import { useEffect, useState } from 'react';

interface CharacterPortraitProps {
  type: number;
  skin: string;
  tex1: string;
  tex2: string;
  adjust: boolean;
}

const CharacterPortrait: React.FC<CharacterPortraitProps> = ({ type, skin, tex1, tex2 }) => {
  const [base64Image, setBase64Image] = useState('');

  useEffect(() => {
    const base64 = portrait(type, skin, tex1, tex2);
    setBase64Image(base64);
  }, [type, skin, tex1, tex2]);

  if (!base64Image) {
    return <Skeleton shape="circle" size="2rem" />;
  }

  return <img src={base64Image} width={34} height={34} alt="Character Portrait" />;
};

export default CharacterPortrait;
