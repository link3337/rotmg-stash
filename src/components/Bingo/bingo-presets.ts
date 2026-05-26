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
      { id: 'adv-01', label: 'Clear 3 dungeons', difficulty: 'easy' },
      { id: 'adv-02', label: 'Drink 10 stat potions', difficulty: 'easy', characterMode: 'new' },
      { id: 'adv-03', label: 'Reach 2000 fame on a character', difficulty: 'easy', characterMode: 'new' },
      { id: 'adv-05', label: 'Complete 1 daily quest', difficulty: 'easy', characterMode: 'new' },
      { id: 'adv-09', label: 'Defeat 2 event gods', difficulty: 'medium' },
      { id: 'adv-10', label: 'Complete 2 different dungeon types', difficulty: 'medium' },
      { id: 'adv-11', label: 'Get 1 item with 700+ feed power', difficulty: 'medium' },
      { id: 'adv-12', label: 'Reach 3/8 on a character', difficulty: 'easy' },
      { id: 'adv-14', label: 'Defeat a court dungeon boss', difficulty: 'medium' },
      { id: 'adv-15', label: 'Run 2 exaltation dungeons', difficulty: 'medium' },
      { id: 'adv-16', label: 'Find 1 ST item', difficulty: 'medium' },
      { id: 'adv-17', label: 'Solo a mid-tier dungeon', difficulty: 'hard' },
      { id: 'adv-18', label: 'Complete an Oryx Sanctuary', difficulty: 'hard' },
      { id: 'adv-19', label: 'Defeat 3 event bosses in one realm', difficulty: 'hard' },
      { id: 'adv-20', label: 'Get a white bag drop', difficulty: 'hard' },
      { id: 'adv-21', label: 'Reach 6/8 on a character', difficulty: 'medium', characterMode: 'new' },
      { id: 'adv-22', label: 'Clear Lost Halls or The Nest', difficulty: 'hard' },
      { id: 'adv-23', label: 'Clear The Shatters', difficulty: 'hard' },
      { id: 'adv-24', label: 'Do an Advanced Dungeon', difficulty: 'hard' },
      { id: 'adv-25', label: 'Finish 10 dungeons', difficulty: 'hard', characterMode: 'new' },
      { id: 'adv-26', label: 'No-hit complete a boss', difficulty: 'hard' },
      { id: 'adv-27', label: 'Find 1 ST ring', difficulty: 'medium' },
      { id: 'adv-28', label: 'Find 1 ST ability', difficulty: 'medium' },
      { id: 'adv-29', label: 'Find 1 ST armor', difficulty: 'medium' },
      { id: 'adv-30', label: 'Find 1 ST weapon', difficulty: 'medium' },
      { id: 'adv-34', label: 'Open 2 locked wine cellars', difficulty: 'easy' },
      { id: 'adv-35', label: 'Complete 3 quests in one realm', difficulty: 'medium' },
      { id: 'adv-36', label: 'Clear 2 exaltation dungeons without dying', difficulty: 'hard' },
      { id: 'adv-31', label: 'Solo Void', difficulty: 'goat' },
      { id: 'adv-32', label: 'Solo Shatters', difficulty: 'goat' },
      { id: 'adv-33', label: 'Play petless', difficulty: 'goat' }
    ]
  },
  {
    id: 'loot-hunter',
    name: 'Loot Hunter',
    description: 'Item-focused goals for stash and farming runs.',
    goals: [
      { id: 'loot-01', label: 'Collect 5 different UT items', difficulty: 'hard' },
      { id: 'loot-02', label: 'Get 3 tops from dungeon drops', difficulty: 'medium' },
      { id: 'loot-03', label: 'Find 2 tiered rings T5+', difficulty: 'easy' },
      { id: 'loot-04', label: 'Get 1 potion from a quest chest', difficulty: 'easy', characterMode: 'new' },
      { id: 'loot-05', label: 'Loot 5 stat pots in one life', difficulty: 'medium' },
      { id: 'loot-06', label: 'Pick up a UT ability', difficulty: 'medium' },
      { id: 'loot-07', label: 'Find 1 skin token or skin unlock', difficulty: 'hard' },
      { id: 'loot-09', label: 'Fill all 8 inventory slots', difficulty: 'easy' },
      { id: 'loot-10', label: 'Find 1 item worth 1500+ feed power', difficulty: 'hard' },
      { id: 'loot-11', label: 'Get 5 dungeon marks of different types', difficulty: 'easy', },
      { id: 'loot-12', label: 'Obtain 1 blueprint', difficulty: 'medium' },
      { id: 'loot-13', label: 'Get a shiny item drop', difficulty: 'hard' },
      { id: 'loot-14', label: 'Collect 3 rings in one realm', difficulty: 'easy' },
      { id: 'loot-15', label: 'Store 10 new items in stash', difficulty: 'medium' },
      { id: 'loot-16', label: 'Get 1 event white', difficulty: 'hard', characterMode: 'existing' },
      { id: 'loot-18', label: 'Obtain 2 abilities above T5', difficulty: 'easy' },
      { id: 'loot-19', label: 'Get 1 exaltation dungeon white bag', difficulty: 'hard', },
      { id: 'loot-21', label: 'Collect 12 potions total', difficulty: 'easy', },
      { id: 'loot-22', label: 'Find 1 ST ring', difficulty: 'medium' },
      { id: 'loot-22', label: 'Find 1 ST ability', difficulty: 'medium' },
      { id: 'loot-22', label: 'Find 1 ST armor', difficulty: 'medium' },
      { id: 'loot-22', label: 'Find 1 ST weapon', difficulty: 'medium' },
      { id: 'loot-24', label: 'Get 2 item drops from the same boss', difficulty: 'medium' },
      { id: 'loot-26', label: 'Find 3 feed items over 500 power', difficulty: 'medium' },
      { id: 'loot-27', label: 'Collect 1 cosmetic item', difficulty: 'easy' },
      { id: 'loot-29', label: 'Get 2 marks from the same dungeon type', difficulty: 'easy' },
      { id: 'loot-30', label: 'Collect 2 different ST pieces', difficulty: 'medium' },
      { id: 'loot-31', label: 'Get a white bag and an ST drop in one session', difficulty: 'hard' },
      { id: 'loot-28', label: 'Play petless', difficulty: 'goat' }
    ]
  },
  {
    id: 'boss-rush',
    name: 'Boss Rush',
    description: 'Boss progression goals with escalating challenge.',
    goals: [
      { id: 'boss-01', label: 'Defeat Skull Shrine', difficulty: 'easy', characterMode: 'new' },
      { id: 'boss-02', label: 'Defeat Cube God', difficulty: 'easy', characterMode: 'new' },
      { id: 'boss-03', label: 'Defeat Sphinx God', difficulty: 'easy', characterMode: 'new' },
      { id: 'boss-04', label: 'Defeat Pentaract', difficulty: 'easy' },
      { id: 'boss-05', label: 'Defeat Hermit God', difficulty: 'medium' },
      { id: 'boss-06', label: 'Defeat Ghost Ship', difficulty: 'medium' },
      { id: 'boss-07', label: 'Defeat Avatar of the Forgotten King', difficulty: 'medium' },
      { id: 'boss-08', label: 'Defeat Rock Dragon', difficulty: 'medium' },
      { id: 'boss-09', label: 'Defeat Lord of the Lost Lands', difficulty: 'easy' },
      { id: 'boss-10', label: 'Defeat Oryx 2', difficulty: 'medium' },
      { id: 'boss-11', label: 'Defeat Janus', difficulty: 'medium' },
      { id: 'boss-12', label: 'Defeat Marble Colossus', difficulty: 'hard' },
      { id: 'boss-13', label: 'Defeat The Forgotten Sentinel', difficulty: 'hard' },
      { id: 'boss-14', label: 'Defeat The Void Entity', difficulty: 'hard' },
      { id: 'boss-15', label: 'Defeat Leucoryx', difficulty: 'hard' },
      { id: 'boss-16', label: 'Defeat Dammah', difficulty: 'hard' },
      { id: 'boss-17', label: 'Defeat Oryx the Mad God 3', difficulty: 'hard', },
      { id: 'boss-18', label: 'Defeat Crystal Worm Mother', difficulty: 'medium' },
      { id: 'boss-19', label: 'Defeat Killer Bee Queen', difficulty: 'medium' },
      { id: 'boss-20', label: 'Defeat Malus', difficulty: 'medium' },
      { id: 'boss-21', label: 'Defeat Kogbold steamworks boss', difficulty: 'hard' },
      { id: 'boss-22', label: 'Defeat Twilight Archmage', difficulty: 'hard' },
      { id: 'boss-23', label: 'Defeat The Forgotten King', difficulty: 'hard' },
      { id: 'boss-24', label: 'Defeat 4 different event bosses', difficulty: 'medium' },
      { id: 'boss-25', label: 'Defeat 8 unique bosses', difficulty: 'hard' },
      { id: 'boss-26', label: 'Defeat 2 exalt dungeon bosses', difficulty: 'hard', },
      { id: 'boss-27', label: 'Defeat any boss without taking damage (Difficulty: 4 Graves+)', difficulty: 'hard' },
      { id: 'boss-29', label: 'Defeat 2 different event gods in one realm', difficulty: 'easy' },
      { id: 'boss-30', label: 'Defeat 3 court dungeon bosses', difficulty: 'medium' },
      { id: 'boss-31', label: 'Defeat all 3 Oryx Sanctuary minibosses in one session', difficulty: 'hard' },
      { id: 'boss-28', label: 'Play petless', difficulty: 'goat' }
    ]
  }
];
