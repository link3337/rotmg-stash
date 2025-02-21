import { ClassStat } from '@realm/models/charlist-response';
import { ItemUIModel } from './char-ui-model';

export interface AccountUIModel {
  id: string;
  name: string;
  credits: number;
  fortuneToken: number;
  unityCampaignPoints: number;
  earlyGameEventTracker: number;
  creationTimestamp: string;
  enchanterSupportDust: number;
  vault: number[];
  materialStorage: number[];
  gifts: number[];
  seasonalSpoils: number[];
  potions: number[];
  maxNumChars: number;
  lastServer: string;
  originating: string;
  petYardType: number;
  forgeFireEnergy: number;
  regularForgeFireBlueprints: string | null;
  bestCharFame: number;
  totalFame: number;
  fame: number;
  guildName: string;
  guildRank: number;
  accessTokenTimestamp: string;
  accessTokenExpiration: string;
  ownedSkins: string;
  classStats: ClassStat[];

  // mappings / info
  materialStorageUIModel: ItemUIModel[];
  vaultUIModel: ItemUIModel[];
  seasonalSpoilsUIModel: ItemUIModel[];
  giftsUIModel: ItemUIModel[];
  potionsUIModel: ItemUIModel[];
  consumables: ItemUIModel[];
  uniqueItems: number[];
  totalItems: number; // amount of totalItems the account has
  starInfo: StarInfoUIModel;
  totalAliveFame: number;
}

export interface StarInfoUIModel {
  stars: number;
  color: string;
}
