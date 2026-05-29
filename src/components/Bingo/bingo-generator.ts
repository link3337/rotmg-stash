import { BingoDifficulty, BingoGoal, BingoGoalCharacterMode, BingoPreset } from './bingo-presets';

export type BingoDifficultyFilter = BingoDifficulty | 'mixed';
export type BingoCenterMode = 'free' | 'goat';
export type BingoCharacterMode = Exclude<BingoGoalCharacterMode, 'any'>;

export interface BingoCardCell {
  index: number;
  isFree: boolean;
  goal?: BingoGoal;
}

export const BINGO_GRID_SIZE = 5;
export const BINGO_CELL_COUNT = BINGO_GRID_SIZE * BINGO_GRID_SIZE;
export const BINGO_CENTER_INDEX = Math.floor(BINGO_CELL_COUNT / 2);
export const BINGO_GOAL_COUNT = BINGO_CELL_COUNT - 1;

export const getBingoGoalCount = (centerMode: BingoCenterMode): number =>
  centerMode === 'free' ? BINGO_GOAL_COUNT : BINGO_CELL_COUNT;

const shuffle = <T>(items: T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const difficultyOrderMap: Record<BingoDifficulty, BingoDifficulty[]> = {
  easy: ['easy', 'medium', 'hard', 'goat'],
  medium: ['medium', 'easy', 'hard', 'goat'],
  hard: ['hard', 'medium', 'easy', 'goat'],
  goat: ['goat', 'hard', 'medium', 'easy']
};

const pickGoalsByDifficultyPreference = (
  goals: BingoGoal[],
  difficulty: BingoDifficultyFilter
): BingoGoal[] => {
  if (difficulty === 'mixed') {
    return shuffle(goals);
  }

  const order = difficultyOrderMap[difficulty];
  const buckets = order.map((level) => shuffle(goals.filter((goal) => goal.difficulty === level)));
  return buckets.flat();
};

const filterGoalsByCharacterMode = (
  goals: BingoGoal[],
  characterMode: BingoCharacterMode
): BingoGoal[] =>
  goals.filter(
    (goal) =>
      goal.characterMode === undefined ||
      goal.characterMode === 'any' ||
      goal.characterMode === characterMode
  );

export const generateBingoCard = (
  preset: BingoPreset,
  difficulty: BingoDifficultyFilter,
  centerMode: BingoCenterMode = 'free',
  characterMode: BingoCharacterMode = 'existing'
): BingoCardCell[] => {
  const modeFilteredGoals = filterGoalsByCharacterMode(preset.goals, characterMode);
  const pool = pickGoalsByDifficultyPreference(modeFilteredGoals, difficulty);

  if (centerMode === 'free') {
    if (pool.length < BINGO_GOAL_COUNT) {
      throw new Error(
        `Not enough goals in preset "${preset.name}" for ${characterMode} characters. ` +
          `Need at least ${BINGO_GOAL_COUNT}, got ${pool.length}.`
      );
    }

    const pickedGoals = shuffle(pool).slice(0, BINGO_GOAL_COUNT);
    let pickedCursor = 0;

    return Array.from({ length: BINGO_CELL_COUNT }, (_, index) => {
      if (index === BINGO_CENTER_INDEX) {
        return {
          index,
          isFree: true
        };
      }

      const goal = pickedGoals[pickedCursor];
      pickedCursor += 1;

      return {
        index,
        isFree: false,
        goal
      };
    });
  }

  const goatGoals = pool.filter((goal) => goal.difficulty === 'goat');
  if (goatGoals.length === 0) {
    throw new Error(
      `Preset "${preset.name}" has no goat goals available for ${characterMode} characters.`
    );
  }

  const centerGoal = shuffle(goatGoals)[0];
  const nonCenterPool = pool.filter((goal) => goal.id !== centerGoal.id);

  if (nonCenterPool.length < BINGO_GOAL_COUNT) {
    throw new Error(
      `Not enough goals in preset "${preset.name}" for ${characterMode} characters. ` +
        `Need at least ${BINGO_CELL_COUNT}, got ${pool.length}.`
    );
  }

  const pickedGoals = shuffle(nonCenterPool).slice(0, BINGO_GOAL_COUNT);
  let pickedCursor = 0;

  return Array.from({ length: BINGO_CELL_COUNT }, (_, index) => {
    if (index === BINGO_CENTER_INDEX) {
      return {
        index,
        isFree: false,
        goal: centerGoal
      };
    }

    const goal = pickedGoals[pickedCursor];
    pickedCursor += 1;

    return {
      index,
      isFree: false,
      goal
    };
  });
};

export const countCompletedLines = (marked: boolean[]): number => {
  if (marked.length !== BINGO_CELL_COUNT) {
    return 0;
  }

  const lines: number[][] = [];

  for (let row = 0; row < BINGO_GRID_SIZE; row += 1) {
    lines.push(Array.from({ length: BINGO_GRID_SIZE }, (_, col) => row * BINGO_GRID_SIZE + col));
  }

  for (let col = 0; col < BINGO_GRID_SIZE; col += 1) {
    lines.push(Array.from({ length: BINGO_GRID_SIZE }, (_, row) => row * BINGO_GRID_SIZE + col));
  }

  lines.push(Array.from({ length: BINGO_GRID_SIZE }, (_, i) => i * (BINGO_GRID_SIZE + 1)));
  lines.push(Array.from({ length: BINGO_GRID_SIZE }, (_, i) => (i + 1) * (BINGO_GRID_SIZE - 1)));

  return lines.filter((line) => line.every((index) => marked[index])).length;
};

const formatDifficultyLabel = (difficulty: BingoDifficultyFilter): string => {
  if (difficulty === 'mixed') {
    return 'Mixed';
  }

  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const formatCharacterModeLabel = (characterMode: BingoCharacterMode): string =>
  characterMode === 'new' ? 'New Character' : 'Existing Character';

export const formatBingoShareText = (
  presetName: string,
  difficulty: BingoDifficultyFilter,
  characterMode: BingoCharacterMode,
  card: BingoCardCell[],
  marked: boolean[],
  completedLines: number
): string => {
  if (card.length !== BINGO_CELL_COUNT || marked.length !== BINGO_CELL_COUNT) {
    return 'No bingo card generated yet.';
  }

  const iconGrid = Array.from({ length: BINGO_GRID_SIZE }, (_, rowIndex) => {
    const start = rowIndex * BINGO_GRID_SIZE;
    const row = marked
      .slice(start, start + BINGO_GRID_SIZE)
      .map((isMarked, colOffset) => {
        const index = start + colOffset;
        if (index === BINGO_CENTER_INDEX && card[BINGO_CENTER_INDEX]?.isFree) {
          return '⭐';
        }
        return isMarked ? '✅' : '⬜';
      })
      .join(' ');
    return row;
  }).join('\n');

  const goals = card
    .filter((cell) => !cell.isFree)
    .map((cell) => {
      const isMarked = marked[cell.index] ?? false;
      const prefix = isMarked ? '[x]' : '[ ]';
      return `${prefix} ${cell.goal?.label ?? 'Unknown goal'}`;
    })
    .join('\n');

  return [
    `RotMG Stash Bingo - ${presetName} (${formatDifficultyLabel(difficulty)}, ${formatCharacterModeLabel(characterMode)})`,
    `Completed lines: ${completedLines}`,
    iconGrid,
    '',
    'Goals:',
    goals
  ].join('\n');
};
