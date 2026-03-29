import { ClassMap } from './classes';
import { EnchantmentMap } from './enchantment';
import { RealmItemMap } from './item';
import { PetMap } from './pet';
import { PetAbilityMap } from './pet-abilitiy';
import { PetSkinMap } from './pet-skin';
import { SkinMap } from './skin';
import { TextureMap } from './texture';

export interface Constants {
  version: string;
  gameVersion: string;
  items: RealmItemMap;
  enchantments: EnchantmentMap;
  classes: ClassMap;
  skins: SkinMap;
  petAbilities: PetAbilityMap;
  textures: TextureMap;
  pets: PetMap;
  petSkins: PetSkinMap;
}

export interface Sheets {
  textiles: Record<string, any>;
  skinsheets: Record<string, any>;
  petSkinsheets: Record<string, any>;
  renders: string;
}
