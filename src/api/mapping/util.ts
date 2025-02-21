export function objectToArray<T>(obj: T | T[] | undefined): T[] {
  if (obj === null || obj === undefined) return [];
  return Array.isArray(obj) ? obj : [obj as T];
}

export const parseItemList = (items: string | undefined): number[] => {
  return (
    items
      ?.split(',')
      .flatMap((item) => parseInt(item?.split('#')[0], 10))
      .filter((item) => !isNaN(item)) ?? []
  );
};
