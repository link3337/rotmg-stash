import { ClassID } from '@/realm/renders/classes';
import { isPortraitReady, portrait, waitForPortraitReady } from '@utils/portrait';
import { Skeleton } from 'primereact/skeleton';
import { useEffect, useState } from 'react';

interface CharacterPortraitProps {
  type: ClassID;
  skin: string;
  tex1: string;
  tex2: string;
  adjust: boolean;
}

const CharacterPortrait: React.FC<CharacterPortraitProps> = ({ type, skin, tex1, tex2 }) => {
  const [base64Image, setBase64Image] = useState('');

  useEffect(() => {
    let cancelled = false;

    const renderPortrait = async () => {
      if (isPortraitReady()) {
        const base64 = portrait(type, skin, tex1, tex2);
        if (!cancelled) {
          setBase64Image(base64);
        }
        return;
      }

      await waitForPortraitReady();
      if (cancelled) {
        return;
      }

      const base64 = portrait(type, skin, tex1, tex2);
      setBase64Image(base64);
    };

    void renderPortrait();

    return () => {
      cancelled = true;
    };
  }, [type, skin, tex1, tex2]);

  if (!base64Image) {
    return <Skeleton shape="circle" size="2rem" />;
  }

  return <img src={base64Image} width={34} height={34} alt="Character Portrait" />;
};

export default CharacterPortrait;
