import { TotalsUIModel } from '@/cache/totals-model';
import { AccountUIModel } from './account-ui-model';
import { CharUIModel } from './char-ui-model';
import { ExaltUIModel } from './exalt-ui-model';

export interface CharListResponseUIModel {
  account: AccountUIModel | null;
  charList: CharUIModel[];
  exalts: ExaltUIModel[] | null;
  totals: TotalsUIModel[];
  maxClassLevels: {
    classType: string;
    maxLevel: number;
  }[];
  maxNumChars: number;
  nextCharId: number;
}
