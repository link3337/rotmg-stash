import { TotalsUIModel } from '@/cache/totals-model';
import { classes, ClassID } from '@/realm/renders/classes';
import { Char, CharListResponse, MaxClassLevel } from '@realm/models/charlist-response';
import {
  CharacterStats,
  CharUIModel,
  ItemUIModel,
  MappedCharacterStats
} from '../models/char-ui-model';
import { CharListResponseUIModel } from '../models/charlist-response-ui-model';
import { mapAccount } from './account-mapping';
import { mapExalts } from './exalt-mapping';
import { mapTotals } from './totals-mapping';
import { objectToArray } from './util';

export function mapCharListResponse(charListResponse: CharListResponse): CharListResponseUIModel {
  const charList: Char[] = objectToArray<Char>(charListResponse?.Char);
  const maxClassLevels: MaxClassLevel[] = objectToArray<MaxClassLevel>(
    charListResponse.MaxClassLevelList?.MaxClassLevel
  );

  const mappedCharlist: CharUIModel[] = charList
    ?.map(mapCharModel)
    .filter((char) => char !== null)
    .sort((a, b) => a.id - b.id) as CharUIModel[];

  const mappedAccount = mapAccount(charListResponse.Account, mappedCharlist);

  // totals for that single account
  const accountTotals: TotalsUIModel[] = mapTotals(mappedAccount, mappedCharlist);

  return {
    account: mappedAccount,
    charList: mappedCharlist,
    exalts: mapExalts(charListResponse.PowerUpStats?.ClassStats),
    totals: accountTotals,
    maxClassLevels:
      maxClassLevels?.map((maxClassLevel) => ({
        classType: maxClassLevel.classType,
        maxLevel: parseInt(maxClassLevel.maxLevel)
      })) ?? [],
    nextCharId: charListResponse.nextCharId ? parseInt(charListResponse.nextCharId, 10) : 0,
    maxNumChars: charListResponse.maxNumChars ? parseInt(charListResponse.maxNumChars, 10) : 0
  };
}

export function mapQuickSlot(quickslots: string): ItemUIModel[] {
  return quickslots?.split(',')?.map((slot) => {
    const [itemId, amount] = slot.split('|');
    return {
      itemId: itemId ? parseInt(itemId, 10) : 0,
      amount: amount ? parseInt(amount, 10) : 1
    };
  });
}

const mapStats = (classId: ClassID, rawStats: CharacterStats): MappedCharacterStats[] => {
  const classObj = classes[classId];
  const classMaxStats = classObj[3];

  return [
    {
      name: 'HP',
      value: rawStats.maxHP ?? 0,
      maxed: (rawStats.maxHP ?? 0) >= classMaxStats[0],
      toMax: Math.ceil((classMaxStats[0] - (rawStats.maxHP ?? 0)) / 5)
    },
    {
      name: 'MP',
      value: rawStats.maxMP ?? 0,
      maxed: (rawStats?.maxMP ?? 0) >= classMaxStats[1],
      toMax: Math.ceil((classMaxStats[1] - (rawStats?.maxMP ?? 0)) / 5)
    },
    {
      name: 'ATT',
      value: rawStats?.attack ?? 0,
      maxed: (rawStats?.attack ?? 0) >= classMaxStats[2],
      toMax: classMaxStats[2] - (rawStats?.attack ?? 0)
    },
    {
      name: 'DEF',
      value: rawStats?.defense ?? 0,
      maxed: (rawStats?.defense ?? 0) >= classMaxStats[3],
      toMax: classMaxStats[3] - (rawStats?.defense ?? 0)
    },
    {
      name: 'SPD',
      value: rawStats?.speed ?? 0,
      maxed: (rawStats?.speed ?? 0) >= classMaxStats[4],
      toMax: classMaxStats[4] - (rawStats?.speed ?? 0)
    },
    {
      name: 'DEX',
      value: rawStats?.dexterity ?? 0,
      maxed: (rawStats?.dexterity ?? 0) >= classMaxStats[5],
      toMax: classMaxStats[5] - (rawStats?.dexterity ?? 0)
    },
    {
      name: 'VIT',
      value: rawStats?.vitality ?? 0,
      maxed: (rawStats?.vitality ?? 0) >= classMaxStats[6],
      toMax: classMaxStats[6] - (rawStats?.vitality ?? 0)
    },
    {
      name: 'WIS',
      value: rawStats?.wisdom ?? 0,
      maxed: (rawStats?.wisdom ?? 0) >= classMaxStats[7],
      toMax: classMaxStats[7] - (rawStats?.wisdom ?? 0)
    }
  ];
};

