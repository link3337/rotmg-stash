/**
 * Converts an object or an array of objects into an array.
 *
 * @template T - The type of the object.
 * @param {T | T[] | undefined} obj - The object or array of objects to convert.
 * @returns {T[]} An array containing the object(s). If the input is `null` or `undefined`, returns an empty array.
 */
export function objectToArray<T>(obj: T | T[] | undefined): T[] {
  if (obj === null || obj === undefined) return [];
  return Array.isArray(obj) ? obj : [obj as T];
}

/**
 * Parses a comma-separated list of items and returns an array of numbers.
 *
 * Each item in the list can optionally contain a '#' character, in which case
 * only the part before the '#' is considered. The function filters out any
 * non-numeric values.
 *
 * @param items - A comma-separated string of items, or undefined.
 * @returns An array of numbers parsed from the input string.
 */
export const parseItemList = (items: string | undefined): number[] => {
  return (
    items
      ?.split(',')
      .flatMap((item) => parseInt(item?.split('#')[0], 10))
      .filter((item) => !isNaN(item)) ?? []
  );
};
