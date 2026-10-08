//! Unity serialized file parser (format v22+, no type tree).
//!
//! Rust port of `rotmg-asset-creator/src/unity-asset-parser.ts`.
//! Extracts Texture2D assets (raw RGBA32, Y-flipped to top-left origin)
//! and TextAsset payloads (game XML + the spritesheetf flatbuffer).

use memmap2::Mmap;
use std::fs::File;
use std::path::Path;

const CLASS_TEXTURE2D: i32 = 28;
const CLASS_TEXT_ASSET: i32 = 49;
const TEXTURE_FORMAT_RGBA32: i32 = 4;

pub struct ObjectInfo {
    #[allow(dead_code)]
    pub path_id: i64,
    pub byte_start: u64,
    #[allow(dead_code)]
    pub byte_size: u64,
    #[allow(dead_code)]
    pub type_idx: i32,
    pub class_id: i32,
}

pub struct UnityAsset {
    mmap: Mmap,
    pub data_offset: u64,
    pub objects: Vec<ObjectInfo>,
    #[allow(dead_code)]
    pub unity_version: String,
}

pub struct RgbaTexture {
    #[allow(dead_code)]
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub texture_format: i32,
    /// RGBA8, row 0 = top (already Y-flipped vs Unity's bottom-left origin).
    pub data: Vec<u8>,
}

pub struct TextAsset {
    #[allow(dead_code)]
    pub name: String,
    pub data: Vec<u8>,
}

fn read_u32_le(buf: &[u8], off: usize) -> Result<u32, String> {
    buf.get(off..off + 4)
        .map(|b| u32::from_le_bytes([b[0], b[1], b[2], b[3]]))
        .ok_or_else(|| format!("u32 read out of bounds at {off}"))
}

fn read_i32_le(buf: &[u8], off: usize) -> Result<i32, String> {
    buf.get(off..off + 4)
        .map(|b| i32::from_le_bytes([b[0], b[1], b[2], b[3]]))
        .ok_or_else(|| format!("i32 read out of bounds at {off}"))
}

fn read_i64_le(buf: &[u8], off: usize) -> Result<i64, String> {
    buf.get(off..off + 8).map(|b| {
        i64::from_le_bytes([b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]])
    }).ok_or_else(|| format!("i64 read out of bounds at {off}"))
}

fn read_u32_be(buf: &[u8], off: usize) -> Result<u32, String> {
    buf.get(off..off + 4)
        .map(|b| u32::from_be_bytes([b[0], b[1], b[2], b[3]]))
        .ok_or_else(|| format!("u32be read out of bounds at {off}"))
}

/// Read a Unity-style length-prefixed aligned string.
/// Returns the string value and the next aligned offset.
fn read_aligned_string(buf: &[u8], off: usize) -> Result<(String, usize), String> {
    let len = read_i32_le(buf, off)? as usize;
    if len > 10_000_000 {
        return Err(format!("Invalid string length {len} at offset {off}"));
    }
    let start = off + 4;
    let end = start + len;
    let bytes = buf
        .get(start..end)
        .ok_or_else(|| format!("string read out of bounds at {off}"))?;
    let value = String::from_utf8_lossy(bytes).into_owned();
    let pad = (4 - (end % 4)) % 4;
    Ok((value, end + pad))
}

