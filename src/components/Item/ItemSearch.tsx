import { ItemUIModel } from '@api/models/char-ui-model';
import useDebounce from '@hooks/debounce'; // Adjust the import path as needed
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useEffect, useRef, useState } from 'react';
import { ItemList } from './ItemList';
import styles from './ItemSearch.module.scss';

interface ItemSearchProps {
  totalItemsNameMap: Map<string, number>;
}

const ItemSearch: React.FC<ItemSearchProps> = ({ totalItemsNameMap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay
  const [filteredItems, setFilteredItems] = useState<ItemUIModel[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 3) {
      const foundItems = Array.from(totalItemsNameMap.entries())
        .filter(([key]) => key.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        .map(([, value]) => value);

      const mapped: ItemUIModel[] = foundItems.map((item) => {
        return { itemId: item };
      });

      setFilteredItems(mapped);
      overlayRef.current?.classList.add(styles.show);
    } else {
      setFilteredItems([]);
      overlayRef.current?.classList.remove(styles.show);
    }
  }, [debouncedSearchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    setFilteredItems([]);
    overlayRef.current?.classList.remove(styles.show);
  };

  const handleFocus = () => {
    if (filteredItems.length > 0) {
      overlayRef.current?.classList.add(styles.show);
    }
  };

  return (
    <div className="p-justify-center">
      <div className="col-8 p-inputgroup mx-auto">
        <InputText
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search items..."
          onFocus={handleFocus}
          style={{ width: '350px' }}
        />
        <Button icon="pi pi-times" onClick={handleClear} className="p-button-primary" />
      </div>
      {filteredItems && filteredItems.length > 0 && <ItemList items={filteredItems} />}
    </div>
  );
};

export default ItemSearch;
