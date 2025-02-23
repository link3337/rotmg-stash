const magicalLodeStoneItemId = 598;
const honeyCircletItemId = 2298;
const muramasaItemId = 3151;

/**
 * A map of item aliases to their corresponding item IDs.
 * 
 * This map is used to provide easy-to-remember names for certain items
 * and their associated item ids.
 * 
 * @constant
 * @type {Map<string, number>}
 * @property {string} key - The alias name of the item.
 * @property {number} value - The unique identifier of the item.

 */
export const itemAliases: Map<string, number> = new Map([
  ['Potato', magicalLodeStoneItemId],
  ['Best Katana', muramasaItemId],
  ['GOAT Ring', honeyCircletItemId]
]);
