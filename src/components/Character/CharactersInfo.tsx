import { useConstants } from '@/providers/ConstantsProvider';
import { ClassID } from '@/realm/renders/classes';
import { CharUIModel } from '@api/models/char-ui-model';
import { ClassStat } from '@realm/models/charlist-response';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Row } from 'primereact/row';
import React from 'react';
import OwnedSkinsDialog from '../Account/OwnedSkinsDialog';

interface CharactersInfoProps {
  accountId: string;
  classStats: ClassStat[];
  characters: CharUIModel[];
  useAccordionMenu?: boolean;
  ownedSkins?: string;
}

interface CharacterInfo {
  classId: ClassID;
  name: string;
  highestAliveFame: number;
  totalAliveFame: number;
  highestDeadFame: number;
  amount: number;
  averageWithoutTop?: number;
  topCharacterName?: string;
  topCharacterId?: number;
  topCharacterFame?: number;
  fameShare?: number;
  topFamePct?: number;
  avgMaxedStats?: number;
}

interface CharacterInfoTableBaseRow {
  classId: ClassID;
  name: string;
  highestAliveFame: number;
  totalAliveFame: number;
  averageFame: number;
  averageWithoutTop: number;
  topCharacterName: string;
  topCharacterId: number;
  topCharacterFame: number;
  avgMaxedStats: number;
  highestDeadFame: number;
  characters: number;
  skinsCount: number;
}

interface CharacterInfoTableRow extends CharacterInfoTableBaseRow {
  fameShare: number;
  topFamePct: number;
}

interface CharacterInfoColumnConfig {
  field: keyof CharacterInfoSummaryRow;
  header: string;
  align?: 'right';
  sortable?: boolean;
  frozen?: boolean;
  style?: React.CSSProperties;
  body?: (row: CharacterInfoTableRow) => React.ReactNode;
}

interface CharacterInfoSummaryRow {
  name: string;
  highestAliveFame: number;
  totalAliveFame: number;
  averageFame: number;
  averageWithoutTop: number;
  topCharacterFame: number;
  fameShare: number;
  topFamePct: number;
  avgMaxedStats: number;
  highestDeadFame: number;
  characters: number;
  skinsCount: number;
}

type CharacterInfoSummaryValues = Omit<CharacterInfoSummaryRow, 'name'>;

const round = (value: number, decimals = 0) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const buildAveragesRow = (rows: CharacterInfoTableRow[]): CharacterInfoSummaryRow => {
  const classCount = rows.length;

  const sumRow = rows.reduce<CharacterInfoSummaryValues>(
    (acc, row) => ({
      highestAliveFame: acc.highestAliveFame + row.highestAliveFame,
      totalAliveFame: acc.totalAliveFame + row.totalAliveFame,
      averageFame: acc.averageFame + row.averageFame,
      averageWithoutTop: acc.averageWithoutTop + row.averageWithoutTop,
      topCharacterFame: acc.topCharacterFame + row.topCharacterFame,
      fameShare: acc.fameShare + row.fameShare,
      topFamePct: acc.topFamePct + row.topFamePct,
      avgMaxedStats: acc.avgMaxedStats + row.avgMaxedStats,
      highestDeadFame: acc.highestDeadFame + row.highestDeadFame,
      characters: acc.characters + row.characters,
      skinsCount: acc.skinsCount + row.skinsCount
    }),
    {
      highestAliveFame: 0,
      totalAliveFame: 0,
      averageFame: 0,
      averageWithoutTop: 0,
      topCharacterFame: 0,
      fameShare: 0,
      topFamePct: 0,
      avgMaxedStats: 0,
      highestDeadFame: 0,
      characters: 0,
      skinsCount: 0
    }
  );

  const average = (value: number) => (classCount > 0 ? value / classCount : 0);

  return {
    name: 'Averages',
    highestAliveFame: round(average(sumRow.highestAliveFame)),
    totalAliveFame: round(average(sumRow.totalAliveFame)),
    averageFame: round(average(sumRow.averageFame)),
    averageWithoutTop: round(average(sumRow.averageWithoutTop)),
    topCharacterFame: round(average(sumRow.topCharacterFame)),
    fameShare: round(average(sumRow.fameShare), 2),
    topFamePct: round(average(sumRow.topFamePct), 2),
    avgMaxedStats: round(average(sumRow.avgMaxedStats), 1),
    highestDeadFame: round(average(sumRow.highestDeadFame)),
    characters: round(average(sumRow.characters), 2),
    skinsCount: round(average(sumRow.skinsCount), 2)
  };
};

