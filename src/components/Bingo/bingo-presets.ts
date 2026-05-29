export type BingoDifficulty = 'easy' | 'medium' | 'hard' | 'goat';
export type BingoGoalCharacterMode = 'any' | 'new' | 'existing';

export interface BingoGoal {
  id: string;
  label: string;
  difficulty: BingoDifficulty;
  characterMode?: BingoGoalCharacterMode;
}

export interface BingoPreset {
  id: string;
  name: string;
  description: string;
  goals: BingoGoal[];
}

export const BINGO_PRESETS: BingoPreset[] = [
  {
    id: 'adventurer',
    name: 'Adventurer Mix',
    description: 'General progression goals that fit most sessions.',
    goals: [
      {
        id: 'adv-easy-01',
        label: 'Drink 10 stat potions',
        difficulty: 'easy',
        characterMode: 'new'
      },
      {
        id: 'adv-easy-02',
        label: 'Reach 2000 fame on a character',
        difficulty: 'easy',
        characterMode: 'new'
      },
      {
        id: 'adv-easy-04',
        label: 'Complete 1 daily quest',
        difficulty: 'easy',
        characterMode: 'new'
      },
      {
        id: 'adv-easy-05',
        label: 'Reach 3/8 on a character',
        difficulty: 'easy',
        characterMode: 'new'
      },
      { id: 'adv-easy-06', label: 'Clear a wine cellar', difficulty: 'easy' },
      { id: 'adv-easy-07', label: 'Clear 3 dungeons', difficulty: 'easy' },
      { id: 'adv-easy-08', label: 'Complete 5 quests in one realm', difficulty: 'easy' },

      {
        id: 'adv-medium-01',
        label: 'Reach 6/8 on a character',
        difficulty: 'medium',
        characterMode: 'new'
      },
      { id: 'adv-medium-02', label: 'Find 1 ST ring', difficulty: 'medium' },
      { id: 'adv-medium-03', label: 'Find 1 ST ability', difficulty: 'medium' },
      { id: 'adv-medium-04', label: 'Find 1 ST armor', difficulty: 'medium' },
      { id: 'adv-medium-05', label: 'Find 1 ST weapon', difficulty: 'medium' },
      { id: 'adv-medium-06', label: 'Defeat 2 event gods', difficulty: 'medium' },
      { id: 'adv-medium-07', label: 'Complete 2 different dungeon types', difficulty: 'medium' },
      { id: 'adv-medium-08', label: 'Get 1 item with 700+ feed power', difficulty: 'medium' },
      { id: 'adv-medium-09', label: 'Defeat a court dungeon boss', difficulty: 'medium' },
      { id: 'adv-medium-10', label: 'Clear 2 exaltation dungeons', difficulty: 'medium' },
      { id: 'adv-medium-11', label: 'Find 2 ST items', difficulty: 'medium' },
      { id: 'adv-medium-12', label: 'Find 3 UT items', difficulty: 'medium' },

      { id: 'adv-hard-01', label: 'Solo a mid-tier dungeon', difficulty: 'hard' },
      { id: 'adv-hard-02', label: 'Complete an Oryx Sanctuary', difficulty: 'hard' },
      { id: 'adv-hard-03', label: 'Defeat 3 veteran events', difficulty: 'hard' },
      { id: 'adv-hard-04', label: 'Get a white bag drop', difficulty: 'hard' },
      { id: 'adv-hard-05', label: 'Clear Lost Halls or The Nest', difficulty: 'hard' },
      { id: 'adv-hard-06', label: 'Clear The Shatters', difficulty: 'hard' },
      { id: 'adv-hard-07', label: 'Do an Advanced Dungeon', difficulty: 'hard' },
      { id: 'adv-hard-08', label: 'Finish 10 dungeons', difficulty: 'hard' },
      {
        id: 'adv-hard-09',
        label: 'Defeat any boss no-hit (4+ Graves)',
        difficulty: 'hard'
      },
      { id: 'adv-hard-10', label: 'Clear 2 exaltation dungeons', difficulty: 'hard' },

      { id: 'adv-goat-01', label: 'Solo Void', difficulty: 'goat' },
      { id: 'adv-goat-02', label: 'Solo Shatters', difficulty: 'goat' },
      { id: 'adv-goat-03', label: 'Play petless', difficulty: 'goat' }
    ]
  },
  {
    id: 'loot-hunter',
    name: 'Loot Hunter',
    description: 'Item-focused goals for stash and farming runs.',
    goals: [
      { id: 'loot-easy-01', label: 'Find 2 tiered rings T5+', difficulty: 'easy' },
      { id: 'loot-easy-02', label: 'Loot 5 stat pots', difficulty: 'easy' },
      { id: 'loot-easy-03', label: 'Get 5 dungeon marks of different types', difficulty: 'easy' },
      { id: 'loot-easy-04', label: 'Collect 3 rings in one realm', difficulty: 'easy' },
      { id: 'loot-easy-05', label: 'Fill all 8 inventory slots', difficulty: 'easy' },
      { id: 'loot-easy-06', label: 'Obtain 2 abilities T5+', difficulty: 'easy' },
      { id: 'loot-easy-07', label: 'Collect 12 potions total', difficulty: 'easy' },
      { id: 'loot-easy-08', label: 'Find 1 UT ring', difficulty: 'easy' },
      { id: 'loot-easy-09', label: 'Get 2 marks from the same dungeon', difficulty: 'easy' },

      { id: 'loot-medium-01', label: 'Get 3 tops from dungeon drops', difficulty: 'medium' },
      { id: 'loot-medium-02', label: 'Obtain 1 blueprint', difficulty: 'medium' },
      { id: 'loot-medium-03', label: 'Store 10 new items in stash', difficulty: 'medium' },
      { id: 'loot-medium-04', label: 'Find 1 ST ring', difficulty: 'medium' },
      { id: 'loot-medium-05', label: 'Find 1 ST ability', difficulty: 'medium' },
      { id: 'loot-medium-06', label: 'Find 1 ST armor', difficulty: 'medium' },
      { id: 'loot-medium-07', label: 'Find 1 ST weapon', difficulty: 'medium' },
      { id: 'loot-medium-08', label: 'Find 1 UT ability', difficulty: 'medium' },
      { id: 'loot-medium-09', label: 'Find 1 UT armor', difficulty: 'medium' },
      { id: 'loot-medium-10', label: 'Find 1 UT weapon', difficulty: 'medium' },
      { id: 'loot-medium-11', label: 'Find 3 feed items over 500 power', difficulty: 'medium' },
      { id: 'loot-medium-12', label: 'Collect 2 different ST pieces', difficulty: 'medium' },

      { id: 'loot-hard-01', label: 'Collect 5 different UT items', difficulty: 'hard' },
      { id: 'loot-hard-02', label: 'Find 1 skin token or skin unlock', difficulty: 'hard' },
      { id: 'loot-hard-03', label: 'Find 1 item worth 1500+ feed power', difficulty: 'hard' },
      { id: 'loot-hard-04', label: 'Get a shiny item drop', difficulty: 'hard' },
      { id: 'loot-hard-05', label: 'Get 1 event white', difficulty: 'hard' },
      { id: 'loot-hard-06', label: 'Get 1 exaltation dungeon white bag', difficulty: 'hard' },

      { id: 'loot-goat-01', label: 'Play petless', difficulty: 'goat' }
    ]
  },
  {
    id: 'boss-rush',
    name: 'Boss Rush',
    description: 'Boss progression goals with escalating challenge.',
    goals: [
      {
        id: 'boss-easy-01',
        label: 'Defeat Skull Shrine',
        difficulty: 'easy',
        characterMode: 'new'
      },
      { id: 'boss-easy-02', label: 'Defeat Cube God', difficulty: 'easy', characterMode: 'new' },
      { id: 'boss-easy-03', label: 'Defeat Sphinx God', difficulty: 'easy', characterMode: 'new' },
      { id: 'boss-easy-04', label: 'Defeat Lord of the Lost Lands', difficulty: 'easy' },
      { id: 'boss-easy-05', label: 'Defeat Pentaract', difficulty: 'easy' },

      { id: 'boss-medium-01', label: 'Defeat Hermit God', difficulty: 'medium' },
      { id: 'boss-medium-02', label: 'Defeat Ghost Ship', difficulty: 'medium' },
      { id: 'boss-medium-03', label: 'Defeat Avatar of the Forgotten King', difficulty: 'medium' },
      { id: 'boss-medium-04', label: 'Defeat Rock Dragon', difficulty: 'medium' },
      { id: 'boss-medium-05', label: 'Defeat Crystal Worm Mother', difficulty: 'medium' },
      { id: 'boss-medium-06', label: 'Defeat Oryx 2', difficulty: 'medium' },
      { id: 'boss-medium-07', label: 'Defeat Malus', difficulty: 'medium' },
      { id: 'boss-medium-08', label: 'Defeat Killer Bee Queen', difficulty: 'medium' },
      { id: 'boss-medium-09', label: 'Defeat 4 different event bosses', difficulty: 'medium' },
      { id: 'boss-medium-10', label: 'Defeat 3 court dungeon bosses', difficulty: 'medium' },
      { id: 'boss-medium-11', label: 'Defeat Janus', difficulty: 'medium' },

      { id: 'boss-hard-01', label: 'Defeat Marble Colossus', difficulty: 'hard' },
      { id: 'boss-hard-02', label: 'Defeat The Bridge Sentinel', difficulty: 'hard' },
      { id: 'boss-hard-03', label: 'Defeat The Void Entity', difficulty: 'hard' },
      { id: 'boss-hard-04', label: 'Defeat Leucoryx or Dammah', difficulty: 'hard' },
      { id: 'boss-hard-05', label: 'Defeat Beisa or Gemsbok', difficulty: 'hard' },
      { id: 'boss-hard-06', label: 'Defeat Oryx 3', difficulty: 'hard' },
      { id: 'boss-hard-07', label: 'Defeat Kogbold steamworks boss', difficulty: 'hard' },
      { id: 'boss-hard-08', label: 'Defeat Twilight Archmage', difficulty: 'hard' },
      { id: 'boss-hard-09', label: 'Defeat The Forgotten King', difficulty: 'hard' },
      { id: 'boss-hard-10', label: 'Defeat 8 unique bosses', difficulty: 'hard' },
      { id: 'boss-hard-11', label: 'Defeat 3 exalt dungeon bosses', difficulty: 'hard' },
      { id: 'boss-hard-12', label: 'Defeat Sentien Monolith', difficulty: 'hard' },
      {
        id: 'boss-hard-13',
        label: 'Defeat any boss without taking damage (Difficulty: 4+ Graves)',
        difficulty: 'hard'
      },

      { id: 'boss-goat-01', label: 'Play petless', difficulty: 'goat' }
    ]
  }
];
