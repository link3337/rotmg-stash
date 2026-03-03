import { useConstants } from '@/providers/ConstantsProvider';
import { ClassID } from '@/realm/renders/classes';
import { CharUIModel } from '@api/models/char-ui-model';
import { ClassStat } from '@realm/models/charlist-response';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React from 'react';

interface CharactersInfoProps {
  classStats: ClassStat[];
  characters: CharUIModel[];
}

interface CharacterInfo {
  name: string;
  highestAliveFame: number;
  totalAliveFame: number;
  highestDeadFame: number;
  amount: number;
}

const CharactersInfo: React.FC<CharactersInfoProps> = ({ classStats, characters }) => {
  const { constants } = useConstants();

  const characterInfo: CharacterInfo[] = Object.values(ClassID)
    .filter((id) => !isNaN(Number(id)))
    .map((classId) => {
      const classCharacters = characters.filter((char) => char.classId === classId);
      const totalAliveFame = classCharacters.reduce((acc, char) => acc + (char.fame || 0), 0);

      return {
        name: constants?.classes?.[classId]?.name ?? 'Unknown',
        highestAliveFame: Math.max(0, ...classCharacters.map((char) => char.fame || 0)),
        // parse hexcode (objectType) to number
        highestDeadFame: Math.max(
          0,
          ...classStats
            .filter((x) => Number(x.objectType) === Number(classId))
            .map((char) => parseInt(char.BestTotalFame) || 0)
        ),
        totalAliveFame,
        amount: classCharacters.length
      } as CharacterInfo;
    })
    .filter((info) => info.amount > 0); // Only include classes with characters

  // Transform data for table
  const tableData = [
    {
      type: 'Highest Alive Fame',
      ...characterInfo.reduce(
        (acc, info) => ({
          ...acc,
          [info.name]: info.highestAliveFame
        }),
        {}
      )
    },
    {
      type: 'Total Alive Fame',
      ...characterInfo.reduce(
        (acc, info) => ({
          ...acc,
          [info.name]: info.totalAliveFame
        }),
        {}
      )
    },
    {
      type: 'Average Fame per Character',
      ...characterInfo.reduce(
        (acc, info) => ({
          ...acc,
          [info.name]: info.amount > 0 ? Math.ceil(info.totalAliveFame / info.amount) : 0
        }),
        {}
      )
    },
    {
      type: 'Highest Dead Fame',
      ...characterInfo.reduce(
        (acc, info) => ({
          ...acc,
          [info.name]: info.highestDeadFame
        }),
        {}
      )
    },
    {
      type: 'Characters',
      ...characterInfo.reduce(
        (acc, info) => ({
          ...acc,
          [info.name]: info.amount
        }),
        {}
      )
    }
  ];

  return (
    <DataTable value={tableData} stripedRows showGridlines size="small" className="mt-2">
      <Column field="type" header="Class" frozen style={{ fontWeight: 'bold' }} />
      {characterInfo.map((info) => (
        <Column key={info.name} field={info.name} header={info.name} align="right" />
      ))}
    </DataTable>
  );
};

export default CharactersInfo;
