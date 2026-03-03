export type ClassMap = Record<ClassID, Class>;

/** Stats order: HP, MP, ATT, DEF, SPD, DEX, VIT, WIS */
type Stats = [number, number, number, number, number, number, number, number];

/** Equipment slots order: weapon, ability, armor, ring */
type Equipment = [number, number, number, number];

export interface Class {
  name: string;
  base: Stats;
  averages: Stats;
  maxes: Stats;
  slots: Equipment;
}

/** Available class IDs */
export enum ClassID {
  Rogue = '768',
  Archer = '775',
  Wizard = '782',
  Priest = '784',
  Samurai = '785',
  Bard = '796',
  Warrior = '797',
  Knight = '798',
  Paladin = '799',
  Assassin = '800',
  Necromancer = '801',
  Huntress = '802',
  Mystic = '803',
  Trickster = '804',
  Sorcerer = '805',
  Ninja = '806',
  Summoner = '817',
  Kensei = '818',
  Druid = '819'
}