const buildTotalsRow = (rows: CharacterInfoTableRow[]): CharacterInfoSummaryRow => {
  const totals = rows.reduce<CharacterInfoSummaryValues>(
    (acc, row) => ({
      highestAliveFame: acc.highestAliveFame + row.highestAliveFame,
      totalAliveFame: acc.totalAliveFame + row.totalAliveFame,
      averageFame: acc.averageFame + row.averageFame,
      averageWithoutTop: acc.averageWithoutTop + row.averageWithoutTop,
      topCharacterFame: acc.topCharacterFame + row.topCharacterFame,
      fameShare: acc.fameShare + row.fameShare,
      topFamePct: acc.topFamePct + row.topFamePct,
      avgMaxedStats: acc.avgMaxedStats + row.avgMaxedStats,
      highestDeadFame: acc.highestDeadFame + row.highestDeadFame,
      characters: acc.characters + row.characters,
      skinsCount: acc.skinsCount + row.skinsCount
    }),
    {
      highestAliveFame: 0,
      totalAliveFame: 0,
      averageFame: 0,
      averageWithoutTop: 0,
      topCharacterFame: 0,
      fameShare: 0,
      topFamePct: 0,
      avgMaxedStats: 0,
      highestDeadFame: 0,
      characters: 0,
      skinsCount: 0
    }
  );

  return {
    name: 'Totals',
    ...totals,
    fameShare: round(totals.fameShare, 2),
    topFamePct: round(totals.topFamePct, 2),
    avgMaxedStats: round(totals.avgMaxedStats, 1)
  };
};

