export type RealmItemMap = Record<string, RealmItem>;

export interface RealmItem {
  /**
   * The name of the item.
   */
  name: string;

  /**
   * The technical name of the item.
   */
  technicalName: string;

  /**
   * The slot type of the item.
   */
  slotType: string;

  /**
   * The tier of the item.
   */
  tier: string;

  /**
   * The x-coordinate of the item.
   */
  x: number;

  /**
   * The y-coordinate of the item.
   */
  y: number;

  /**
   * The fame bonus of the item.
   */
  fameBonus: number;

  /**
   * The feed power of the item.
   */
  feedPower: number;

  /**
   * The bag type of the item.
   */
  bagType: number;

  /**
   * Indicates if the item is soulbound.
   */
  isSoulbound: boolean;

  /**
   * The UT/ST value of the item.
   */
  utst: number;

  /**
   * Indicates if the item is shiny.
   */
  isShiny: boolean;
}
