export type SortDirection = 'asc' | 'desc';

/**
 * Sorts two values based on their boolean representation (true or false).
 * Converts the input values to boolean numbers (0 for false, 1 for true)
 * and sorts them in ascending or descending order based on the specified direction.
 *
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @param direction - The sorting direction, either 'asc' for ascending or 'desc' for descending.
 * @returns A number indicating the sort order: negative if `a` should come before `b`,
 *          positive if `a` should come after `b`, or zero if they are equal.
 */
export const booleanSort = (a: any, b: any, direction: SortDirection): number => {
  // Convert to boolean numbers (0 or 1)
  const valA = Number(Boolean(a));
  const valB = Number(Boolean(b));
  return direction === 'asc' ? valA - valB : valB - valA;
};


const toNumber = (value: any): number => {
  return Number(value) || 0;
};

export const numberSort = (a: any, b: any, direction: SortDirection): number => {
  a = toNumber(a);
  b = toNumber(b);
  return direction === 'asc' ? a - b : b - a;
}