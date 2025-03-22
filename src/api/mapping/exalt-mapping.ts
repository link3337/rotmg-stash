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

/**
 * Maps raw exalts data to an array of ExaltUIModel objects.
 *
 * @param exalts - The raw exalts data which can be either an array of ExaltStats or a single ExaltStats object.
 * @returns An array of ExaltUIModel objects if exalts data is provided, otherwise null.
 */
export function mapExalts(exalts: ExaltsRaw | undefined): ExaltUIModel[] | null {
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
