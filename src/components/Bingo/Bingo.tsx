import { Button } from 'primereact/button';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { SelectButton, SelectButtonChangeEvent } from 'primereact/selectbutton';
import React, { useEffect, useMemo, useState } from 'react';
import {
    BINGO_CELL_COUNT,
    BingoCardCell,
    BingoCenterMode,
    BingoDifficultyFilter,
    countCompletedLines,
    formatBingoShareText,
    generateBingoCard
} from './bingo-generator';
import { BINGO_PRESETS, BingoPreset } from './bingo-presets';
import styles from './Bingo.module.scss';

const difficultyOptions: { label: string; value: BingoDifficultyFilter }[] = [
    { label: 'Mixed', value: 'mixed' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' }
];

const emptyMarkState = (centerMode: BingoCenterMode): boolean[] =>
    Array.from({ length: BINGO_CELL_COUNT }, (_, index) =>
        centerMode === 'free' ? index === Math.floor(BINGO_CELL_COUNT / 2) : false
    );

const inferCenterModeFromCard = (card: BingoCardCell[]): BingoCenterMode =>
    card[Math.floor(BINGO_CELL_COUNT / 2)]?.isFree ? 'free' : 'goal';

const bingoStateStorageKey = 'bingo_state';

interface PersistedBingoCard {
    id: string;
    name: string;
    presetId: string;
    difficulty: BingoDifficultyFilter;
    centerMode: BingoCenterMode;
    card: BingoCardCell[];
    marked: boolean[];
    createdAt: number;
}

interface PersistedBingoState {
    cards: PersistedBingoCard[];
    activeCardIndex: number;
    selectedPresetId: string;
    difficulty: BingoDifficultyFilter;
    centerMode: BingoCenterMode;
}

interface BingoProps {
    visible: boolean;
    onHide: () => void;
}

const getDefaultSelectedPresetId = (): string => BINGO_PRESETS[0]?.id ?? '';

const buildDefaultCardName = (presetName: string, cardNumber: number): string =>
    `${presetName} ${cardNumber}`;

const loadBingoState = (): PersistedBingoState => {
    const fallback: PersistedBingoState = {
        cards: [],
        activeCardIndex: 0,
        selectedPresetId: getDefaultSelectedPresetId(),
        difficulty: 'mixed',
        centerMode: 'free'
    };

    if (typeof localStorage === 'undefined') {
        return fallback;
    }

    try {
        const raw = localStorage.getItem(bingoStateStorageKey);
        if (!raw) {
            return fallback;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedBingoState>;
        const parsedCards = Array.isArray(parsed.cards)
            ? parsed.cards.reduce<PersistedBingoCard[]>((acc, entry, index) => {
                if (!entry || !Array.isArray(entry.card) || !Array.isArray(entry.marked)) {
                    return acc;
                }

                const presetId = typeof entry.presetId === 'string' ? entry.presetId : getDefaultSelectedPresetId();
                const presetName =
                    BINGO_PRESETS.find((preset) => preset.id === presetId)?.name ?? 'Bingo Card';

                const normalizedName =
                    typeof entry.name === 'string' && entry.name.trim().length > 0
                        ? entry.name.trim()
                        : buildDefaultCardName(presetName, index + 1);

                const normalizedDifficulty: BingoDifficultyFilter =
                    entry.difficulty === 'easy' ||
                        entry.difficulty === 'medium' ||
                        entry.difficulty === 'hard' ||
                        entry.difficulty === 'mixed'
                        ? entry.difficulty
                        : 'mixed';

                const normalizedCenterMode: BingoCenterMode =
                    entry.centerMode === 'free' || entry.centerMode === 'goal'
                        ? entry.centerMode
                        : inferCenterModeFromCard(entry.card);

                acc.push({
                    id: typeof entry.id === 'string' ? entry.id : `${Date.now()}-${index}`,
                    name: normalizedName,
                    presetId,
                    difficulty: normalizedDifficulty,
                    centerMode: normalizedCenterMode,
                    card: entry.card,
                    marked: entry.marked,
                    createdAt: typeof entry.createdAt === 'number' ? entry.createdAt : Date.now()
                });

                return acc;
            }, [])
            : [];

        const boundedIndex = Math.max(
            0,
            Math.min(
                Number.isFinite(parsed.activeCardIndex) ? Number(parsed.activeCardIndex) : 0,
                Math.max(parsedCards.length - 1, 0)
            )
        );

        const selectedPresetId =
            typeof parsed.selectedPresetId === 'string' && parsed.selectedPresetId
                ? parsed.selectedPresetId
                : fallback.selectedPresetId;

        const difficulty: BingoDifficultyFilter =
            parsed.difficulty === 'easy' ||
                parsed.difficulty === 'medium' ||
                parsed.difficulty === 'hard' ||
                parsed.difficulty === 'mixed'
                ? parsed.difficulty
                : 'mixed';

        const centerMode: BingoCenterMode =
            parsed.centerMode === 'free' || parsed.centerMode === 'goal'
                ? parsed.centerMode
                : 'free';

        return {
            cards: parsedCards,
            activeCardIndex: boundedIndex,
            selectedPresetId,
            difficulty,
            centerMode
        };
    } catch {
        return fallback;
    }
};

const Bingo: React.FC<BingoProps> = ({ visible, onHide }) => {
    const persisted = useMemo(loadBingoState, []);
    const [selectedPresetId, setSelectedPresetId] = useState<string>(persisted.selectedPresetId);
    const [difficulty, setDifficulty] = useState<BingoDifficultyFilter>(persisted.difficulty);
    const [centerMode, setCenterMode] = useState<BingoCenterMode>(persisted.centerMode);
    const [cards, setCards] = useState<PersistedBingoCard[]>(persisted.cards);
    const [activeCardIndex, setActiveCardIndex] = useState<number>(persisted.activeCardIndex);
    const [error, setError] = useState<string | null>(null);
    const [shareStatus, setShareStatus] = useState<string | null>(null);

    const selectedPreset = useMemo<BingoPreset | undefined>(
        () => BINGO_PRESETS.find((preset) => preset.id === selectedPresetId),
        [selectedPresetId]
    );

    const availableGoalCount = useMemo(() => {
        if (!selectedPreset) {
            return 0;
        }

        if (difficulty === 'mixed') {
            return selectedPreset.goals.length;
        }

        return selectedPreset.goals.filter((goal) => goal.difficulty === difficulty).length;
    }, [difficulty, selectedPreset]);

    const activeCard = cards[activeCardIndex];
    const activeMarked = activeCard?.marked ?? emptyMarkState(centerMode);
    const completedLines = useMemo(() => countCompletedLines(activeMarked), [activeMarked]);

    useEffect(() => {
        if (typeof localStorage === 'undefined') {
            return;
        }

        const payload: PersistedBingoState = {
            cards,
            activeCardIndex,
            selectedPresetId,
            difficulty,
            centerMode
        };

        localStorage.setItem(bingoStateStorageKey, JSON.stringify(payload));
    }, [activeCardIndex, cards, difficulty, selectedPresetId, centerMode]);

    const generateCard = () => {
        if (!selectedPreset) {
            return;
        }

        try {
            const nextCard = generateBingoCard(selectedPreset, difficulty, centerMode);
            setCards((prev) => {
                const nextPersistedCard: PersistedBingoCard = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    name: buildDefaultCardName(selectedPreset.name, prev.length + 1),
                    presetId: selectedPreset.id,
                    difficulty,
                    centerMode,
                    card: nextCard,
                    marked: emptyMarkState(centerMode),
                    createdAt: Date.now()
                };
                const nextCards = [...prev, nextPersistedCard];
                setActiveCardIndex(nextCards.length - 1);
                return nextCards;
            });
            setError(null);
            setShareStatus(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate card';
            setError(message);
            setShareStatus(null);
        }
    };

    const handleCellClick = (cell: BingoCardCell) => {
        if (!activeCard) {
            return;
        }

        if (cell.isFree) {
            return;
        }

        setCards((prev) => {
            const nextCards = [...prev];
            const target = nextCards[activeCardIndex];
            if (!target) {
                return prev;
            }

            const nextMarked = [...target.marked];
            nextMarked[cell.index] = !nextMarked[cell.index];
            nextCards[activeCardIndex] = { ...target, marked: nextMarked };
            return nextCards;
        });
    };

    const resetMarks = () => {
        if (!activeCard) {
            return;
        }

        setCards((prev) => {
            const nextCards = [...prev];
            const target = nextCards[activeCardIndex];
            if (!target) {
                return prev;
            }

            nextCards[activeCardIndex] = { ...target, marked: emptyMarkState(target.centerMode) };
            return nextCards;
        });
        setShareStatus(null);
    };

    const showPreviousCard = () => {
        setActiveCardIndex((prev) => Math.max(prev - 1, 0));
        setShareStatus(null);
    };

    const showNextCard = () => {
        setActiveCardIndex((prev) => Math.min(prev + 1, Math.max(cards.length - 1, 0)));
        setShareStatus(null);
    };

    const discardActiveCard = () => {
        if (!activeCard) {
            return;
        }

        setCards((prev) => {
            const nextCards = prev.filter((card) => card.id !== activeCard.id);

            setActiveCardIndex((prevIndex) => {
                if (nextCards.length === 0) {
                    return 0;
                }

                return Math.min(prevIndex, nextCards.length - 1);
            });

            return nextCards;
        });

        setShareStatus(null);
        setError(null);
    };

    const handleCardNameChange = (value: string) => {
        if (!activeCard) {
            return;
        }

        setCards((prev) => {
            const nextCards = [...prev];
            const target = nextCards[activeCardIndex];
            if (!target) {
                return prev;
            }

            nextCards[activeCardIndex] = { ...target, name: value };
            return nextCards;
        });
    };

    const copyToClipboard = async (value: string): Promise<boolean> => {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }

        if (typeof document === 'undefined') {
            return false;
        }

        const textArea = document.createElement('textarea');
        textArea.value = value;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand('copy');
        document.body.removeChild(textArea);
        return copied;
    };

    const handleCopyShareText = async () => {
        if (!activeCard) {
            setShareStatus('Generate a card first.');
            return;
        }

        const activePreset = BINGO_PRESETS.find((preset) => preset.id === activeCard.presetId);
        if (!activePreset) {
            setShareStatus('Unable to resolve preset for this card.');
            return;
        }

        const payload = formatBingoShareText(
            activeCard.name || activePreset.name,
            activeCard.difficulty,
            activeCard.card,
            activeCard.marked,
            completedLines
        );

        try {
            const copied = await copyToClipboard(payload);
            setShareStatus(copied ? 'Share text copied to clipboard.' : 'Clipboard is unavailable.');
        } catch {
            setShareStatus('Failed to copy share text.');
        }
    };

    useEffect(() => {
        if (!activeCard) {
            return;
        }

        if (selectedPresetId !== activeCard.presetId) {
            setSelectedPresetId(activeCard.presetId);
        }

        if (difficulty !== activeCard.difficulty) {
            setDifficulty(activeCard.difficulty);
        }

        if (centerMode !== activeCard.centerMode) {
            setCenterMode(activeCard.centerMode);
        }
    }, [activeCard]);

    return (
        <Dialog
            header="Bingo Challenge"
            visible={visible}
            onHide={onHide}
            style={{ width: '95vw', maxWidth: '1500px' }}
            dismissableMask
            closeOnEscape
        >
            <section className={styles.bingoContainer}>
                <div className={styles.headerRow}>
                    <div>
                        <p className={styles.subtitle}>
                            Generate cards from presets, then page through them as you play.
                        </p>
                    </div>
                </div>

                <div className={styles.optionsRow}>
                    <div className={styles.controlBlock}>
                        <label htmlFor="bingo-preset">Preset</label>
                        <Dropdown
                            inputId="bingo-preset"
                            value={selectedPresetId}
                            onChange={(event: DropdownChangeEvent) =>
                                setSelectedPresetId(event.value as string)
                            }
                            options={BINGO_PRESETS}
                            optionLabel="name"
                            optionValue="id"
                            className={styles.controlInput}
                        />
                        <small>{selectedPreset?.description}</small>
                    </div>

                    <div className={styles.controlBlock}>
                        <label>Difficulty</label>
                        <SelectButton
                            value={difficulty}
                            options={difficultyOptions}
                            optionLabel="label"
                            optionValue="value"
                            onChange={(event: SelectButtonChangeEvent) =>
                                setDifficulty(event.value as BingoDifficultyFilter)
                            }
                            className={styles.selectButton}
                        />
                        <small>{availableGoalCount} goals available for this selection.</small>
                    </div>

                    <div className={styles.controlBlock}>
                        <label>Center Tile</label>
                        <div className={styles.checkboxRow}>
                            <Checkbox
                                inputId="bingo-center-free"
                                checked={centerMode === 'free'}
                                onChange={(event: CheckboxChangeEvent) =>
                                    setCenterMode(event.checked ? 'free' : 'goal')
                                }
                            />
                            <label htmlFor="bingo-center-free" className={styles.checkboxLabel}>
                                Use FREE center tile
                            </label>
                        </div>
                        <small>
                            {centerMode === 'free'
                                ? 'Middle tile is auto-completed as FREE.'
                                : 'Middle tile uses a generated goal.'}
                        </small>
                    </div>
                </div>

                <div className={styles.actionsRow}>
                    <Button label="Generate Card" icon="pi pi-plus" onClick={generateCard} />
                </div>

                <div className={styles.pagerRow}>
                    <Button
                        label="Prev"
                        icon="pi pi-angle-left"
                        severity="secondary"
                        outlined
                        onClick={showPreviousCard}
                        disabled={cards.length === 0 || activeCardIndex === 0}
                    />
                    <span className={styles.pagerStatus}>
                        {cards.length === 0
                            ? 'No cards generated yet'
                            : `Card ${activeCardIndex + 1} of ${cards.length}`}
                    </span>
                    <Button
                        label="Next"
                        icon="pi pi-angle-right"
                        iconPos="right"
                        severity="secondary"
                        outlined
                        onClick={showNextCard}
                        disabled={cards.length === 0 || activeCardIndex >= cards.length - 1}
                    />
                </div>

                {activeCard && (
                    <>
                        <div className={styles.sectionDivider} />
                        <div className={styles.cardNameRow}>
                            <InputText
                                id="bingo-card-name"
                                className={styles.cardNameInput}
                                value={activeCard.name}
                                onChange={(event) => handleCardNameChange(event.target.value)}
                                placeholder="Name this card"
                            />
                            <div className={styles.meta}>
                                <span>{completedLines} line(s) complete</span>
                            </div>
                        </div>
                        <div className={styles.cardActionsRow}>
                            <Button
                                label="Reset Marks"
                                icon="pi pi-undo"
                                severity="secondary"
                                outlined
                                onClick={resetMarks}
                            />
                            <Button
                                label="Copy Share Text"
                                icon="pi pi-share-alt"
                                severity="info"
                                outlined
                                onClick={handleCopyShareText}
                            />
                            <Button
                                label="Delete"
                                icon="pi pi-trash"
                                severity="danger"
                                outlined
                                onClick={discardActiveCard}
                            />
                        </div>
                    </>
                )}

                {error && <div className={styles.error}>{error}</div>}
                {shareStatus && <div className={styles.shareStatus}>{shareStatus}</div>}

                {activeCard && (
                    <div className={styles.grid}>
                        {activeCard.card.map((cell) => {
                            const isMarked = activeMarked[cell.index];

                            return (
                                <button
                                    key={cell.index}
                                    type="button"
                                    className={[
                                        styles.cell,
                                        cell.isFree ? styles.cellFree : '',
                                        isMarked ? styles.cellMarked : ''
                                    ].join(' ')}
                                    onClick={() => handleCellClick(cell)}
                                >
                                    {cell.isFree ? 'FREE' : cell.goal?.label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </section>
        </Dialog>
    );
};

export default Bingo;
