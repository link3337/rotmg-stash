export interface CharUIModel {
  id: number;
  class: number;
  seasonal: boolean;
  level: number;
  exp: number;
  fame: number;
  equipment: number[];
  equip_qs: ItemUIModel[];
  stats: {
    maxHP: number;
    hp: number;
    maxMP: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
    dexterity: number;
    vitality: number;
    wisdom: number;
  };
  health_stack_count: number;
  magic_stack_count: number;
  dead: boolean;
  pet: {
    name: string | undefined;
    type: number;
    instance_id: number;
    rarity: number;
    max_ability_power: number;
    skin: number;
    shader: number;
    created_on: string | undefined;
    inc_inv: number;
    inv: string | undefined;
    ability1_type: number;
    ability1_power: number;
    ability1_points: number;
    ability2_type: number;
    ability2_power: number;
    ability2_points: number;
    ability3_type: number;
    ability3_points: number;
  };
  petAbility3Points: number;
  account_name: string;
  backpack_slots: number;
  has3_quickslots: number;
  creation_date: string | undefined;
  pcstats: string;
  tex1: string | null;
  tex2: string | null;
  texture: string | null;
  xpboosted: number;
  xptimer: number;
  lootdrop: number;
  loottier: number;
  crucible: boolean | null;
  objectType: string;
}

export interface ItemUIModel {
  itemId: number;
  amount?: number;
}
