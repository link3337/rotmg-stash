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
  card[Math.floor(BINGO_CELL_COUNT / 2)]?.isFree ? 'free' : 'goat';

const bingoStateStorageKey = 'bingo_state';

interface PersistedBingoCard {
  id: string;
  name: string;
  presetId: string;
  difficulty: BingoDifficultyFilter;
  centerMode: BingoCenterMode;
  card: BingoCardCell[];
  marked: boolean[];
  runtimeMs: number;
  timerStartedAt?: number;
  createdAt: number;
  isArchived: boolean;
  finishedAt?: number;
  archivedAt?: number;
}

type BingoCardView = 'active' | 'archived';

interface PersistedBingoState {
  cards: PersistedBingoCard[];
  archivedCards: PersistedBingoCard[];
  activeCardIndex: number;
  archivedCardIndex: number;
  selectedPresetId: string;
  difficulty: BingoDifficultyFilter;
  centerMode: BingoCenterMode;
  cardView: BingoCardView;
}

interface BingoProps {
  visible: boolean;
  onHide: () => void;
}

const getDefaultSelectedPresetId = (): string => BINGO_PRESETS[0]?.id ?? '';

const buildDefaultCardName = (presetName: string, cardNumber: number): string =>
  `${presetName} ${cardNumber}`;

const formatCardDate = (value?: number): string => {
  if (!value) {
    return 'Not finished yet';
  }

  return new Date(value).toLocaleString();
};

