import { describe, expect, it } from 'vitest';
import {
    BINGO_CELL_COUNT,
    BINGO_CENTER_INDEX,
    BINGO_GOAL_COUNT,
    countCompletedLines,
    formatBingoShareText,
    generateBingoCard,
    getBingoGoalCount
} from './bingo-generator';
import { BINGO_PRESETS } from './bingo-presets';

describe('bingo generator', () => {
    it('creates a full card with a free center and unique goals', () => {
        const card = generateBingoCard(BINGO_PRESETS[0], 'mixed');

        expect(card).toHaveLength(BINGO_CELL_COUNT);
        expect(card[BINGO_CENTER_INDEX]?.isFree).toBe(true);

        const goals = card.filter((cell) => !cell.isFree).map((cell) => cell.goal?.id);

        expect(goals).toHaveLength(BINGO_GOAL_COUNT);
        expect(new Set(goals).size).toBe(BINGO_GOAL_COUNT);
    });

    it('biases goal selection toward the selected difficulty', () => {
        const card = generateBingoCard(BINGO_PRESETS[0], 'hard');

        const hardGoals = card.filter((cell) => cell.goal?.difficulty === 'hard');

        expect(hardGoals.length).toBeGreaterThan(0);
    });

    it('can generate a card with a goal in the center tile', () => {
        const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'goal');

        expect(card[BINGO_CENTER_INDEX]?.isFree).toBe(false);
        expect(card[BINGO_CENTER_INDEX]?.goal).toBeDefined();

        const goals = card.filter((cell) => !cell.isFree).map((cell) => cell.goal?.id);
        expect(goals).toHaveLength(getBingoGoalCount('goal'));
        expect(new Set(goals).size).toBe(getBingoGoalCount('goal'));
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
        const card = generateBingoCard(BINGO_PRESETS[0], 'mixed');
        const marks = Array.from({ length: BINGO_CELL_COUNT }, (_, index) => index === BINGO_CENTER_INDEX);
        marks[0] = true;

        const message = formatBingoShareText('Adventurer Mix', 'mixed', card, marks, 0);

        expect(message).toContain('RotMG Stash Bingo - Adventurer Mix (Mixed)');
        expect(message).toContain('Completed lines: 0');
        expect(message).toContain('Goals:');
        expect(message).toContain('[x]');
        expect(message).toContain('[ ]');
    });

    it('formats center icon as regular mark when center is not free', () => {
        const card = generateBingoCard(BINGO_PRESETS[0], 'mixed', 'goal');
        const marks = Array.from({ length: BINGO_CELL_COUNT }, () => false);
        marks[BINGO_CENTER_INDEX] = true;

        const message = formatBingoShareText('Adventurer Mix', 'mixed', card, marks, 0);
        expect(message).toContain('✅');
    });

    it('returns fallback message when card data is invalid', () => {
        const message = formatBingoShareText('Adventurer Mix', 'mixed', [], [], 0);

        expect(message).toBe('No bingo card generated yet.');
    });
});
