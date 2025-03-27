import { ItemUIModel } from '@api/models/char-ui-model';
import useDebounce from '@hooks/debounce';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ItemList } from './ItemList';
import styles from './ItemSearch.module.scss';

interface ItemSearchProps {
  totalItemsNameMap: Map<string, number>;
}

const ItemSearch: React.FC<ItemSearchProps> = ({ totalItemsNameMap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filteredItems, setFilteredItems] = useState<ItemUIModel[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Memoize the filtering logic
  const filterItems = useCallback(
    (term: string) => {
      if (!term || term.length < 3) return [];

      return Array.from(totalItemsNameMap.entries())
        .filter(([key]) => key.toLowerCase().includes(term.toLowerCase()))
        .map(([, value]) => ({ itemId: value }));
    },
    [totalItemsNameMap]
  );

  // Combined effect for handling search term changes
  useEffect(() => {
    const items = filterItems(debouncedSearchTerm);
    setFilteredItems(items);

    if (items.length > 0) {
      overlayRef.current?.classList.add(styles.show);
    } else {
      overlayRef.current?.classList.remove(styles.show);
    }
  }, [debouncedSearchTerm, filterItems]);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    setFilteredItems([]);
    overlayRef.current?.classList.remove(styles.show);
  }, []);

  const handleFocus = useCallback(() => {
    if (filteredItems.length > 0) {
      overlayRef.current?.classList.add(styles.show);
    }
  }, [filteredItems.length]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoize the search input props
  const searchInputProps = useMemo(
    () => ({
      value: searchTerm,
      onChange: handleSearchChange,
      placeholder: 'Search items...',
      onFocus: handleFocus,
      style: { width: '350px' },
      'aria-label': 'Search items',
      role: 'searchbox'
    }),
    [searchTerm, handleSearchChange, handleFocus]
  );

  return (
    <div className="p-justify-center" role="search">
      <div className="col-8 p-inputgroup mx-auto">
        <InputText {...searchInputProps} />
        <Button
          icon="pi pi-times"
          disabled={!searchTerm}
          onClick={handleClear}
          className="p-button-primary"
          aria-label="Clear search"
        />
      </div>
      <div className="mt-2 flex flex-column gap-2">
        {filteredItems.length > 0 && <ItemList items={filteredItems} />}
      </div>
    </div>
  );
};

export default ItemSearch;
