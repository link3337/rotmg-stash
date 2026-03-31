import { AccountUIModel } from '@api/models/account-ui-model';
import { CharUIModel } from '@api/models/char-ui-model';
import { Dialog } from 'primereact/dialog';
import React from 'react';
import CharacterBuilder from './CharacterBuilder';

interface CharacterBuilderDialogProps {
  account: AccountUIModel;
  characters: CharUIModel[];
  visible: boolean;
  onHide: () => void;
}

const CharacterBuilderDialog: React.FC<CharacterBuilderDialogProps> = ({
  account,
  characters,
  visible,
  onHide
}) => {
  return (
    <Dialog
      header="Character Builder Roulette"
      visible={visible}
      onHide={onHide}
      resizable
      maximizable
      modal
      closeOnEscape
      dismissableMask
      style={{ width: 'min(96vw, 1280px)' }}
      breakpoints={{ '1400px': '95vw', '1024px': '98vw' }}
      contentStyle={{ padding: '0.8rem' }}
    >
      {visible ? <CharacterBuilder account={account} characters={characters} /> : null}
    </Dialog>
  );
};

export default CharacterBuilderDialog;