impl UnityAsset {
    pub fn open(path: &Path) -> Result<Self, String> {
        let file =
            File::open(path).map_err(|e| format!("Failed to open {}: {e}", path.display()))?;
        let mmap = unsafe { Mmap::map(&file) }
            .map_err(|e| format!("Failed to mmap {}: {e}", path.display()))?;

        let hdr: &[u8] = mmap
            .get(0..128)
            .ok_or("File too small to be a Unity serialized file")?;

        let version = read_u32_be(hdr, 8)?;
        if version < 22 {
            return Err(format!(
                "Unsupported serialized file format version: {version}. Only version 22+ is supported."
            ));
        }

        // Header layout (as consumed by the reference implementation).
        let _endianness = hdr[16];
        let _metadata_size = read_u32_be(hdr, 20)?;
        let file_size =
            read_u32_be(hdr, 24)? as u64 * 0x1_0000_0000 + read_u32_be(hdr, 28)? as u64;
        let data_offset =
            read_u32_be(hdr, 32)? as u64 * 0x1_0000_0000 + read_u32_be(hdr, 36)? as u64;

        if file_size != mmap.len() as u64 {
            // Not fatal: some builds pad the container.
            log::warn!(
                "[assets] Header fileSize {} != actual {}",
                file_size,
                mmap.len()
            );
        }

        // Unity version string starts at byte 48 (nul-terminated).
        let mut str_off = 48;
        let mut unity_version = String::new();
        while str_off < 128 && hdr[str_off] != 0 {
            unity_version.push(hdr[str_off] as char);
            str_off += 1;
        }

        // Metadata is read from absolute offset 48 (version string first).
        let meta: &[u8] = mmap.get(48..).ok_or("Metadata offset out of bounds")?;

        let mut off = 0usize;
        while off < meta.len() && meta[off] != 0 {
            off += 1;
        }
        off += 1; // skip nul terminator

        let (types, types_end) = parse_types(meta, off)?;
        let objects = parse_objects(meta, types_end, &types)?;

        Ok(Self {
            mmap,
            data_offset,
            objects,
            unity_version,
        })
    }

    pub fn objects_of_class(&self, class_id: i32) -> impl Iterator<Item = &ObjectInfo> {
        self.objects.iter().filter(move |o| o.class_id == class_id)
    }

    fn object_data(&self, obj: &ObjectInfo) -> Result<&[u8], String> {
        let start = (self.data_offset + obj.byte_start) as usize;
        let end = start
            .checked_add(obj.byte_size as usize)
            .ok_or_else(|| "object size overflow".to_string())?;
        self.mmap
            .get(start..end)
            .ok_or_else(|| format!("object data out of bounds at {start}"))
    }

    /// Read the object's m_Name (both Texture2D and TextAsset start with it).
    pub fn read_object_name(&self, obj: &ObjectInfo) -> Result<String, String> {
        // Names are short; probe only the first 256 bytes.
        let start = (self.data_offset + obj.byte_start) as usize;
        let probe = self
            .mmap
            .get(start..start + 256)
            .ok_or("object name probe out of bounds")?;
        Ok(read_aligned_string(probe, 0)?.0)
    }

    /// Extract a Texture2D. Only RGBA32 (format 4) with embedded image data
    /// is supported; data is Y-flipped so row 0 is the top row.
    pub fn extract_texture2d(&self, obj: &ObjectInfo) -> Result<RgbaTexture, String> {
        let data = self.object_data(obj)?;
        let (name, mut off) = read_aligned_string(data, 0)?;

        let _forced_fallback_format = read_i32_le(data, off)?;
        off += 4;
        let width = read_i32_le(data, off)? as u32;
        off += 4;
        let height = read_i32_le(data, off)? as u32;
        off += 4;
        let complete_image_size = read_i32_le(data, off)? as usize;
        off += 4;
        let _mips_stripped = read_i32_le(data, off)?;
        off += 4;
        let texture_format = read_i32_le(data, off)?;
        off += 4;
        let _mip_count = read_i32_le(data, off)?;
        off += 4;

        if texture_format != TEXTURE_FORMAT_RGBA32 {
            log::warn!(
                "[assets] Texture \"{name}\" has format {texture_format}, expected RGBA32 (4). Attempting extraction anyway."
            );
        }

        // Find the image data array length by scanning for completeImageSize,
        // exactly as the reference implementation does.
        let mut data_array_off: Option<usize> = None;
        if complete_image_size > 0 {
            let scan_end = data.len().min(200);
            let mut i = off;
            while i + 4 <= scan_end {
                if read_i32_le(data, i)? as usize == complete_image_size {
                    data_array_off = Some(i);
                    break;
                }
                i += 4;
            }
        }
        let data_array_off = data_array_off
            .ok_or_else(|| format!("Could not find image data array for texture \"{name}\""))?;

        let image_start = data_array_off + 4;
        let raw = data
            .get(image_start..image_start + complete_image_size)
            .ok_or_else(|| format!("image data out of bounds for texture \"{name}\""))?;

        // Y-flip: Unity row 0 = bottom, we store row 0 = top.
        let row_size = width as usize * 4;
        if raw.len() != row_size * height as usize {
            return Err(format!(
                "Texture \"{name}\" data size mismatch: got {}, expected {}",
                raw.len(),
                row_size * height as usize
            ));
        }
        let mut flipped = vec![0u8; raw.len()];
        for y in 0..height as usize {
            let src_row = (height as usize - 1 - y) * row_size;
            let dst_row = y * row_size;
            flipped[dst_row..dst_row + row_size]
                .copy_from_slice(&raw[src_row..src_row + row_size]);
        }

        Ok(RgbaTexture {
            name,
            width,
            height,
            texture_format,
            data: flipped,
        })
    }

