/**
 * Represents the response received when fetching the character list.
 */
export interface CharListResponse {
  /**
   * The ID of the next character.
   */
  nextCharId: string;

  /**
   * The maximum number of characters allowed.
   */
  maxNumChars: string;

  /**
   * The character or list of characters.
   */
  Char?: Char | Char[];

  /**
   * The account information.
   */
  Account: Account;

  /**
   * The news information, if available.
   */
  News: News | null;

  /**
   * The server information.
   */
  Servers: Servers;

  /**
   * The latitude coordinate.
   */
  Lat: string;

  /**
   * The longitude coordinate.
   */
  Long: string;

  /**
   * The email for the newsletter.
   */
  NewsletterEmail: string;

  /**
   * The list of class availability.
   */
  ClassAvailabilityList: ClassAvailabilityList;

  /**
   * The costs of items.
   */
  ItemCosts: ItemCosts;

  /**
   * The power-up stats, if available.
   */
  PowerUpStats: PowerUpStats | null;

  /**
   * The Deca signup popup information, if available.
   */
  DecaSignupPopup?: string | null;

  /**
   * Indicates if there are temporary gifts.
   */
  HasTemporaryGifts: null;

  /**
   * The list of maximum class levels, if available.
   */
  MaxClassLevelList: MaxClassLevelList | null;

  /**
   * The accelerators information.
   */
  Accelerators: string;

  /**
   * The timestamp of the response.
   */
  Timestamp: string;

  /**
   * The DLD login information.
   */
  DLDLogin: null;

  /**
   * The costs for pet inventory upgrades.
   */
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

/**
 * Represents an account in the game.
 */
export interface Account {
  /**
   * The number of credits the account has.
   */
  Credits: string;

  /**
   * The number of fortune tokens the account has.
   */
  FortuneToken: string;

  /**
   * The number of Unity campaign points the account has.
   */
  UnityCampaignPoints: string;

  /**
   * The price for the next character slot.
   */
  NextCharSlotPrice: string;

  /**
   * Tracker for early game events.
   */
  EarlyGameEventTracker: string;

  /**
   * The unique identifier for the account.
   */
  AccountId: string;

  /**
   * The timestamp when the account was created.
   */
  CreationTimestamp: string;

  /**
   * The favorite pet of the account, if any.
   */
  FavoritePet?: string;

  /**
   * Indicates if the account is a supporter.
   */
  IsSupporter?: null;

  /**
   * The amount of enchanter support dust the account has.
   */
  EnchanterSupportDust: string;

  /**
   * The vault associated with the account.
   */
  Vault: Vault;

  /**
   * The material storage associated with the account.
   */
  MaterialStorage: Vault;

  /**
   * The gifts associated with the account.
   */
  Gifts: string;

  /**
   * The temporary gifts associated with the account.
   */
  TemporaryGifts: string;

  /**
   * Information about unique temporary gift items.
   */
  UniqueTemporaryGiftItemInfo: UniqueTemporaryGiftItemInfo;

  /**
   * The potions associated with the account.
   */
  Potions: string;

  /**
   * Information about unique items.
   */
  UniqueItemInfo: UniqueTemporaryGiftItemInfo;

  /**
   * Data for material storage.
   */
  MaterialStorageData: null;

  /**
   * Indicates if the account has gifts.
   */
  HasGifts: null;

  /**
   * Indicates if the email associated with the account is verified.
   */
  VerifiedEmail: null;

  /**
   * Indicates if the account has completed the tutorial.
   */
  TDone: null;

  /**
   * Information about the Deca signup popup.
   */
  DecaSignupPopup: any | null;

  /**
   * The maximum number of characters the account can have.
   */
  MaxNumChars: string;

  /**
   * The timestamp until which the account is muted.
   */
  MutedUntil: string;

  /**
   * The last server the account logged into.
   */
  LastServer: string;

  /**
   * The wait time for teleportation.
   */
  TeleportWait: string;

  /**
   * The originating server or region.
   */
  Originating: string;

  /**
   * The type of pet yard the account has.
   */
  PetYardType: string;

  /**
   * The last login timestamp.
   */
  LastLogin: string;

  /**
   * The amount of forge fire energy the account has.
   */
  ForgeFireEnergy: string;

  /**
   * The regular forge fire blueprints the account has.
   */
  RegularForgeFireBlueprints: string | null;

  /**
   * The campaigns associated with the account.
   */
  Campaigns: null;

  /**
   * The name of the account.
   */
  Name: string;

  /**
   * Indicates if the name was chosen by the user.
   */
  NameChosen: null;

  /**
   * The payment provider associated with the account.
   */
  PaymentProvider: string;

  /**
   * Indicates if the account has been converted.
   */
  Converted?: null;

