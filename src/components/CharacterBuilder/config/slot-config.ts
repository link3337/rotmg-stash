export const DEFAULT_CLASS_SLOT_CONFIG: ClassSlotConfig = {
  weapon: [
    1, // swords / flails
    2, // daggers / blades
    3, // bows / longbows
    8, // wands /morning stars
    17, // staves / spellblades
    24 // katanas / tachis
  ],
  ability: [
    4, // tomes
    5, // shields
    11, // spells
    12, // seals
    13, // cloaks
    15, // quivers
    16, // helmets
    18, // poisons
    19, // skulls
    20, // traps
    21, // orbs
    22, // prisms
    23, // scepters
    25, // stars
    27, // wakizashis
    28, // lutes
    29, // maces
    30, // sheathes
    31 // sigils
  ],
  armor: [
    6, // leather armors
    7, // heavy armors
    14 // robes
  ],
  ring: [9],
  cloth1: [],
  cloth2: []
};

export const CLASS_SLOT_CONFIG: Record<string, Partial<ClassSlotConfig>> = {
  Archer: {
    weapon: [3],
    ability: [15],
    armor: [6],
    ring: [9]
  },
  Assassin: {
    weapon: [2],
    ability: [18],
    armor: [6],
    ring: [9]
  },
  Bard: {
    weapon: [3],
    ability: [28],
    armor: [14],
    ring: [9]
  },
  Druid: {
    weapon: [8],
    ability: [31],
    armor: [6],
    ring: [9]
  },
  Huntress: {
    weapon: [3],
    ability: [20],
    armor: [6],
    ring: [9]
  },
  Kensei: {
    weapon: [24],
    ability: [30],
    armor: [7],
    ring: [9]
  },
  Knight: {
    weapon: [1],
    ability: [5],
    armor: [7],
    ring: [9]
  },
  Mystic: {
    weapon: [17],
    ability: [21],
    armor: [14],
    ring: [9]
  },
  Necromancer: {
    weapon: [17],
    ability: [19],
    armor: [14],
    ring: [9]
  },
  Ninja: {
    weapon: [24],
    ability: [25],
    armor: [6],
    ring: [9]
  },
  Paladin: {
    weapon: [1],
    ability: [12],
    armor: [7],
    ring: [9]
  },
  Priest: {
    weapon: [8],
    ability: [4],
    armor: [14],
    ring: [9]
  },
  Rogue: {
    weapon: [2],
    ability: [13],
    armor: [6],
    ring: [9]
  },
  Samurai: {
    weapon: [24],
    ability: [27],
    armor: [7],
    ring: [9]
  },
  Sorcerer: {
    weapon: [8],
    ability: [23],
    armor: [14],
    ring: [9]
  },
  Summoner: {
    weapon: [8],
    ability: [29],
    armor: [14],
    ring: [9]
  },
  Trickster: {
    weapon: [2],
    ability: [22],
    armor: [6],
    ring: [9]
  },
  Warrior: {
    weapon: [1],
    ability: [16],
    armor: [7],
    ring: [9]
  },
  Wizard: {
    weapon: [17],
    ability: [11],
    armor: [14],
    ring: [9]
  }
};

export const SLOT_LABELS: Record<BuildSlot, string> = {
  weapon: 'Weapon',
  ability: 'Ability',
  armor: 'Armor',
  ring: 'Ring',
  cloth1: 'Big Cloth',
  cloth2: 'Small Cloth'
};

export type BuildSlot = 'weapon' | 'ability' | 'armor' | 'ring' | 'cloth1' | 'cloth2';
export type ClassSlotConfig = Record<BuildSlot, number[]>;
