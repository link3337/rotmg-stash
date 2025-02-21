/** Stats order: HP, MP, ATT, DEF, SPD, DEX, VIT, WIS */
type Stats = [number, number, number, number, number, number, number, number];

/** Equipment slots order: weapon, ability, armor, ring */
type Equipment = [number, number, number, number];

/** Class data structure */
type ClassData = [
  name: string,
  baseStats: Stats,
  growthStats: Stats,
  maxStats: Stats,
  equipment: Equipment
];

/** Available class IDs */
export enum ClassID {
  Rogue = 768,
  Archer = 775,
  Wizard = 782,
  Priest = 784,
  Samurai = 785,
  Bard = 796,
  Warrior = 797,
  Knight = 798,
  Paladin = 799,
  Assassin = 800,
  Necromancer = 801,
  Huntress = 802,
  Mystic = 803,
  Trickster = 804,
  Sorcerer = 805,
  Ninja = 806,
  Summoner = 817,
  Kensei = 818
}

/** Map of class IDs to class data */
type Classes = {
  [K in ClassID]: ClassData;
};

export const classes: Classes = {
  [ClassID.Rogue]: [
    'Rogue',
    [150, 100, 16, 0, 26, 17, 5, 15],
    [625, 195, 35, 9, 45, 55, 24, 34],
    [750, 252, 55, 25, 65, 75, 40, 50],
    [2, 13, 6, 9]
  ],
  [ClassID.Archer]: [
    'Archer',
    [150, 100, 17, 0, 22, 15, 5, 15],
    [625, 195, 55, 9, 41, 34, 24, 34],
    [750, 252, 75, 25, 55, 50, 40, 50],
    [3, 15, 6, 9]
  ],
  [ClassID.Wizard]: [
    'Wizard',
    [100, 100, 17, 0, 10, 15, 12, 12],
    [575, 290, 55, 9, 36, 55, 36, 42],
    [700, 385, 75, 25, 50, 75, 40, 60],
    [17, 11, 14, 9]
  ],
  [ClassID.Priest]: [
    'Priest',
    [100, 100, 12, 0, 12, 12, 10, 15],
    [575, 290, 35, 9, 41, 42, 24, 55],
    [700, 385, 55, 25, 55, 60, 40, 75],
    [8, 4, 14, 9]
  ],
  [ClassID.Samurai]: [
    'Samurai',
    [150, 100, 17, 1, 22, 16, 23, 23],
    [625, 195, 55, 10, 41, 35, 42, 42],
    [800, 252, 75, 30, 55, 55, 60, 60],
    [24, 27, 7, 9]
  ],
  [ClassID.Bard]: [
    'Bard',
    [150, 100, 20, 0, 22, 12, 10, 17],
    [625, 290, 39, 9, 36, 50, 29, 55],
    [750, 385, 55, 25, 55, 70, 45, 75],
    [3, 28, 14, 9]
  ],
  [ClassID.Warrior]: [
    'Warrior',
    [200, 100, 17, 0, 17, 15, 17, 15],
    [675, 195, 55, 9, 36, 34, 55, 34],
    [800, 252, 75, 25, 50, 50, 75, 50],
    [1, 16, 7, 9]
  ],
  [ClassID.Knight]: [
    'Knight',
    [200, 100, 15, 1, 17, 15, 17, 15],
    [675, 195, 34, 20, 36, 34, 55, 34],
    [800, 252, 50, 40, 50, 50, 75, 50],
    [1, 5, 7, 9]
  ],
  [ClassID.Paladin]: [
    'Paladin',
    [200, 100, 16, 1, 22, 18, 23, 17],
    [675, 195, 35, 10, 41, 37, 42, 55],
    [800, 252, 55, 30, 55, 55, 60, 75],
    [1, 12, 7, 9]
  ],
  [ClassID.Assassin]: [
    'Assassin',
    [150, 100, 26, 0, 26, 17, 5, 23],
    [625, 214, 45, 9, 45, 55, 34, 42],
    [750, 305, 65, 25, 65, 75, 40, 60],
    [2, 18, 6, 9]
  ],
  [ClassID.Necromancer]: [
    'Necromancer',
    [100, 100, 17, 0, 17, 23, 5, 17],
    [575, 290, 55, 9, 36, 42, 24, 55],
    [700, 385, 75, 25, 50, 60, 40, 75],
    [17, 19, 14, 9]
  ],
  [ClassID.Huntress]: [
    'Huntress',
    [150, 100, 26, 0, 17, 23, 5, 15],
    [625, 214, 45, 9, 36, 33, 24, 34],
    [750, 305, 65, 25, 50, 60, 40, 50],
    [3, 20, 6, 9]
  ],
  [ClassID.Mystic]: [
    'Mystic',
    [100, 100, 26, 0, 27, 26, 5, 17],
    [575, 290, 45, 9, 32, 45, 24, 55],
    [700, 385, 65, 25, 60, 65, 40, 75],
    [17, 21, 14, 9]
  ],
  [ClassID.Trickster]: [
    'Trickster',
    [150, 100, 26, 0, 23, 17, 5, 23],
    [625, 195, 45, 9, 61, 55, 24, 32],
    [750, 252, 65, 25, 75, 75, 40, 60],
    [2, 22, 6, 9]
  ],
  [ClassID.Sorcerer]: [
    'Sorcerer',
    [100, 100, 17, 0, 27, 23, 17, 23],
    [575, 290, 55, 9, 46, 42, 55, 42],
    [700, 385, 70, 25, 60, 60, 75, 60],
    [8, 23, 14, 9]
  ],
  [ClassID.Ninja]: [
    'Ninja',
    [200, 100, 12, 0, 27, 12, 23, 12],
    [675, 195, 50, 9, 46, 50, 42, 50],
    [800, 252, 70, 25, 60, 70, 60, 70],
    [24, 25, 6, 9]
  ],
  [ClassID.Summoner]: [
    'Summoner',
    [100, 100, 23, 0, 27, 17, 5, 17],
    [575, 290, 42, 9, 44, 55, 24, 55],
    [700, 385, 60, 25, 60, 75, 40, 75],
    [8, 29, 14, 9]
  ],
  [ClassID.Kensei]: [
    'Kensei',
    [200, 100, 26, 0, 27, 26, 23, 15],
    [675, 195, 45, 9, 46, 45, 42, 34],
    [800, 252, 65, 25, 60, 65, 60, 50],
    [24, 30, 7, 9]
  ]
};

export const exaltStats = ['VIT', 'SPD', 'WIS', 'DEX', 'DEF', 'ATT', 'MP', 'HP'];
