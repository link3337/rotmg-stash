import { ExaltStats } from '@realm/models/charlist-response';
import { ExaltUIModel } from '../models/exalt-ui-model';

type ExaltsRaw =
  | {
      class: string;
      '#text': string;
    }[]
  | {
      class: string;
      '#text': string;
    }
  | null;

export function mapExalts(exalts: ExaltsRaw): ExaltUIModel[] | null {
  let exaltUiModel: ExaltUIModel[] | undefined;
  if (!exalts) return null;

  if (Array.isArray(exalts)) {
    exaltUiModel = (exalts as ExaltStats[])?.map((x: ExaltStats) => ({
      classId: x.class,
      exalts: x['#text']?.split(',')
    }));
  } else {
    const singleExalt = exalts as ExaltStats;
    exaltUiModel = [
      {
        classId: singleExalt.class,
        exalts: singleExalt['#text']?.split(',')
      }
    ];
  }
  return exaltUiModel;
}