function mapCharModel(char: Char): CharUIModel | null {
  if (!char) return null;

  const classId = parseInt(char.ObjectType, 10) as ClassID;
  const classObj = classes[classId];

  const rawStats: CharacterStats = {
    maxHP: char.MaxHitPoints ? parseInt(char.MaxHitPoints, 10) : 0,
    hp: char.HitPoints ? parseInt(char.HitPoints, 10) : 0,
    maxMP: char.MaxMagicPoints ? parseInt(char.MaxMagicPoints, 10) : 0,
    mp: char.MagicPoints ? parseInt(char.MagicPoints, 10) : 0,
    attack: char.Attack ? parseInt(char.Attack, 10) : 0,
    defense: char.Defense ? parseInt(char.Defense, 10) : 0,
    speed: char.Speed ? parseInt(char.Speed, 10) : 0,
    dexterity: char.Dexterity ? parseInt(char.Dexterity, 10) : 0,
    vitality: char.HpRegen ? parseInt(char.HpRegen, 10) : 0,
    wisdom: char.MpRegen ? parseInt(char.MpRegen, 10) : 0
  };

  return {
    id: char?.id ? parseInt(char?.id, 10) : -1,
    classId: classId,
    className: classObj[0],
    seasonal: char.Seasonal?.toLowerCase() === 'true',
    level: char.Level ? parseInt(char.Level, 10) : 1,
    exp: char.Exp ? parseInt(char.Exp, 10) : 0,
    fame: char.CurrentFame ? parseInt(char.CurrentFame, 10) : 0,
    equipment: char.Equipment?.split(',').map((item) => parseInt(item.split('#')[0], 10)),
    equip_qs: mapQuickSlot(char.EquipQS),
    health_stack_count: char.HealthStackCount ? parseInt(char.HealthStackCount, 10) : 0,
    magic_stack_count: char.MagicStackCount ? parseInt(char.MagicStackCount, 10) : 0,
    dead: char.Dead?.toLowerCase() === 'true',
    pet: {
      name: char.Pet?.name,
      type: char.Pet?.type ? parseInt(char.Pet.type, 10) : -1,
      instance_id: char.Pet?.instanceId ? parseInt(char.Pet.instanceId, 10) : -1,
      rarity: char.Pet?.rarity ? parseInt(char.Pet.rarity, 10) : -1,
      max_ability_power: char.Pet?.maxAbilityPower ? parseInt(char.Pet.maxAbilityPower, 10) : 0,
      skin: char.Pet?.skin ? parseInt(char.Pet.skin, 10) : -1,
      shader: char.Pet?.shader ? parseInt(char.Pet.shader, 10) : -1,
      created_on: char.Pet?.createdOn,
      inc_inv: char.Pet?.incInv ? parseInt(char.Pet.incInv, 10) : 0,
      inv: char.Pet?.inv,
      ability1_type: char.Pet?.Abilities?.Ability[0]?.type
        ? parseInt(char.Pet?.Abilities?.Ability[0]?.type, 10)
        : -1,
      ability1_power: char.Pet?.Abilities?.Ability[0]?.power
        ? parseInt(char.Pet?.Abilities?.Ability[0]?.power, 10)
        : 0,
      ability1_points: char.Pet?.Abilities?.Ability[0]?.points
        ? parseInt(char.Pet?.Abilities?.Ability[0]?.points, 10)
        : 0,
      ability2_type: char.Pet?.Abilities?.Ability[1]?.type
        ? parseInt(char.Pet?.Abilities?.Ability[1]?.type, 10)
        : -1,
      ability2_power: char.Pet?.Abilities?.Ability[1]?.power
        ? parseInt(char.Pet?.Abilities?.Ability[1]?.power, 10)
        : 0,
      ability2_points: char.Pet?.Abilities?.Ability[1]?.points
        ? parseInt(char.Pet?.Abilities?.Ability[1]?.points, 10)
        : 0,
      ability3_type: char.Pet?.Abilities?.Ability[2]?.type
        ? parseInt(char.Pet?.Abilities?.Ability[2]?.type, 10)
        : -1,
      ability3_points: char.Pet?.Abilities?.Ability[2]?.power
        ? parseInt(char.Pet?.Abilities?.Ability[2]?.power, 10)
        : 0
    },
    petAbility3Points: char.Pet?.Abilities?.Ability[2]?.points
      ? parseInt(char.Pet?.Abilities?.Ability[2]?.points, 10)
      : 0,
    account_name: char.Account?.Name,
    backpack_slots: char.BackpackSlots ? parseInt(char.BackpackSlots, 10) : 0,
    has3_quickslots: char.Has3Quickslots ? parseInt(char.Has3Quickslots, 10) : 0,
    creation_date: char.CreationDate,
    pcstats: char.PCStats,
    tex1: char.Tex1 ?? null,
    tex2: char.Tex2 ?? null,
    texture: char.Texture ?? null,
    xpboosted: char.XpBoosted ? parseInt(char.XpBoosted, 10) : 0,
    xptimer: char.XpTimer ? parseInt(char.XpTimer, 10) : 0,
    lootDrop: char.LDTimer ? parseInt(char.LDTimer, 10) : 0,
    lootTier: char.LTTimer ? parseInt(char.LTTimer, 10) : 0,
    crucible: char.CrucibleActive?.toLowerCase() === 'true',
    objectType: char.ObjectType,
    stats: rawStats,
    mappedStats: mapStats(classId, rawStats)
  };
}
