import { items, RealmItem } from '../realm/renders/items';

export const itemNameMap: Map<string, number> = new Map(
  Object.entries(items).map(([key, value]) => [
    value.isShiny ? value.technicalName : value.name,
    parseInt(key)
  ])
);

export const itemNameMapFull: Map<string, RealmItem> = new Map(
  Object.entries(items).map(([_key, value]) => [
    value.isShiny ? value.technicalName : value.name,
    value
  ])
);
