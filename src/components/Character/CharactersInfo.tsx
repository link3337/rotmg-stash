import { useConstants } from '@/providers/ConstantsProvider';
import { ClassID } from '@/realm/renders/classes';
import { CharUIModel } from '@api/models/char-ui-model';
import { ClassStat } from '@realm/models/charlist-response';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React from 'react';

interface CharactersInfoProps {
  accountId: string;
  classStats: ClassStat[];
  characters: CharUIModel[];
}

interface CharacterInfo {
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

const CharactersInfo: React.FC<CharactersInfoProps> = ({ accountId, classStats, characters }) => {
  const { constants } = useConstants();

  const characterInfo: CharacterInfo[] = Object.values(ClassID)
    .filter((id) => !isNaN(Number(id)))
    .map((classId) => {
      const classCharacters = characters.filter((char) => char.classId === classId);
      const fameList = classCharacters.map((char) => char.fame || 0).sort((a, b) => a - b);
      const totalAliveFame = fameList.reduce((acc, f) => acc + f, 0);
      const highestAliveFame = fameList.length > 0 ? Math.max(0, ...fameList) : 0;
      const maxedCounts = classCharacters.map((c) => (c.mappedStats ?? []).reduce((s, m) => s + (m.maxed ? 1 : 0), 0));

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
      const avgMaxedStats = maxedCounts.length > 0 ? Math.round((maxedCounts.reduce((a, b) => a + b, 0) / maxedCounts.length) * 10) / 10 : 0;

      return {
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
        avgMaxedStats,
      } as CharacterInfo;
    })
    .filter((info) => info.amount > 0); // Only include classes with characters

  // Each row is a class; columns are the metrics
  const tableData = characterInfo.map((info) => ({
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
    characters: info.amount
  }));

  const totalAllAliveFame = characterInfo.reduce((acc, i) => acc + (i.totalAliveFame || 0), 0);

  // add percentage fields based on totalAllAliveFame
  const tableDataWithPct = tableData.map((row) => ({
    ...row,
    fameShare: totalAllAliveFame > 0 ? Math.round((row.totalAliveFame / totalAllAliveFame) * 1000) / 10 : 0,
    topFamePct: row.totalAliveFame > 0 ? Math.round((row.topCharacterFame / row.totalAliveFame) * 1000) / 10 : 0
  }));

  return (
    <DataTable
      value={tableDataWithPct}
      stripedRows
      showGridlines
      size="small"
      className="mt-2"
      sortMode="single"
      sortField="name"
      sortOrder={1}
    >
      <Column field="name" header="Class" frozen style={{ fontWeight: 'bold' }} sortable />
      <Column
        field="topCharacterFame"
        header="Top Character"
        align="right"
        sortable
        body={(row: {
          topCharacterId: number;
          topCharacterName: string;
          topCharacterFame: number;
          topFamePct?: number;
        }) => {
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
        }}
      />
      <Column field="totalAliveFame" header="Total Alive Fame" align="right" sortable />
      <Column field="fameShare" header="Fame Share %" align="right" sortable />
      <Column field="topFamePct" header="Top Fame %" align="right" sortable />
      <Column field="avgMaxedStats" header="Avg Maxed Stats" align="right" sortable />
      <Column field="averageFame" header="Average Fame per Character" align="right" sortable />
      <Column field="averageWithoutTop" header="Avg without Top" align="right" sortable />
      <Column field="highestDeadFame" header="Highest Dead Fame" align="right" sortable />
      <Column field="characters" header="Characters" align="right" sortable />
    </DataTable>
  );
};

export default CharactersInfo;
