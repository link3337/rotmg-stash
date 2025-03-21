import { CharUIModel } from '@api/models/char-ui-model';
import { ExaltUIModel } from '@api/models/exalt-ui-model';
import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { ClassStat } from '@realm/models/charlist-response';
import { classes, ClassID } from '@realm/renders/classes';
import {
  FilterType,
  getCharacterFilterByAccount,
  getSelectedClassesByAccount,
  setFilter,
  setSelectedClasses,
  useFilter
} from '@store/slices/FilterSlice';
import { useSettings } from '@store/slices/SettingsSlice';
import { MultiSelect } from 'primereact/multiselect';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import React from 'react';
import { Character } from './Character';
import CharactersInfo from './CharactersInfo';

interface CharacterProps {
  accountId: string;
  classStats: ClassStat[] | undefined;
  characters: CharUIModel[];
  exalts: ExaltUIModel[] | null;
}

const Characters: React.FC<CharacterProps> = ({ accountId, characters, exalts, classStats }) => {
  const dispatch = useAppDispatch();

  const selectedClasses = useAppSelector((state) => getSelectedClassesByAccount(state, accountId));
  const characterFilter = useAppSelector((state) => getCharacterFilterByAccount(state, accountId));

  const { selectedItems } = useFilter();
  const {
    displaySettings: { showTotals }
  } = useSettings();

  const options = [
    { label: 'All', value: 'all' },
    { label: 'Seasonal', value: 'seasonal' },
    { label: 'Regular', value: 'regular' }
  ];

  const classOptions = Object.entries(classes)
    .map(([id, [name]]) => ({
      label: name,
      value: parseInt(id) as ClassID
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filteredCharacters = characters.filter((char) => {
    const seasonalFilter =
      characterFilter === 'all'
        ? true
        : characterFilter === 'seasonal'
          ? char.seasonal
          : !char.seasonal;

    const classFilter = selectedClasses.length === 0 ? true : selectedClasses.includes(char.classId);

    if (!showTotals) return seasonalFilter && classFilter;

    const itemFilter =
      selectedItems.length === 0
        ? true
        : selectedItems.some(
          (item) =>
            char.equipment.includes(item) || char.equip_qs.map((x) => x.itemId).includes(item)
        );

    return seasonalFilter && classFilter && itemFilter;
  });

  const handleFilterChange = (newFilter: FilterType) => {
    dispatch(setFilter({ accountId, filter: newFilter }));
  };

  const handleSelectedClassesChange = (newSelectedClasses: ClassID[]) => {
    dispatch(setSelectedClasses({ accountId, selectedClasses: newSelectedClasses }));
  };

  return (
    <>
      <div>{classStats && <CharactersInfo characters={characters} classStats={classStats} />}</div>
      <div className="flex align-items-center gap-2 mt-3 mb-3">
        <SelectButton
          value={characterFilter}
          options={options}
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
      </div>

      <div className="flex grid">
        {filteredCharacters.map((character) => (
          <Character key={character.id} exalts={exalts} char={character} />
        ))}
      </div>
    </>
  );
};

export default Characters;
