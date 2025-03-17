import { mapToUIModel } from '@api/mapping/item-mapping';
import { AccountUIModel } from '@api/models/account-ui-model';
import { ItemUIModel } from '@api/models/char-ui-model';
import { useAppSelector } from '@hooks/redux';
import { selectSelectedItems } from '@store/slices/FilterSlice';
import { useSettings } from '@store/slices/SettingsSlice';
import Vault from './Vault';

interface VaultOverviewProps {
  account?: AccountUIModel | null;
}

const VaultOverview: React.FC<VaultOverviewProps> = ({ account }) => {
  const {
    displaySettings: {
      compactVaults,
      showPotions,
      showConsumables,
      showVault,
      showGiftChest,
      showSeasonalSpoils,
      showMaterials
    }
  } = useSettings();
  const activeFilters = useAppSelector(selectSelectedItems);

  // already mapped for "compact" mode
  const consumables: ItemUIModel[] = account?.consumables || [];
  const potions: ItemUIModel[] = account?.potionsUIModel || [];

  const rawVault = account?.vault || [];
  const rawGifts = account?.gifts || [];
  const rawSeasonalSpoils = account?.seasonalSpoils || [];
  const rawMaterials = account?.materialStorage || [];

  const vaultUIModel: ItemUIModel[] = compactVaults
    ? account?.vaultUIModel || []
    : mapToUIModel(rawVault);

  const giftsUIModel: ItemUIModel[] = compactVaults
    ? account?.giftsUIModel || []
    : mapToUIModel(rawGifts);

  const seasonalSpoilsUIModel: ItemUIModel[] = compactVaults
    ? account?.seasonalSpoilsUIModel || []
    : mapToUIModel(rawSeasonalSpoils);

  const materialsUIModel: ItemUIModel[] = compactVaults
    ? account?.materialStorageUIModel || []
    : mapToUIModel(rawMaterials);

  const filterItems = (items: ItemUIModel[]) => {
    if (activeFilters.length === 0) {
      return items;
    }
    return items.filter((item) => activeFilters.includes(item.itemId));
  };

  const filteredVaultItems: ItemUIModel[] = showVault ? filterItems(vaultUIModel) : [];
  const filteredGiftItems: ItemUIModel[] = showGiftChest ? filterItems(giftsUIModel) : [];
  const filteredSeasonalSpoilsItems: ItemUIModel[] = showSeasonalSpoils
    ? filterItems(seasonalSpoilsUIModel)
    : [];
  const filteredMaterialsItems: ItemUIModel[] = showMaterials ? filterItems(materialsUIModel) : [];
  const filteredPotionItems: ItemUIModel[] = showPotions ? filterItems(potions || []) : [];
  const filteredConsumableItems: ItemUIModel[] = showConsumables ? filterItems(consumables) : [];

  return (
    <>
      {showVault && filteredVaultItems.length > 0 && (
        <Vault title="Vault" items={filteredVaultItems} />
      )}
      {showGiftChest && filteredGiftItems.length > 0 && (
        <Vault title="Gift Chest" items={filteredGiftItems} />
      )}
      {showSeasonalSpoils && filteredSeasonalSpoilsItems.length > 0 && (
        <Vault title="Seasonal Spoils" items={filteredSeasonalSpoilsItems} />
      )}
      {showMaterials && filteredMaterialsItems.length > 0 && (
        <Vault title="Material" items={filteredMaterialsItems} />
      )}
      {showPotions && filteredPotionItems.length > 0 && (
        <Vault title="Potion Storage" items={filteredPotionItems} />
      )}
      {showConsumables && filteredConsumableItems.length > 0 && (
        <Vault title="Consumables" items={filteredConsumableItems} />
      )}
    </>
  );
};

export default VaultOverview;
