import { CharListResponse } from '@/realm/models/charlist-response';
import { describe, expect, it } from 'vitest';
import { mapCharListResponse } from './char-mapping';

const encodeEnchantmentPayload = (ids: number[]): string => {
  const bytes = new Uint8Array(11);
  bytes[0] = 1; // format version

  for (let i = 0; i < Math.min(ids.length, 4); i += 1) {
    const id = ids[i] ?? 0;
    const pos = 3 + i * 2;
    bytes[pos] = id & 0xff;
    bytes[pos + 1] = (id >> 8) & 0xff;
  }

  return Buffer.from(bytes).toString('base64');
};

describe('mapCharListResponse item enchantments', () => {
  it('decodes character unique item enchantments into UI model', () => {
    const payload = encodeEnchantmentPayload([1140, 29941]);

    const response = {
      Char: {
        id: '1',
        ObjectType: '782',
        Equipment: '100',
        EquipQS: '0|1',
        UniqueItemInfo: {
          ItemData: {
            id: '0',
            type: '100',
            '#text': payload
          }
        }
      }
    } as Partial<CharListResponse>;

    const mapped = mapCharListResponse(response as CharListResponse);
    const enchantments = mapped.charList[0]?.unique_item_info?.[0]?.enchantments;

    expect(enchantments).not.toBeNull();
    expect(enchantments?.slotCount).toBe(2);
    expect(enchantments?.enchantmentIds).toEqual([1140, 29941]);
  });

  it('returns null enchantments for empty payload', () => {
    const response = {
      Char: {
        id: '2',
        ObjectType: '782',
        Equipment: '101',
        EquipQS: '0|1',
        UniqueItemInfo: {
          ItemData: {
            id: '0',
            type: '101',
            '#text': ''
          }
        }
      }
    } as Partial<CharListResponse>;

    const mapped = mapCharListResponse(response as CharListResponse);
    const enchantments = mapped.charList[0]?.unique_item_info?.[0]?.enchantments;

    expect(enchantments).toBeNull();
  });
});
