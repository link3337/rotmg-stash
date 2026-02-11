export function parseEnchantments(rawEnchantData?: string | null): Array<[number, number]> {
  /**
   * Parses enchantment data encoded in a URL-safe Base64 string.
   * Returns an array of tuples: [key, value]
   * - [ -1, 0 ] corresponds to 0xFFFE in the stream
   * - [ 0, enchantId ] corresponds to normal enchant ids
   */
  const parsed: Array<[number, number]> = [];
  if (!rawEnchantData) return parsed;

  // Normalize URL-safe base64 to standard base64
  let standardBase64 = rawEnchantData.replace(/_/g, '/').replace(/-/g, '+');

  // Pad to a multiple of 4
  const padding = standardBase64.length % 4;
  if (padding !== 0) {
    standardBase64 += '='.repeat(4 - padding);
  }

  try {
    // atob gives a binary string in browser environments
    const binaryString = atob(standardBase64);
    const len = binaryString.length;
    if (len < 3) return parsed;

    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const view = new DataView(bytes.buffer);
    let pos = 3; // skip first 3 bytes like the C# code

    while (pos + 2 <= len) {
      const enchantId = view.getUint16(pos, true); // little-endian
      pos += 2;

      if (enchantId === 0xfffd) break;
      if (enchantId === 0xfffe) {
        parsed.push([-1, 0]);
      } else {
        parsed.push([0, enchantId]);
      }
    }
  } catch (e) {
    // Keep failure silent but log debug info
    // ...existing code...
    console.debug('Failed to parse enchantment data', e);
  }

  return parsed;
}
