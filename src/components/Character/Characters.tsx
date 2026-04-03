import { useConstants } from '@/providers/ConstantsProvider';
import { CharUIModel } from '@api/models/char-ui-model';
import { ExaltUIModel } from '@api/models/exalt-ui-model';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { ClassStat } from '@realm/models/charlist-response';
import { ClassID } from '@realm/renders/classes';
import {
  FilterType,
  getCharacterFilterByAccount,
  getSelectedClassesByAccount,
  selectShowHighlightedOnly,
  setFilter,
  setSelectedClasses,
  useFilter
} from '@store/slices/FilterSlice';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import React, { useCallback, useMemo, useState } from 'react';
import { Character } from './Character';
import './Characters.module.scss';
import CharactersInfo from './CharactersInfo';

type SortValue =
  | 'none'
  | 'fame_asc'
  | 'fame_desc'
  | 'class_asc'
  | 'class_desc'
  | 'class_id_asc'
  | 'class_id_desc'
  | 'maxed_asc'
  | 'maxed_desc';
type Option = { label: string; value: string };
type SortOption = Option & { value: SortValue };

interface CharacterProps {
  accountId: string;
  classStats: ClassStat[] | undefined;
  characters: CharUIModel[];
  exalts: ExaltUIModel[] | null;
  ownedSkins?: string;
}

const Characters: React.FC<CharacterProps> = ({
  accountId,
  characters,
  exalts,
  classStats,
  ownedSkins
}) => {
  const dispatch = useAppDispatch();
  const useAccordionMenu = useAppSelector(
    (state) => state.settings.displaySettings.useAccordionMenu
  );

  const selectedClasses = useAppSelector((state) => getSelectedClassesByAccount(state, accountId));
  const characterFilter = useAppSelector((state) => getCharacterFilterByAccount(state, accountId));
  const showHighlightedOnly = useAppSelector(selectShowHighlightedOnly);

  const { selectedItems } = useFilter();
  const { constants } = useConstants();

  const filterOptions: Option[] = [
    { label: 'All', value: 'all' },
    { label: 'Seasonal', value: 'seasonal' },
    { label: 'Regular', value: 'regular' }
  ];

  const [sortSelection, setSortSelection] = useState<SortValue>('none');

  const sortOptions: SortOption[] = [
    { label: 'None', value: 'none' },
    { label: 'Fame ↑', value: 'fame_asc' },
    { label: 'Fame ↓', value: 'fame_desc' },
    { label: 'Maxed ↑', value: 'maxed_asc' },
    { label: 'Maxed ↓', value: 'maxed_desc' },
    { label: 'Class A → Z', value: 'class_asc' },
    { label: 'Class Z → A', value: 'class_desc' },
    { label: 'Class ID ↑', value: 'class_id_asc' },
    { label: 'Class ID ↓', value: 'class_id_desc' }
  ];

  const classOptions = useMemo(
    () =>
      Object.entries(constants?.classes ?? {})
        .map(([id, classObj]) => ({
          label: classObj?.name ?? 'Unknown',
          value: id as ClassID
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [constants]
  );

  const filteredCharacters = useMemo(() => {
    return characters.filter((char) => {
      const seasonalFilter =
        characterFilter === 'all'
          ? true
          : characterFilter === 'seasonal'
            ? char.seasonal
            : !char.seasonal;

      const classFilter =
        selectedClasses.length === 0 ? true : selectedClasses.includes(char.classId);

      if (!showHighlightedOnly) return seasonalFilter && classFilter;

      const itemFilter =
        selectedItems.length === 0
          ? true
          : selectedItems.some(
            (item) =>
              char.equipment.includes(item) || char.equip_qs.map((x) => x.itemId).includes(item)
          );

      return seasonalFilter && classFilter && itemFilter;
    });
  }, [characters, characterFilter, selectedClasses, selectedItems, showHighlightedOnly]);

  const handleFilterChange = useCallback(
    (newFilter: FilterType) => {
      dispatch(setFilter({ accountId, filter: newFilter }));
    },
    [dispatch, accountId]
  );

  const handleSelectedClassesChange = useCallback(
    (newSelectedClasses: ClassID[]) => {
      dispatch(setSelectedClasses({ accountId, selectedClasses: newSelectedClasses }));
    },
    [dispatch, accountId]
  );

  const charactersToDisplay = useMemo(() => {
    const copy = [...filteredCharacters];
    switch (sortSelection) {
      case 'maxed_asc':
        copy.sort((a, b) => {
          const ma = a.mappedStats?.filter((s) => s.maxed).length || 0;
          const mb = b.mappedStats?.filter((s) => s.maxed).length || 0;
          return ma - mb;
        });
        break;
      case 'maxed_desc':
        copy.sort((a, b) => {
          const ma = a.mappedStats?.filter((s) => s.maxed).length || 0;
          const mb = b.mappedStats?.filter((s) => s.maxed).length || 0;
          return mb - ma;
        });
        break;
      case 'class_asc':
        copy.sort((a, b) => a.className.localeCompare(b.className));
        break;
      case 'class_desc':
        copy.sort((a, b) => b.className.localeCompare(a.className));
        break;
      case 'class_id_asc':
        copy.sort((a, b) => (parseInt(String(a.classId), 10) || 0) - (parseInt(String(b.classId), 10) || 0));
        break;
      case 'class_id_desc':
        copy.sort((a, b) => (parseInt(String(b.classId), 10) || 0) - (parseInt(String(a.classId), 10) || 0));
        break;
      case 'fame_asc':
        copy.sort((a, b) => a.fame - b.fame);
        break;
      case 'fame_desc':
        copy.sort((a, b) => b.fame - a.fame);
        break;
      case 'none':
      default:
        break;
    }
    return copy;
  }, [filteredCharacters, sortSelection]);

  return (
    <>
      <div>
        {classStats && (
          <CharactersInfo
            accountId={accountId}
            characters={characters}
            classStats={classStats}
            useAccordionMenu={useAccordionMenu}
            ownedSkins={ownedSkins}
          />
        )}
      </div>
      <div className="flex align-items-center gap-2 mt-3 mb-3">
        <SelectButton
          value={characterFilter}
          options={filterOptions}
          onChange={(e: SelectButtonChangeEvent) => handleFilterChange(e.value)}
          className="p-buttonset-sm"
        />
        <div className="flex-grow-1"></div>
        <MultiSelect
          value={selectedClasses}
          options={classOptions}
          onChange={(e) => handleSelectedClassesChange(e.value)}
          optionLabel="label"
          showClear
          placeholder="Select Classes"
          filter
          filterPlaceholder="Search classes..."
          className="w-20rem"
        />
        <Dropdown
          value={sortSelection}
          options={sortOptions}
          onChange={(e: DropdownChangeEvent) => setSortSelection(e.value as SortValue)}
          optionLabel="label"
          placeholder="Sort..."
          className="w-12rem ml-2"
          appendTo="self"
        />
      </div>

      <div className="flex grid">
        {charactersToDisplay.map((character) => (
          <Character
            key={`${accountId}-${character.id}`}
            accountId={accountId}
            exalts={exalts}
            char={character}
          />
        ))}
      </div>
    </>
  );
};

export default Characters;
