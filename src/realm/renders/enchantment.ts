export type EnchantmentMap = Record<string, Enchantment>;

export interface Enchantment {
  displayId: string;
  description: string;
  x: number;
  y: number;
}
