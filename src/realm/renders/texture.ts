export type TextureMap = Record<number, Texture>;

export interface Texture {
  clothingId: string;
  clothingType: number;
  accessoryId: string;
  accessoryType: number;
}
