import { CharUIModel, ItemUIModel } from '@api/models/char-ui-model';
import { Account } from '@realm/models/charlist-response';
import { consumableIds } from '@realm/renders/consumables';
import { calculateStars } from '@utils/stars';
import { AccountUIModel, StarInfoUIModel } from '../models/account-ui-model';
import { calculatePotionTotals, mapConsumables, mapToCompactVaultUIModel } from './item-mapping';
import { objectToArray, parseItemList } from './util';

export function mapAccount(account: Account, charList: CharUIModel[]): AccountUIModel | null {
  if (!account) return null;

  const mappedVaultItems = mapChest(account.Vault?.Chest || []);

  // Check gift chests
  const giftItems: string = account.Gifts || '';
  const mappedGiftItems: number[] = parseItemList(giftItems);

  // Check seasonal spoils
  const seasonalSpoils: string = account.TemporaryGifts || '';
  const mappedSeasonalSpoils: number[] = parseItemList(seasonalSpoils);

  // check potion storage
  const potions: string = account.Potions || '';
  const mappedPotions: number[] = parseItemList(potions);

  // check material storage
  const mappedMaterialStorage: number[] = mapChest(account.MaterialStorage?.Chest || []);

  // map from char
  const charItems: number[] = charList?.flatMap((char) => char?.equipment) || [];

  // check char quickslots
  const quickslots: ItemUIModel[] = charList.flatMap((x) => x.equip_qs);

  // Combine all items
  const allItemsWithoutQuickSlots: number[] = [
    ...mappedGiftItems,
    ...charItems,
    ...mappedSeasonalSpoils,
    ...mappedVaultItems,
    ...mappedPotions,
    ...mappedMaterialStorage
  ];

  const allItems = [...allItemsWithoutQuickSlots, ...quickslots.map((x) => x.itemId)];

  const consumablesUiModel = mapConsumables(allItemsWithoutQuickSlots, quickslots, consumableIds);

  const potionsUIModel = calculatePotionTotals(mappedPotions || []);

  const uniqueItems: Set<number> = new Set(allItems);

  const classStats = objectToArray(account.Stats?.ClassStats);

  // map to ui model already
  const vaultUIModel: ItemUIModel[] = mapToCompactVaultUIModel(mappedVaultItems);
  const giftsUIModel: ItemUIModel[] = mapToCompactVaultUIModel(mappedGiftItems);
  const seasonalSpoilsUIModel: ItemUIModel[] = mapToCompactVaultUIModel(mappedSeasonalSpoils);
  const materialStorageUIModel: ItemUIModel[] = mapToCompactVaultUIModel(mappedMaterialStorage);

  const totalItemsCount =
    (mappedVaultItems?.flat().filter((x) => x !== -1).length ?? 0) +
    (mappedGiftItems?.length ?? 0) +
    (mappedSeasonalSpoils?.length ?? 0) +
    (mappedMaterialStorage?.filter((x) => x !== -1).length ?? 0) +
    (charList?.reduce(
      (total, char) => total + (char.equipment?.filter((x) => x !== -1).length ?? 0),
      0
    ) ?? 0) +
    charList?.reduce(
      (total, char) => total + (char.equip_qs.reduce((sum, x) => sum + (x.amount ?? 0), 0) ?? 0),
      0
    );

  const starInfo: StarInfoUIModel = calculateStars(classStats ?? []);
  const totalAliveFame = charList?.reduce((acc, char) => acc + (char.fame || 0), 0);

  return {
    id: account.AccountId,
    credits: account.Credits ? parseInt(account.Credits, 10) : 0,
    fortuneToken: account.FortuneToken ? parseInt(account.FortuneToken, 10) : 0,
    unityCampaignPoints: account.UnityCampaignPoints
      ? parseInt(account.UnityCampaignPoints, 10)
      : 0,
    earlyGameEventTracker: account.EarlyGameEventTracker
      ? parseInt(account.EarlyGameEventTracker, 10)
      : 0,
    creationTimestamp: account.CreationTimestamp,
    enchanterSupportDust: account.EnchanterSupportDust
      ? parseInt(account.EnchanterSupportDust, 10)
      : 0,
    vault: mappedVaultItems,
    materialStorage: mappedMaterialStorage,
    gifts: mappedGiftItems,
    seasonalSpoils: mappedSeasonalSpoils,
    potions: mappedPotions,
    maxNumChars: account.MaxNumChars ? parseInt(account.MaxNumChars, 10) : 0,
    lastServer: account.LastServer,
    originating: account.Originating,
    petYardType: account.PetYardType ? parseInt(account.PetYardType, 10) : 0,
    forgeFireEnergy: account.ForgeFireEnergy ? parseInt(account.ForgeFireEnergy, 10) : 0,
    regularForgeFireBlueprints: account.RegularForgeFireBlueprints,
    name: account.Name,
    bestCharFame: account.Stats?.BestCharFame ? parseInt(account.Stats.BestCharFame, 10) : 0,
    totalFame: account.Stats?.TotalFame ? parseInt(account.Stats.TotalFame, 10) : 0,
    fame: account.Stats?.Fame ? parseInt(account.Stats.Fame, 10) : 0,
    guildName: account.Guild?.Name ?? '',
    guildRank: account.Guild?.Rank ? parseInt(account.Guild.Rank, 10) : 0,
    accessTokenTimestamp: account.AccessTokenTimestamp,
    accessTokenExpiration: account.AccessTokenExpiration,
    ownedSkins: account.OwnedSkins,
    classStats,

    // special mappings / info
    materialStorageUIModel: materialStorageUIModel,
    vaultUIModel: vaultUIModel,
    seasonalSpoilsUIModel: seasonalSpoilsUIModel,
    giftsUIModel: giftsUIModel,
    potionsUIModel: potionsUIModel,
    consumables: consumablesUiModel,
    uniqueItems: Array.from(uniqueItems),
    totalItems: totalItemsCount,
    starInfo,
    totalAliveFame
  };
}

function mapChest(chest: string | string[]): number[] {
  let mappedItems: number[] = [];
  if (Array.isArray(chest)) {
    const vaultItems = chest?.flat() || [];
    mappedItems = vaultItems?.flatMap((item) =>
      item?.split(',').map((x) => parseInt(x.split('#')[0], 10))
    );
  }
  if (typeof chest === 'string') {
    const vaultItems = chest?.split(',') || [];
    mappedItems = vaultItems.map((item) => parseInt(item.split('#')[0], 10));
  }
  return mappedItems;
}
