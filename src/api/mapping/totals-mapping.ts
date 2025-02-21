import { AccountUIModel } from '@api/models/account-ui-model';
import { CharUIModel, ItemUIModel } from '@api/models/char-ui-model';

// todo: proper use of function
export function mapTotals(accounts: AccountUIModel[], charList: CharUIModel[]): ItemUIModel[] {
  const totals = new Map<number, number>();

  const iterateItems = (items: number[]) => {
    items.forEach((item) => {
      const current = totals.get(item) || 0;
      totals.set(item, current + 1);
    });
  };

  const iterateQuickslots = (items: ItemUIModel[]) => {
    items.forEach((item) => {
      const current = totals.get(item.itemId) || 0;
      totals.set(item.itemId, current + (item.amount ?? 0));
    });
  };

  accounts.forEach((account) => {
    // gifts
    const gifts = account?.gifts || [];
    iterateItems(gifts);

    // temporaryGifts
    const temporaryGifts = account?.seasonalSpoils || [];
    iterateItems(temporaryGifts);

    // vault
    const vault = account?.vault || [];
    iterateItems(vault);

    // characters
    const characters = charList || [];
    characters.forEach((character) => {
      // equipment
      const equipment = character.equipment || [];
      iterateItems(equipment);

      // quickslots
      const quickslots = character.equip_qs || [];
      iterateQuickslots(quickslots);
    });
  });

  return Array.from(totals).map(([itemId, amount]) => ({
    itemId,
    amount
  }));
}
