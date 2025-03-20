import { ItemUIModel } from '@api/models/char-ui-model';

export interface TotalsUIModel extends ItemUIModel {
  // amount is required here and not optional, if an item doesn't exist it was never added to the set
  amount: number;
}
