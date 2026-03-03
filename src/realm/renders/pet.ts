export type PetMap = Record<number, Pet>;

export interface Pet {
  name: string;
  family: string;
  rarity: string;
  defaultSkin: string;
  size: number;
}
