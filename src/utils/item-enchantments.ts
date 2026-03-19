import type { ItemEnchantmentDataUIModel } from '@api/models/char-ui-model';

const toInt16LE = (bytes: Uint8Array, offset: number): number => {
  const value = bytes[offset] | (bytes[offset + 1] << 8);
  return value > 0x7fff ? value - 0x10000 : value;
};

const toUInt16LE = (bytes: Uint8Array, offset: number): number => {
  return bytes[offset] | (bytes[offset + 1] << 8);
};

const decodeBase64 = (input: string): Uint8Array | null => {
  if (!input) return null;

  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
    const decoded = atob(padded);
    return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
};

export const decodeItemEnchantments = (encodedData: string): ItemEnchantmentDataUIModel | null => {
  const bytes = decodeBase64(encodedData);
  if (!bytes || bytes.length < 2) return null;

  const formatVersion = bytes[0];
  const enchantmentIds: number[] = [];
  const tradeoffModifiers: number[] = [];

  // Layout inferred from live payloads:
  // [0]=format, [1]=meta, [2]=flags, [3..10]=up to 4 enchant IDs (uint16 LE).
  for (let i = 0; i < 4; i += 1) {
    const pos = 3 + i * 2;
    if (pos + 1 >= bytes.length) break;
    enchantmentIds.push(toUInt16LE(bytes, pos));
  }

  // Remaining bytes (if any) are optional tradeoff modifiers.
  const tradeoffStart = 11;
  for (let i = 0; i < 3; i += 1) {
    const pos = tradeoffStart + i * 2;
    if (pos + 1 >= bytes.length) break;
    tradeoffModifiers.push(toInt16LE(bytes, pos));
  }

  // Some payloads use special marker IDs for empty/invalid enchant slots.
  const validEnchantmentIds = enchantmentIds.filter(
    (id) => id !== 0 && id !== 0xffff && id !== 0xfffe && id !== 0xfd00 && id !== 0xfffd
  );
  const slotCount = validEnchantmentIds.length;

  return {
    formatVersion,
    slotCount,
    enchantmentIds: validEnchantmentIds,
    tradeoffModifiers
  };
};
