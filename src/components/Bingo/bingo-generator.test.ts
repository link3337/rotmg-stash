import { describe, expect, it } from 'vitest';
import {
  BINGO_CELL_COUNT,
  BINGO_CENTER_INDEX,
  countCompletedLines,
  formatBingoShareText,
  generateBingoCard,
  getBingoGoalCount
} from './bingo-generator';
import { BINGO_PRESETS } from './bingo-presets';

describe('bingo generator', () => {
  it('creates a full card with a free center when free mode is used', () => {
    const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'free', 'existing');

    expect(card).toHaveLength(BINGO_CELL_COUNT);
    expect(card[BINGO_CENTER_INDEX]?.isFree).toBe(true);
    expect(card[BINGO_CENTER_INDEX]?.goal).toBeUndefined();

    const goals = card.filter((cell) => !cell.isFree).map((cell) => cell.goal?.id);

    expect(goals).toHaveLength(getBingoGoalCount('free'));
    expect(new Set(goals).size).toBe(getBingoGoalCount('free'));
  });

  it('biases goal selection toward the selected difficulty', () => {
    const card = generateBingoCard(BINGO_PRESETS[0], 'hard', 'free', 'existing');

    const hardGoals = card.filter((cell) => cell.goal?.difficulty === 'hard');

    expect(hardGoals.length).toBeGreaterThan(0);
  });

  it('always generates a goat goal in the center tile', () => {
    const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'goat', 'existing');

    expect(card[BINGO_CENTER_INDEX]?.isFree).toBe(false);
    expect(card[BINGO_CENTER_INDEX]?.goal).toBeDefined();
    expect(card[BINGO_CENTER_INDEX]?.goal?.difficulty).toBe('goat');

    const goals = card.filter((cell) => !cell.isFree).map((cell) => cell.goal?.id);
    expect(goals).toHaveLength(getBingoGoalCount('goat'));
    expect(new Set(goals).size).toBe(getBingoGoalCount('goat'));
  });

  it('uses a free center icon when center mode is free', () => {
    const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'free', 'existing');
    const marks = Array.from({ length: BINGO_CELL_COUNT }, () => false);
    marks[BINGO_CENTER_INDEX] = true;

    const message = formatBingoShareText('Adventurer Mix', 'mixed', 'existing', card, marks, 0);
    expect(message).toContain('⭐');
  });

  it('filters out existing-only goals for new characters', () => {
    const preset = BINGO_PRESETS[0];
    const card = generateBingoCard(preset, 'mixed', 'free', 'new');
    const goalIds = card
      .filter((cell) => !cell.isFree)
      .map((cell) => cell.goal?.id)
      .filter((value): value is string => !!value);

    const generatedGoals = goalIds
      .map((id) => preset.goals.find((goal) => goal.id === id))
      .filter((goal): goal is NonNullable<typeof goal> => !!goal);

    expect(generatedGoals.every((goal) => goal.characterMode !== 'existing')).toBe(true);
  });

  it('counts completed lines correctly', () => {
    const marks = Array.from({ length: BINGO_CELL_COUNT }, () => false);

    marks[0] = true;
    marks[1] = true;
    marks[2] = true;
    marks[3] = true;
    marks[4] = true;

    marks[6] = true;
    marks[12] = true;
    marks[18] = true;
    marks[24] = true;

    expect(countCompletedLines(marks)).toBe(2);
  });

  it('formats share text with summary and goals', () => {
    const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'free', 'existing');
    const marks = Array.from(
      { length: BINGO_CELL_COUNT },
      (_, index) => index === BINGO_CENTER_INDEX
    );
    marks[0] = true;

    const message = formatBingoShareText('Adventurer Mix', 'mixed', 'existing', card, marks, 0);

    expect(message).toContain('RotMG Stash Bingo - Adventurer Mix (Mixed, Existing Character)');
    expect(message).toContain('Completed lines: 0');
    expect(message).toContain('Goals:');
    expect(message).toContain('[x]');
    expect(message).toContain('[ ]');
  });

  it('formats center icon as regular mark when center is not free', () => {
    const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'goat', 'existing');
    const marks = Array.from({ length: BINGO_CELL_COUNT }, () => false);
    marks[BINGO_CENTER_INDEX] = true;

    const message = formatBingoShareText('Adventurer Mix', 'mixed', 'existing', card, marks, 0);
    expect(message).toContain('✅');
  });

  it('returns fallback message when card data is invalid', () => {
    const message = formatBingoShareText('Adventurer Mix', 'mixed', 'existing', [], [], 0);

    expect(message).toBe('No bingo card generated yet.');
  });
});