    /// Extract a TextAsset payload.
    pub fn extract_text_asset(&self, obj: &ObjectInfo) -> Result<TextAsset, String> {
        let data = self.object_data(obj)?;
        let (name, off) = read_aligned_string(data, 0)?;
        let script_len = read_i32_le(data, off)? as usize;
        let start = off + 4;
        let payload = data
            .get(start..start + script_len)
            .ok_or_else(|| format!("TextAsset \"{name}\" payload out of bounds"))?;
        Ok(TextAsset {
            name,
            data: payload.to_vec(),
        })
    }

    #[allow(dead_code)]
    pub fn texture2d_count(&self) -> usize {
        self.objects_of_class(CLASS_TEXTURE2D).count()
    }

    #[allow(dead_code)]
    pub fn text_asset_count(&self) -> usize {
        self.objects_of_class(CLASS_TEXT_ASSET).count()
    }
}

/// Parse type entries from the metadata section.
/// Returns (class IDs per type index, offset after the type table).
fn parse_types(meta: &[u8], start_off: usize) -> Result<(Vec<i32>, usize), String> {
    let mut off = start_off;

    // targetPlatform (int32)
    off += 4;

    // enableTypeTree (bool)
    let enable_type_tree = *meta
        .get(off)
        .ok_or("metadata truncated at enableTypeTree")?
        != 0;
    off += 1;
    if enable_type_tree {
        return Err(
            "Type tree parsing is not implemented. Only assets with enableTypeTree=false are supported."
                .to_string(),
        );
    }

    // typeCount (int32)
    let type_count = read_i32_le(meta, off)?;
    off += 4;

    let mut class_ids = Vec::with_capacity(type_count as usize);
    for _ in 0..type_count {
        let class_id = read_i32_le(meta, off)?;
        off += 4;
        off += 1; // isStripped
        off += 2; // scriptTypeIndex (int16)

        // MonoBehaviour types carry an extra scriptID hash.
        if class_id == 114 {
            off += 16;
        }

        // oldTypeHash (Hash128 = 16 bytes)
        off += 16;
        class_ids.push(class_id);
    }

    Ok((class_ids, off))
}

/// Parse the object info table from metadata.
fn parse_objects(
    meta: &[u8],
    start_off: usize,
    types: &[i32],
) -> Result<Vec<ObjectInfo>, String> {
    let mut off = start_off;

    let object_count = read_i32_le(meta, off)?;
    off += 4;

    let mut objects = Vec::with_capacity(object_count as usize);
    for _ in 0..object_count {
        // Align to 4 bytes
        if off % 4 != 0 {
            off += 4 - (off % 4);
        }

        let path_id = read_i64_le(meta, off)?;
        off += 8;
        let byte_start_lo = read_u32_le(meta, off)? as u64;
        off += 4;
        let byte_start_hi = read_u32_le(meta, off)? as u64;
        off += 4;
        let byte_size = read_u32_le(meta, off)? as u64;
        off += 4;
        let type_idx = read_i32_le(meta, off)?;
        off += 4;

        let byte_start = byte_start_hi * 0x1_0000_0000 + byte_start_lo;
        let class_id = *types
            .get(type_idx as usize)
            .ok_or_else(|| format!("typeIdx {type_idx} out of range"))?;

        objects.push(ObjectInfo {
            path_id,
            byte_start,
            byte_size,
            type_idx,
            class_id,
        });
    }

    Ok(objects)
}