  /**
   * Indicates if the account's age has been verified.
   */
  IsAgeVerified: string;

  /**
   * The security questions associated with the account.
   */
  SecurityQuestions: SecurityQuestions;

  /**
   * The stats associated with the account.
   */
  Stats: Stats;

  /**
   * The guild associated with the account, if any.
   */
  Guild?: Guild;

  /**
   * The access token for the account.
   */
  AccessToken: null;

  /**
   * The timestamp when the access token was issued.
   */
  AccessTokenTimestamp: string;

  /**
   * The expiration timestamp for the access token.
   */
  AccessTokenExpiration: string;

  /**
   * The skins owned by the account.
   */
  OwnedSkins: string;

  /**
   * The titles owned by the account, if any.
   */
  OwnedTitles?: string;

  /**
   * The gravestones owned by the account, if any.
   */
  OwnedGravestones?: string;

  /**
   * The gravestones associated with the account, if any.
   */
  Gravestones?: string;

  /**
   * The emotes owned by the account, if any.
   */
  OwnedEmotes?: string;

  /**
   * The entrances owned by the account, if any.
   */
  OwnedEntrances?: string;

  /**
   * Indicates if the account is discoverable.
   */
  Discoverable: null;

  /**
   * The discovery icon associated with the account, if any.
   */
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

/**
 * Represents a character in the game.
 */
export interface Char {
  /**
   * The unique identifier of the character.
   */
  id: string;

  /**
   * The object type of the character.
   */
  ObjectType: string;

  /**
   * Indicates if the character is seasonal.
   */
  Seasonal: string;

  /**
   * The level of the character.
   */
  Level: string;

  /**
   * The experience points of the character.
   */
  Exp: string;

  /**
   * The current fame of the character.
   */
  CurrentFame: string;

  /**
   * The equipment of the character.
   */
  Equipment: string;

  /**
   * The quick slots equipment of the character.
   */
  EquipQS: string;

  /**
   * The maximum hit points of the character.
   */
  MaxHitPoints: string;

  /**
   * The current hit points of the character.
   */
  HitPoints: string;

  /**
   * The maximum magic points of the character.
   */
  MaxMagicPoints: string;

  /**
   * The current magic points of the character.
   */
  MagicPoints: string;

  /**
   * The attack stat of the character.
   */
  Attack: string;

  /**
   * The defense stat of the character.
   */
  Defense: string;

  /**
   * The speed stat of the character.
   */
  Speed: string;

  /**
   * The dexterity stat of the character.
   */
  Dexterity: string;

  /**
   * The hit points regeneration rate of the character.
   */
  HpRegen: string;

  /**
   * The magic points regeneration rate of the character.
   */
  MpRegen: string;

  /**
   * The PC stats of the character.
   */
  PCStats: string;

  /**
   * The health stack count of the character.
   */
  HealthStackCount: string;

  /**
   * The magic stack count of the character.
   */
  MagicStackCount: string;

  /**
   * Indicates if the character is dead.
   */
  Dead: string;

  /**
   * The setup stage of the character.
   */
  SetupStage: string;

  /**
   * The pet associated with the character.
   */
  Pet?: Pet;

  /**
   * The account name associated with the character.
   */
  Account: AccountName;

  /**
   * The texture of the character.
   */
  Texture?: string;

  /**
   * The entrance location of the character.
   */
  Entrance: string;

  /**
   * Indicates if the character is XP boosted.
   */
  XpBoosted: string;

  /**
   * The XP timer of the character.
   */
  XpTimer: string;

  /**
   * The LD timer of the character.
   */
  LDTimer: string;

  /**
   * The LT timer of the character.
   */
  LTTimer: string;

  /**
   * The unique item information of the character.
   */
  UniqueItemInfo: UniqueItemInfoSecondary;

  /**
   * The number of backpack slots of the character.
   */
  BackpackSlots: string;

  /**
   * Indicates if the character has 3 quick slots.
   */
  Has3Quickslots: string;

  /**
   * Indicates if the crucible is active for the character.
   */
  CrucibleActive: null | string;

  /**
   * The creation date of the character.
   */
  CreationDate?: string;

  /**
   * The creation timestamp of the character.
   */
  CreationTimestamp?: string;

  /**
   * The first texture of the character.
   */
  Tex1?: string;

  /**
   * The second texture of the character.
   */
  Tex2?: string;

  /**
   * The titles of the character.
   */
  Titles?: string;

  /**
   * The shader of the character.
   */
  Shader?: string;
}

interface UniqueItemInfoSecondary {
  ItemData: ItemDataSecondary[];
}

interface ItemDataSecondary {
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
  ItemData: ItemData[];
}