const CharactersInfo: React.FC<CharactersInfoProps> = ({
  accountId,
  classStats,
  characters,
  useAccordionMenu = false,
  ownedSkins
}) => {
  const [showOwnedSkinsDialog, setShowOwnedSkinsDialog] = React.useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = React.useState<string | undefined>(
    undefined
  );
  const { constants } = useConstants();

  const ownedSkinIds = React.useMemo(
    () => ownedSkins?.split(',').filter((id) => id) ?? [],
    [ownedSkins]
  );

  const getClassName = React.useCallback(
    (classTypeId: number) =>
      constants?.classes?.[String(classTypeId) as ClassID]?.name || 'Unknown',
    [constants?.classes]
  );

  const groupedSkins = React.useMemo(
    () =>
      ownedSkinIds.reduce(
        (acc, skinId) => {
          const skinData = constants?.skins?.[Number(skinId)];
          if (skinData) {
            const className = getClassName(skinData.classType);
            if (!acc[className]) {
              acc[className] = [];
            }
            acc[className].push(skinId);
          }
          return acc;
        },
        {} as Record<string, string[]>
      ),
    [ownedSkinIds, constants?.skins, getClassName]
  );

  const characterInfo: CharacterInfo[] = Object.values(ClassID)
    .filter((id) => !isNaN(Number(id)))
    .map((classId) => {
      const classCharacters = characters.filter((char) => char.classId === classId);
      const fameList = classCharacters.map((char) => char.fame || 0).sort((a, b) => a - b);
      const totalAliveFame = fameList.reduce((acc, f) => acc + f, 0);
      const highestAliveFame = fameList.length > 0 ? Math.max(0, ...fameList) : 0;
      const maxedCounts = classCharacters.map((c) =>
        (c.mappedStats ?? []).reduce((s, m) => s + (m.maxed ? 1 : 0), 0)
      );

      // average without top (robust average)
      const averageWithoutTop =
        fameList.length > 1
          ? Math.ceil((totalAliveFame - highestAliveFame) / (fameList.length - 1))
          : 0;

      // top character
      const topChar = classCharacters.reduce((best, c) => {
        if (!best) return c;
        return (c.fame || 0) > (best.fame || 0) ? c : best;
      }, classCharacters[0]);
      const topCharacterName = topChar?.className ?? '';
      const topCharacterId = topChar?.id ?? 0;
      const topCharacterFame = topChar?.fame ?? 0;
      const avgMaxedStats =
        maxedCounts.length > 0
          ? Math.round((maxedCounts.reduce((a, b) => a + b, 0) / maxedCounts.length) * 10) / 10
          : 0;

      return {
        classId,
        name: constants?.classes?.[classId]?.name ?? 'Unknown',
        highestAliveFame,
        // parse hexcode (objectType) to number
        highestDeadFame: Math.max(
          0,
          ...classStats
            .filter((x) => Number(x.objectType) === Number(classId))
            .map((char) => parseInt(char.BestTotalFame) || 0)
        ),
        totalAliveFame,
        amount: classCharacters.length,
        averageWithoutTop,
        topCharacterName,
        topCharacterId,
        topCharacterFame,
        avgMaxedStats
      } as CharacterInfo;
    })
    .filter((info) => info.amount > 0); // Only include classes with characters

  // Each row is a class; columns are the metrics
  const tableData: CharacterInfoTableBaseRow[] = characterInfo.map((info) => ({
    classId: info.classId,
    name: info.name,
    highestAliveFame: info.highestAliveFame,
    totalAliveFame: info.totalAliveFame,
    averageFame: info.amount > 0 ? Math.ceil(info.totalAliveFame / info.amount) : 0,
    averageWithoutTop: info.averageWithoutTop ?? 0,
    topCharacterName: info.topCharacterName ?? '',
    topCharacterId: info.topCharacterId ?? 0,
    topCharacterFame: info.topCharacterFame ?? 0,
    avgMaxedStats: info.avgMaxedStats ?? 0,
    highestDeadFame: info.highestDeadFame,
    characters: info.amount,
    skinsCount: groupedSkins[info.name]?.length ?? 0
  }));

  const totalAllAliveFame = characterInfo.reduce((acc, i) => acc + (i.totalAliveFame || 0), 0);

  // add percentage fields based on totalAllAliveFame
  const tableDataWithPct: CharacterInfoTableRow[] = tableData.map((row) => ({
    ...row,
    fameShare:
      totalAllAliveFame > 0
        ? Math.round((row.totalAliveFame / totalAllAliveFame) * 10000) / 100
        : 0,
    topFamePct:
      row.totalAliveFame > 0
        ? Math.round((row.topCharacterFame / row.totalAliveFame) * 10000) / 100
        : 0
  }));

  const averagesRow = buildAveragesRow(tableDataWithPct);
  const totalsRow = buildTotalsRow(tableDataWithPct);

  const topCharacterBody = (row: CharacterInfoTableRow) => {
    const id = row.topCharacterId;
    const name = row.topCharacterName;
    const fame = row.topCharacterFame;
    if (!id) return null;
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      const domId = `${accountId}-character-${id}`;
      const el = document.getElementById(domId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return (
      <a href={`#${accountId}-character-${id}`} onClick={handleClick}>
        {name} #{id} ({fame})
      </a>
    );
  };

  const skinsCountBody = (row: CharacterInfoTableRow) => {
    const count = row.skinsCount;
    if (count <= 0) return 0;

    return (
      <button
        type="button"
        onClick={() => {
          setSelectedClassFilter(row.name);
          setShowOwnedSkinsDialog(true);
        }}
        style={{
          all: 'unset',
          cursor: 'pointer',
          color: 'var(--primary-color)'
        }}
        aria-label={`Open owned skins for ${row.name}`}
      >
        {count}
      </button>
    );
  };

  const columns: CharacterInfoColumnConfig[] = [
    {
      field: 'name',
      header: 'Class',
      frozen: true,
      style: { fontWeight: 'bold' },
      sortable: true
    },
    {
      field: 'topCharacterFame',
      header: 'Top Character',
      align: 'right',
      sortable: true,
      body: topCharacterBody
    },
    { field: 'totalAliveFame', header: 'Total Alive Fame', align: 'right', sortable: true },
    { field: 'fameShare', header: 'Fame Share %', align: 'right', sortable: true },
    { field: 'topFamePct', header: 'Top Fame %', align: 'right', sortable: true },
    { field: 'avgMaxedStats', header: 'Avg Maxed Stats', align: 'right', sortable: true },
    { field: 'averageFame', header: 'Avg Fame per Character', align: 'right', sortable: true },
    { field: 'averageWithoutTop', header: 'Avg without Top', align: 'right', sortable: true },
    { field: 'highestDeadFame', header: 'Highest Dead Fame', align: 'right', sortable: true },
    { field: 'characters', header: 'Characters', align: 'right', sortable: true },
    {
      field: 'skinsCount',
      header: 'Skins Count',
      align: 'right',
      sortable: true,
      body: skinsCountBody
    }
  ];

  const footerValue = (
    field: CharacterInfoColumnConfig['field'],
    label: string,
    summaryRow: CharacterInfoSummaryRow
  ): React.ReactNode => {
    if (field === 'name') return label;
    if (label === 'Totals' && (field === 'topFamePct' || field === 'avgMaxedStats')) return '-';

    if (label === 'Totals' && field === 'skinsCount') {
      const totalSkins = summaryRow.skinsCount;

      if (totalSkins <= 0) {
        return 0;
      }

      return (
        <button
          type="button"
          onClick={() => {
            setSelectedClassFilter(undefined);
            setShowOwnedSkinsDialog(true);
          }}
          style={{
            all: 'unset',
            cursor: 'pointer',
            color: 'var(--primary-color)'
          }}
          aria-label="Open all owned skins"
        >
          {totalSkins}
        </button>
      );
    }

    return summaryRow[field];
  };

  const footerColumnGroup = (
    <ColumnGroup>
      <Row>
        {columns.map((column) => (
          <Column
            key={`avg-${column.field}`}
            align={column.align}
            footer={footerValue(column.field, 'Averages', averagesRow)}
          />
        ))}
      </Row>
      <Row>
        {columns.map((column) => (
          <Column
            key={`total-${column.field}`}
            align={column.align}
            footer={footerValue(column.field, 'Totals', totalsRow)}
          />
        ))}
      </Row>
    </ColumnGroup>
  );

  const table = (
    <>
      <DataTable
        value={tableDataWithPct}
        stripedRows
        showGridlines
        size="small"
        className="mt-2"
        sortMode="single"
        sortField="name"
        sortOrder={1}
        footerColumnGroup={footerColumnGroup}
      >
        {columns.map((column) => (
          <Column
            key={column.field}
            field={column.field}
            header={column.header}
            align={column.align}
            sortable={column.sortable}
            frozen={column.frozen}
            style={column.style}
            body={column.body}
          />
        ))}
      </DataTable>

      <OwnedSkinsDialog
        visible={showOwnedSkinsDialog}
        onHide={() => {
          setShowOwnedSkinsDialog(false);
          setSelectedClassFilter(undefined);
        }}
        ownedSkinIds={ownedSkinIds}
        classFilter={selectedClassFilter}
      />
    </>
  );

  if (!useAccordionMenu) {
    return table;
  }

  return (
    <Accordion className="accordion-title-white">
      <AccordionTab header="Character Class Summary">{table}</AccordionTab>
    </Accordion>
  );
};

export default CharactersInfo;
