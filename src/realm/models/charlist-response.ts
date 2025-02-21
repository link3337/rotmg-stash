export interface CharListResponse {
  nextCharId: string;
  maxNumChars: string;
  Char?: Char | Char[];
  Account: Account;
  News: News | null;
  Servers: Servers;
  Lat: string;
  Long: string;
  NewsletterEmail: string;
  ClassAvailabilityList: ClassAvailabilityList;
  ItemCosts: ItemCosts;
  PowerUpStats: PowerUpStats | null;
  DecaSignupPopup?: string | null;
  HasTemporaryGifts: null;
  MaxClassLevelList: MaxClassLevelList | null;
  Accelerators: string;
  Timestamp: string;
  DLDLogin: null;
  PetInvUpgradeCosts: string;
}

interface MaxClassLevelList {
  MaxClassLevel: MaxClassLevel | MaxClassLevel[];
}

export interface MaxClassLevel {
  classType: string;
  maxLevel: string;
}

export interface PowerUpStats {
  ClassStats: ExaltStats[];
  ClaimedItem: string[];
}

export interface ExaltStats {
  class: string;
  '#text': string;
}

interface ItemCosts {
  ItemCost: ItemCost[];
}

interface ItemCost {
  type: string;
  purchasable: string;
  expires: string;
  '#text': string;
}

interface ClassAvailabilityList {
  ClassAvailability: ClassAvailability[];
}

interface ClassAvailability {
  id: string;
  '#text': string;
}

interface Servers {
  Server: Server[];
}

interface Server {
  Name: string;
  DNS: string;
  Lat: string;
  Long: string;
  Usage: string;
}

interface News {
  Item: Item[];
}

export interface Item {
  Icon: string;
  Title: string;
  Seasonal: string;
  TagLine: string;
  Link: string;
  Date: string;
}

export interface Account {
  Credits: string;
  FortuneToken: string;
  UnityCampaignPoints: string;
  NextCharSlotPrice: string;
  EarlyGameEventTracker: string;
  AccountId: string;
  CreationTimestamp: string;
  FavoritePet?: string;
  IsSupporter?: null;
  EnchanterSupportDust: string;
  Vault: Vault;
  MaterialStorage: Vault;
  Gifts: string;
  TemporaryGifts: string;
  UniqueTemporaryGiftItemInfo: UniqueTemporaryGiftItemInfo;
  Potions: string;
  UniqueItemInfo: UniqueTemporaryGiftItemInfo;
  MaterialStorageData: null;
  HasGifts: null;
  VerifiedEmail: null;
  TDone: null;
  DecaSignupPopup: any | null;
  MaxNumChars: string;
  MutedUntil: string;
  LastServer: string;
  TeleportWait: string;
  Originating: string;
  PetYardType: string;
  LastLogin: string;
  ForgeFireEnergy: string;
  RegularForgeFireBlueprints: string | null;
  Campaigns: null;
  Name: string;
  NameChosen: null;
  PaymentProvider: string;
  Converted?: null;
  IsAgeVerified: string;
  SecurityQuestions: SecurityQuestions;
  Stats: Stats;
  Guild?: Guild;
  AccessToken: null;
  AccessTokenTimestamp: string;
  AccessTokenExpiration: string;
  OwnedSkins: string;
  OwnedTitles?: string;
  OwnedGravestones?: string;
  Gravestones?: string;
  OwnedEmotes?: string;
  OwnedEntrances?: string;
  Discoverable: null;
  DiscoveryIcon?: string;
}

export interface Guild {
  id: string;
  Name: string;
  Rank: string;
}

export interface Stats {
  ClassStats: ClassStat | ClassStat[];
  BestCharFame: string;
  TotalFame: string;
  Fame: string;
}

export interface ClassStat {
  objectType: string;
  BestLevel: string;
  BestBaseFame: string;
  BestTotalFame: string;
}

interface SecurityQuestions {
  HasSecurityQuestions: string;
  ShowSecurityQuestionsDialog: string;
  SecurityQuestionsKeys: SecurityQuestionsKeys;
}

interface SecurityQuestionsKeys {
  SecurityQuestionsKey: string[];
}

interface UniqueTemporaryGiftItemInfo {
  ItemData: ItemData | ItemData[];
}

interface ItemData {
  id: string;
  type: string;
  '#text'?: string;
}

export interface Vault {
  Chest: string | string[];
}

export interface Char {
  id: string;
  ObjectType: string;
  Seasonal: string;
  Level: string;
  Exp: string;
  CurrentFame: string;
  Equipment: string;
  EquipQS: string;
  MaxHitPoints: string;
  HitPoints: string;
  MaxMagicPoints: string;
  MagicPoints: string;
  Attack: string;
  Defense: string;
  Speed: string;
  Dexterity: string;
  HpRegen: string;
  MpRegen: string;
  PCStats: string;
  HealthStackCount: string;
  MagicStackCount: string;
  Dead: string;
  SetupStage: string;
  Pet?: Pet;
  Account: AccountName;
  Texture?: string;
  Entrance: string;
  XpBoosted: string;
  XpTimer: string;
  LDTimer: string;
  LTTimer: string;
  UniqueItemInfo: UniqueItemInfo2;
  BackpackSlots: string;
  Has3Quickslots: string;
  CrucibleActive: null | string;
  CreationDate?: string;
  CreationTimestamp?: string;
  Tex1?: string;
  Tex2?: string;
  Titles?: string;
  Shader?: string;
}

interface UniqueItemInfo2 {
  ItemData: ItemDatum2[];
}

interface ItemDatum2 {
  type: string;
  '#text'?: string;
}

interface AccountName {
  Name: string;
}

interface Pet {
  name: string;
  type: string;
  instanceId: string;
  rarity: string;
  maxAbilityPower: string;
  skin: string;
  shader: string;
  createdOn: string;
  incInv: string;
  inv: string;
  UniqueItemInfo: UniqueItemInfo | null;
  Abilities: Abilities;
}

interface Abilities {
  Ability: Ability[];
}

interface Ability {
  type: string;
  power: string;
  points: string;
}

interface UniqueItemInfo {
  ItemData: ItemDatum[];
}

interface ItemDatum {
  id: string;
  type: string;
  '#text': string;
}
