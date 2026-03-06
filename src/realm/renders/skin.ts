export type SkinMap = Record<number, Skin>;

export interface Skin {
  name: string;
  index: number;
  is16x16: boolean;
  sheet: string;
  classType: number;
}
