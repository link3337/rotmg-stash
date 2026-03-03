export type PetSkinMap = Record<number, PetSkin>;

export interface PetSkin {
  name: string;
  displayId: string;
  itemTier: number;
  family: string;
  rarity: string;
  animIndex: number;
  is16x16: boolean;
  sheet: string;
}
