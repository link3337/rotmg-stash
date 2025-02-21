import { ItemUIModel } from '@api/models/char-ui-model';
import React from 'react';
import { ItemList } from '../Item/ItemList';

interface VaultProps {
  title?: string;
  items: ItemUIModel[];
}

const Vault: React.FC<VaultProps> = ({ title, items }) => {
  return (
    <>
      <h2>{title}</h2>
      <ItemList items={items} />
    </>
  );
};

export default Vault;