const formatRuntime = (runtimeMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(runtimeMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
};

const getCardRuntimeMs = (card: PersistedBingoCard, now: number): number => {
  if (!card.timerStartedAt) {
    return card.runtimeMs;
  }

  return card.runtimeMs + Math.max(0, now - card.timerStartedAt);
};

const loadBingoState = (): PersistedBingoState => {
  const fallback: PersistedBingoState = {
    cards: [],
    archivedCards: [],
    activeCardIndex: 0,
    archivedCardIndex: 0,
    selectedPresetId: getDefaultSelectedPresetId(),
    difficulty: 'mixed',
    centerMode: 'free',
    cardView: 'active'
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

    const normalizeCards = (entries: unknown, archivedFallback: boolean): PersistedBingoCard[] => {
      if (!Array.isArray(entries)) {
        return [];
      }

      return entries.reduce<PersistedBingoCard[]>((acc, entry, index) => {
        if (!entry || typeof entry !== 'object') {
          return acc;
        }

        const candidate = entry as Partial<PersistedBingoCard>;
        if (!Array.isArray(candidate.card) || !Array.isArray(candidate.marked)) {
          return acc;
        }

        const presetId =
          typeof candidate.presetId === 'string'
            ? candidate.presetId
            : getDefaultSelectedPresetId();
        const presetName =
          BINGO_PRESETS.find((preset) => preset.id === presetId)?.name ?? 'Bingo Card';

        const normalizedName =
          typeof candidate.name === 'string' && candidate.name.trim().length > 0
            ? candidate.name.trim()
            : buildDefaultCardName(presetName, index + 1);

        const normalizedDifficulty: BingoDifficultyFilter =
          candidate.difficulty === 'easy' ||
          candidate.difficulty === 'medium' ||
          candidate.difficulty === 'hard' ||
          candidate.difficulty === 'mixed'
            ? candidate.difficulty
            : 'mixed';

        const normalizedCenterMode: BingoCenterMode =
          candidate.centerMode === 'free' || candidate.centerMode === 'goat'
            ? candidate.centerMode
            : inferCenterModeFromCard(candidate.card);

        acc.push({
          id: typeof candidate.id === 'string' ? candidate.id : `${Date.now()}-${index}`,
          name: normalizedName,
          presetId,
          difficulty: normalizedDifficulty,
          centerMode: normalizedCenterMode,
          card: candidate.card,
          marked: candidate.marked,
          runtimeMs: typeof candidate.runtimeMs === 'number' ? candidate.runtimeMs : 0,
          timerStartedAt:
            typeof candidate.timerStartedAt === 'number' ? candidate.timerStartedAt : undefined,
          createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
          isArchived:
            typeof candidate.isArchived === 'boolean' ? candidate.isArchived : archivedFallback,
          finishedAt:
            typeof candidate.finishedAt === 'number'
              ? candidate.finishedAt
              : typeof candidate.archivedAt === 'number'
                ? candidate.archivedAt
                : undefined,
          archivedAt: undefined
        });

        return acc;
      }, []);
    };

    const parsedCards = normalizeCards(parsed.cards, false);
    const parsedArchivedCards = normalizeCards(parsed.archivedCards, true);

    const boundedActiveIndex = Math.max(
      0,
      Math.min(
        Number.isFinite(parsed.activeCardIndex) ? Number(parsed.activeCardIndex) : 0,
        Math.max(parsedCards.length - 1, 0)
      )
    );

    const boundedArchivedIndex = Math.max(
      0,
      Math.min(
        Number.isFinite(parsed.archivedCardIndex) ? Number(parsed.archivedCardIndex) : 0,
        Math.max(parsedArchivedCards.length - 1, 0)
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
      parsed.centerMode === 'free' || parsed.centerMode === 'goat' ? parsed.centerMode : 'free';

    const cardView: BingoCardView =
      parsed.cardView === 'active' || parsed.cardView === 'archived' ? parsed.cardView : 'active';

    return {
      cards: parsedCards,
      archivedCards: parsedArchivedCards,
      activeCardIndex: boundedActiveIndex,
      archivedCardIndex: boundedArchivedIndex,
      selectedPresetId,
      difficulty,
      centerMode,
      cardView
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
  const [archivedCards, setArchivedCards] = useState<PersistedBingoCard[]>(persisted.archivedCards);
  const [activeCardIndex, setActiveCardIndex] = useState<number>(persisted.activeCardIndex);
  const [archivedCardIndex, setArchivedCardIndex] = useState<number>(persisted.archivedCardIndex);
  const [cardView, setCardView] = useState<BingoCardView>(persisted.cardView);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [runtimeNow, setRuntimeNow] = useState<number>(Date.now());

  const cardViewOptions: { label: string; value: BingoCardView }[] = [
    { label: 'Active Cards', value: 'active' },
    { label: 'Finished Cards', value: 'archived' }
  ];

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

  const visibleCards = cardView === 'active' ? cards : archivedCards;
  const visibleCardIndex = cardView === 'active' ? activeCardIndex : archivedCardIndex;
  const activeCard = visibleCards[visibleCardIndex];
  const isArchivedView = cardView === 'archived';
  const activeMarked = activeCard?.marked ?? emptyMarkState(centerMode);
  const completedLines = useMemo(() => countCompletedLines(activeMarked), [activeMarked]);
  const activeRuntimeMs = activeCard ? getCardRuntimeMs(activeCard, runtimeNow) : 0;

  useEffect(() => {
    if (!cards.some((card) => !!card.timerStartedAt)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRuntimeNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cards]);

  useEffect(() => {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const payload: PersistedBingoState = {
      cards,
      archivedCards,
      activeCardIndex,
      archivedCardIndex,
      selectedPresetId,
      difficulty,
      centerMode,
      cardView
    };

    localStorage.setItem(bingoStateStorageKey, JSON.stringify(payload));
  }, [
    activeCardIndex,
    archivedCardIndex,
    archivedCards,
    cards,
    difficulty,
    selectedPresetId,
    centerMode,
    cardView
  ]);

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
          runtimeMs: 0,
          timerStartedAt: undefined,
          createdAt: Date.now(),
          isArchived: false
        };
        const nextCards = [...prev, nextPersistedCard];
        setActiveCardIndex(nextCards.length - 1);
        setCardView('active');
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

    if (isArchivedView) {
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
    if (!activeCard || isArchivedView) {
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
    if (cardView === 'active') {
      setActiveCardIndex((prev) => Math.max(prev - 1, 0));
    } else {
      setArchivedCardIndex((prev) => Math.max(prev - 1, 0));
    }
    setShareStatus(null);
  };

  const showNextCard = () => {
    if (cardView === 'active') {
      setActiveCardIndex((prev) => Math.min(prev + 1, Math.max(cards.length - 1, 0)));
    } else {
      setArchivedCardIndex((prev) => Math.min(prev + 1, Math.max(archivedCards.length - 1, 0)));
    }
    setShareStatus(null);
  };

  const archiveActiveCard = () => {
    if (!activeCard || isArchivedView) {
      return;
    }

    const now = Date.now();

    const archivedTarget: PersistedBingoCard = {
      ...activeCard,
      runtimeMs: getCardRuntimeMs(activeCard, now),
      timerStartedAt: undefined,
      isArchived: true,
      finishedAt: now,
      archivedAt: undefined
    };

    setCards((prev) => {
      const remainingCards = prev.filter((card) => card.id !== activeCard.id);

      setActiveCardIndex((prevIndex) =>
        Math.min(prevIndex, Math.max(remainingCards.length - 1, 0))
      );

      return remainingCards;
    });

    setArchivedCards((archivedPrev) => {
      if (archivedPrev.some((card) => card.id === archivedTarget.id)) {
        return archivedPrev;
      }

      const nextArchived = [...archivedPrev, archivedTarget];
      setArchivedCardIndex(nextArchived.length - 1);
      return nextArchived;
    });

    setShareStatus(null);
  };

  const startTimer = () => {
    if (!activeCard || isArchivedView || activeCard.timerStartedAt) {
      return;
    }

    const now = Date.now();
    setCards((prev) => {
      const nextCards = [...prev];
      const target = nextCards[activeCardIndex];
      if (!target) {
        return prev;
      }

      nextCards[activeCardIndex] = {
        ...target,
        timerStartedAt: now
      };

      return nextCards;
    });
  };

  const pauseTimer = () => {
    if (!activeCard || isArchivedView || !activeCard.timerStartedAt) {
      return;
    }

    const now = Date.now();
    setCards((prev) => {
      const nextCards = [...prev];
      const target = nextCards[activeCardIndex];
      if (!target || !target.timerStartedAt) {
        return prev;
      }

      nextCards[activeCardIndex] = {
        ...target,
        runtimeMs: getCardRuntimeMs(target, now),
        timerStartedAt: undefined
      };

      return nextCards;
    });
  };

  const stopTimer = () => {
    if (!activeCard || isArchivedView) {
      return;
    }

    setCards((prev) => {
      const nextCards = [...prev];
      const target = nextCards[activeCardIndex];
      if (!target) {
        return prev;
      }

      nextCards[activeCardIndex] = {
        ...target,
        runtimeMs: 0,
        timerStartedAt: undefined
      };

      return nextCards;
    });
  };

  const discardActiveCard = () => {
    if (!activeCard) {
      return;
    }

    if (cardView === 'active') {
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
    } else {
      setArchivedCards((prev) => {
        const nextCards = prev.filter((card) => card.id !== activeCard.id);

        setArchivedCardIndex((prevIndex) => {
          if (nextCards.length === 0) {
            return 0;
          }

          return Math.min(prevIndex, nextCards.length - 1);
        });

        return nextCards;
      });
    }

    setShareStatus(null);
    setError(null);
  };

  const handleCardNameChange = (value: string) => {
    if (!activeCard) {
      return;
    }

    if (isArchivedView) {
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
            <label>View</label>
            <SelectButton
              value={cardView}
              options={cardViewOptions}
              optionLabel="label"
              optionValue="value"
              onChange={(event: SelectButtonChangeEvent) =>
                setCardView(event.value as BingoCardView)
              }
              className={styles.selectButton}
            />
            <small>
              {cardView === 'active'
                ? `${cards.length} active card(s)`
                : `${archivedCards.length} finished card(s)`}
            </small>
          </div>

          <div className={styles.controlBlock}>
            <label htmlFor="bingo-preset">Preset</label>
            <Dropdown
              inputId="bingo-preset"
              value={selectedPresetId}
              onChange={(event: DropdownChangeEvent) => setSelectedPresetId(event.value as string)}
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
                  setCenterMode(event.checked ? 'free' : 'goat')
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
            disabled={visibleCards.length === 0 || visibleCardIndex === 0}
          />
          <span className={styles.pagerStatus}>
            {visibleCards.length === 0
              ? 'No cards generated yet'
              : `Card ${visibleCardIndex + 1} of ${visibleCards.length}`}
          </span>
          <Button
            label="Next"
            icon="pi pi-angle-right"
            iconPos="right"
            severity="secondary"
            outlined
            onClick={showNextCard}
            disabled={visibleCards.length === 0 || visibleCardIndex >= visibleCards.length - 1}
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
                readOnly={isArchivedView}
              />
              <div className={styles.meta}>
                <span>{completedLines} line(s) complete</span>
              </div>
            </div>
            <div className={styles.dateMetaRow}>
              <div className={styles.datePill}>
                <strong>Created:</strong> {formatCardDate(activeCard.createdAt)}
              </div>
              <div className={styles.datePill}>
                <strong>Finished:</strong> {formatCardDate(activeCard.finishedAt)}
              </div>
              <div className={styles.datePill}>
                <strong>Run Time:</strong> {formatRuntime(activeRuntimeMs)}
              </div>
            </div>
            <div className={styles.cardActionsRow}>
              {!isArchivedView && (
                <>
                  <Button
                    label="Start Timer"
                    icon="pi pi-play"
                    severity="success"
                    outlined
                    onClick={startTimer}
                    disabled={!!activeCard.timerStartedAt}
                  />
                  <Button
                    label="Pause Timer"
                    icon="pi pi-pause"
                    severity="warning"
                    outlined
                    onClick={pauseTimer}
                    disabled={!activeCard.timerStartedAt}
                  />
                  <Button
                    label="Stop Timer"
                    icon="pi pi-stop"
                    severity="secondary"
                    outlined
                    onClick={stopTimer}
                    disabled={!activeCard.timerStartedAt && activeCard.runtimeMs === 0}
                  />
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
                    label="Finish"
                    icon="pi pi-check"
                    severity="success"
                    outlined
                    onClick={archiveActiveCard}
                  />
                </>
              )}
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
                  disabled={cell.isFree || isArchivedView}
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
