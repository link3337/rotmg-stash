//! Port of `rotmg-asset-creator/src/renderer.ts` (Muledump renderer).
//!
//! Consumes extracted game XML (root `Objects` / `Enchantments`) plus the
//! recompiled sprite sheets and produces the three artifacts the frontend
//! expects: `constants.json`, `renders.png` and `sheets.json`.
//!
//! Semantics mirror `fast-xml-parser` + node-canvas behavior of the reference
//! tool as closely as practical; intentional divergences are documented
//! inline (individual `items/*.png` and `sheets.js` outputs are skipped).

use crate::assets::sheet::{Canvas, SheetEntry};
use crate::assets::xml::{root_element, Element};
use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use image::ImageEncoder;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::sync::Arc;

const GRID: usize = 100;
const MAX_ROWS: usize = 200;
const CELL: i32 = 45;
const ERROR_PNG: &[u8] = include_bytes!("error.png");

/// Sheets whose sprite indices are not laid out on a plain `width/tile` grid
/// (`normalIndex` in the reference renderer).
const SPECIAL_STRIDE_SHEETS: &[&str] = &[
    "players",
    "playerskins",
    "oryxSanctuaryChars32x32",
    "chars8x8dEncounters",
    "chars8x8rPets1",
    "chars16x16dEncounters2",
    "characters",
    "petsDivine",
    "epicHiveChars16x16",
    "playerskins16",
    "playerskins32",
];

const PLAYER_STAT_NAMES: [&str; 8] = [
    "MaxHitPoints",
    "MaxMagicPoints",
    "Attack",
    "Defense",
    "Speed",
    "Dexterity",
    "HpRegen",
    "MpRegen",
];

// ── JS semantics helpers ────────────────────────────────────────────

/// fast-xml-parser's number detection regex (applied to trimmed text):
/// `^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$`
fn is_fxp_number(s: &str) -> bool {
    let b = s.as_bytes();
    let mut i = 0;
    if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
        i += 1;
    }
    let int_start = i;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
    }
    let int_digits = i - int_start;
    if i < b.len() && b[i] == b'.' {
        i += 1;
        let frac_start = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if int_digits == 0 && i == frac_start {
            return false;
        }
    } else if int_digits == 0 {
        return false;
    }
    if i < b.len() && (b[i] == b'e' || b[i] == b'E') {
        i += 1;
        if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
            i += 1;
        }
        let exp_start = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if i == exp_start {
            return false;
        }
    }
    i == b.len()
}

/// JS `String(Number(s))` for the small integer/decimal values that occur in
/// game data (integers print without a decimal point, like in JS).
fn js_number_to_string(n: f64) -> String {
    if n == 0.0 {
        return "0".to_string();
    }
    if n.fract() == 0.0 && n.abs() < 1e21 {
        format!("{}", n as i64)
    } else {
        format!("{}", n)
    }
}

/// JS `parseInt(s, 10)` (no radix detection, lenient prefix digits).
fn parse_int_base10(s: &str) -> f64 {
    let b = s.as_bytes();
    let mut i = 0;
    while i < b.len() && b[i].is_ascii_whitespace() {
        i += 1;
    }
    let mut neg = false;
    if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
        neg = b[i] == b'-';
        i += 1;
    }
    let start = i;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
    }
    if i == start {
        return f64::NAN;
    }
    let v: f64 = s[start..i].parse().unwrap_or(f64::NAN);
    if neg {
        -v
    } else {
        v
    }
}

/// JS `parseInt(text, 10)` where `text` came from fast-xml-parser output
/// (numeric-looking text was already normalized to a number and back).
fn js_parse_int(s: &str) -> f64 {
    let t = s.trim();
    if is_fxp_number(t) {
        let n: f64 = match t.parse() {
            Ok(n) => n,
            Err(_) => return f64::NAN,
        };
        let norm = js_number_to_string(n);
        parse_int_base10(&norm)
    } else {
        parse_int_base10(t)
    }
}

/// Renderer helper `parseHexOrDec`: hex only for `0x`-prefixed values.
fn js_hex_or_dec(s: &str) -> f64 {
    let t = s.trim();
    if t.starts_with("0x") || t.starts_with("0X") {
        let digits = &t[2..];
        let mut end = 0;
        for (i, c) in digits.char_indices() {
            if c.is_ascii_hexdigit() {
                end = i + c.len_utf8();
            } else {
                break;
            }
        }
        if end == 0 {
            return f64::NAN;
        }
        let mut acc: f64 = 0.0;
        for byte in digits[..end].bytes() {
            let d = (byte as char).to_digit(16).unwrap_or(0) as f64;
            acc = acc * 16.0 + d;
        }
        return acc;
    }
    parse_int_base10(t)
}

fn js_to_u32(n: f64) -> u32 {
    if !n.is_finite() {
        return 0;
    }
    (n as i64).rem_euclid(0x1_0000_0000u64 as i64) as u32
}

fn finite_i64(n: f64) -> Option<i64> {
    if n.is_finite() {
        Some(n as i64)
    } else {
        None
    }
}

fn argb_split(x: u32) -> (u8, u8, u8, u8) {
    (
        ((x >> 24) & 0xFF) as u8,
        ((x >> 16) & 0xFF) as u8,
        ((x >> 8) & 0xFF) as u8,
        (x & 0xFF) as u8,
    )
}

fn is_word_byte(c: u8) -> bool {
    c.is_ascii_alphanumeric() || c == b'_'
}

/// JS `/\bSHINY\b/i.test(s)`
fn has_shiny_word(s: &str) -> bool {
    let b = s.as_bytes();
    if b.len() < 5 {
        return false;
    }
    for i in 0..=b.len() - 5 {
        if !b[i..i + 5].eq_ignore_ascii_case(b"SHINY") {
            continue;
        }
        let before_ok = i == 0 || !is_word_byte(b[i - 1]);
        let after_ok = i + 5 == b.len() || !is_word_byte(b[i + 5]);
        if before_ok && after_ok {
            return true;
        }
    }
    false
}

/// JS `/shiny/i.test(s)`
fn has_shiny_substr(s: &str) -> bool {
    s.as_bytes()
        .windows(5)
        .any(|w| w.eq_ignore_ascii_case(b"shiny"))
}

/// Emulates `JSON.stringify(obj).includes(needle)` for an XML element tree:
/// JSON contains attribute names/values, child names, and text values; key
/// separators are always `"`/`:`/`,`/`{`/`}` so no match can span them.
fn stringify_contains(el: &Element, needle: &str) -> bool {
    if el
        .attrs
        .iter()
        .any(|(k, v)| k.contains(needle) || v.contains(needle))
    {
        return true;
    }
    if el.text.as_deref().is_some_and(|t| t.contains(needle)) {
        return true;
    }
    el.children
        .iter()
        .any(|c| c.name.contains(needle) || stringify_contains(c, needle))
}

/// `obj.<name> != null ? (getTextContent(...) ?? '').replace(/\n/g,'').trim() || null : null`
fn text_or_null(el: &Element, name: &str) -> Option<String> {
    let child = el.child(name)?;
    let t = child.text().unwrap_or("");
    let s = t.replace('\n', "");
    let s = s.trim();
    if s.is_empty() {
        None
    } else {
        Some(s.to_string())
    }
}

fn child_number(el: &Element, name: &str) -> f64 {
    el.child(name)
        .and_then(|e| e.text())
        .map_or(f64::NAN, js_parse_int)
}

// ── icon pipeline (shared by items and enchantments) ────────────────

fn icon_alpha(icon: &Canvas) -> Vec<u8> {
    (0..icon.w * icon.h).map(|i| icon.data[i * 4 + 3]).collect()
}

/// Max filter radius 1 (3×3) over a 40×40 alpha channel.
fn dilate_3x3(alpha: &[u8]) -> Vec<u8> {
    let mut out = vec![0u8; 1600];
    for py in 0..40usize {
        for px in 0..40usize {
            let mut max_val = 0u8;
            for ky in -1i32..=1 {
                for kx in -1i32..=1 {
                    let ny = py as i32 + ky;
                    let nx = px as i32 + kx;
                    if ny >= 0 && ny < 40 && nx >= 0 && nx < 40 {
                        max_val = max_val.max(alpha[ny as usize * 40 + nx as usize]);
                    }
                }
            }
            out[py * 40 + px] = max_val;
        }
    }
    out
}

/// Box blur radius 7 (15×15) approximating the reference shadow.
fn box_blur_r7(alpha: &[u8]) -> Vec<u8> {
    let mut out = vec![0u8; 1600];
    for py in 0..40i32 {
        for px in 0..40i32 {
            let mut sum = 0u32;
            let mut count = 0u32;
            for ky in -7i32..=7 {
                for kx in -7i32..=7 {
                    let ny = py + ky;
                    let nx = px + kx;
                    if ny >= 0 && ny < 40 && nx >= 0 && nx < 40 {
                        sum += alpha[ny as usize * 40 + nx as usize] as u32;
                        count += 1;
                    }
                }
            }
            out[py as usize * 40 + px as usize] = (sum / count / 2) as u8;
        }
    }
    out
}

fn black_with(alpha: &[u8]) -> Canvas {
    let mut c = Canvas::new(40, 40);
    for (i, a) in alpha.iter().enumerate() {
        c.data[i * 4 + 3] = *a;
    }
    c
}

/// `src` crop → 40×40 icon canvas with 4px border, then shadow layers.
struct IconLayers {
    icon: Canvas,
    dilated: Vec<u8>,
    blurred: Vec<u8>,
}

fn build_icon(src: &Canvas, sx: f32, sy: f32, sw: f32, sh: f32) -> IconLayers {
    let mut icon = Canvas::new(40, 40);
    icon.draw_image(src, sx, sy, sw, sh, 4, 4, 32, 32);
    let dilated = dilate_3x3(&icon_alpha(&icon));
    let blurred = box_blur_r7(&dilated);
    IconLayers {
        icon,
        dilated,
        blurred,
    }
}

fn apply_icon_shadow(dst: &mut Canvas, layers: &IconLayers, dx: i32, dy: i32) {
    let shadow = black_with(&layers.blurred);
    let edge = black_with(&layers.dilated);
    dst.draw_image(&shadow, 0.0, 0.0, 40.0, 40.0, dx, dy, 40, 40);
    dst.draw_image(&edge, 0.0, 0.0, 40.0, 40.0, dx, dy, 40, 40);
}

// ── quantity digits (embedded 5×7 glyphs; no font file) ─────────────

const DIGIT_GLYPHS: [[u8; 7]; 10] = [
    [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
    [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
    [0b01110, 0b10001, 0b00001, 0b00110, 0b00001, 0b10001, 0b01110],
    [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
    [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
    [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
    [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
    [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
    [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
];

/// Quantity overlay: black 8-direction outline + white digits, baseline y=13.
fn draw_quantity(dst: &mut Canvas, text: &str) {
    const OUTLINE: [(i32, i32); 8] = [
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    ];
    let mut pen = 3i32;
    for ch in text.chars() {
        if let Some(glyph) = ch.to_digit(10).map(|d| &DIGIT_GLYPHS[d as usize]) {
            for (row, bits) in glyph.iter().enumerate() {
                for col in 0..5usize {
                    if bits & (1 << (4 - col)) == 0 {
                        continue;
                    }
                    let px = pen + col as i32;
                    let py = 6 + row as i32;
                    for (ox, oy) in OUTLINE {
                        dst.fill_rect(px + ox, py + oy, 1, 1, [0, 0, 0, 255]);
                    }
                    dst.fill_rect(px, py, 1, 1, [255, 255, 255, 255]);
                }
            }
        }
        pen += 6;
    }
}

// ── outputs ─────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RenderStats {
    pub items: usize,
    pub classes: usize,
    pub skins: usize,
    pub enchantments: usize,
    pub files_processed: usize,
    pub files_skipped: usize,
}

pub struct RenderOutput {
    pub constants_json: Vec<u8>,
    pub renders_png: Vec<u8>,
    pub sheets_json: Vec<u8>,
    pub stats: RenderStats,
}

#[derive(Serialize)]
struct ItemData {
    name: String,
    #[serde(rename = "technicalName")]
    technical_name: String,
    #[serde(rename = "slotType")]
    slot_type: Option<i64>,
    tier: Option<i64>,
    x: i32,
    y: i32,
    #[serde(rename = "fameBonus")]
    fame_bonus: Option<i64>,
    #[serde(rename = "feedPower")]
    feed_power: Option<i64>,
    #[serde(rename = "bagType")]
    bag_type: Option<i64>,
    #[serde(rename = "isSoulbound")]
    is_soulbound: bool,
    utst: i64,
    #[serde(rename = "isShiny")]
    is_shiny: bool,
}

#[derive(Serialize)]
struct ClassData {
    name: String,
    base: Vec<Option<i64>>,
    averages: Vec<Option<f64>>,
    maxes: Vec<Option<i64>>,
    slots: Vec<Option<i64>>,
}

#[derive(Serialize)]
struct SkinData {
    name: String,
    index: Option<i64>,
    #[serde(rename = "is16x16")]
    is16x16: bool,
    sheet: Option<String>,
    #[serde(rename = "classType")]
    class_type: Option<i64>,
}

#[derive(Serialize)]
struct TextureData {
    #[serde(rename = "clothingId")]
    clothing_id: Option<String>,
    #[serde(rename = "clothingType")]
    clothing_type: Option<i64>,
    #[serde(rename = "accessoryId")]
    accessory_id: Option<String>,
    #[serde(rename = "accessoryType")]
    accessory_type: Option<i64>,
}

#[derive(Serialize)]
struct PetData {
    name: String,
    family: Option<String>,
    rarity: Option<String>,
    #[serde(rename = "defaultSkin")]
    default_skin: Option<String>,
    size: Option<i64>,
}

#[derive(Serialize)]
struct PetSkinData {
    name: String,
    #[serde(rename = "displayId")]
    display_id: Option<String>,
    #[serde(rename = "itemTier")]
    item_tier: Option<i64>,
    family: Option<String>,
    rarity: Option<String>,
    #[serde(rename = "animIndex")]
    anim_index: Option<i64>,
    #[serde(rename = "is16x16")]
    is16x16: bool,
    sheet: Option<String>,
}

#[derive(Serialize)]
struct EnchData {
    #[serde(rename = "displayId")]
    display_id: String,
    description: String,
    x: i32,
    y: i32,
}

#[derive(Serialize)]
struct ConstantsJson {
    items: BTreeMap<String, ItemData>,
    classes: BTreeMap<String, ClassData>,
    skins: BTreeMap<String, SkinData>,
    #[serde(rename = "petAbilities")]
    pet_abilities: BTreeMap<String, String>,
    textures: BTreeMap<String, TextureData>,
    pets: BTreeMap<String, PetData>,
    #[serde(rename = "petSkins")]
    pet_skins: BTreeMap<String, PetSkinData>,
    enchantments: BTreeMap<String, EnchData>,
}

#[derive(Serialize)]
struct SheetsJson {
    textiles: BTreeMap<String, String>,
    skinsheets: BTreeMap<String, String>,
    petskinsheets: BTreeMap<String, String>,
    renders: &'static str,
}

fn keyed<T>(m: BTreeMap<i64, T>) -> BTreeMap<String, T> {
    m.into_iter().map(|(k, v)| (k.to_string(), v)).collect()
}

fn encode_png(canvas: &Canvas) -> Result<Vec<u8>, String> {
    let mut out = Vec::new();
    image::codecs::png::PngEncoder::new(&mut out)
        .write_image(
            &canvas.data,
            canvas.w as u32,
            canvas.h as u32,
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("PNG encode failed: {e}"))?;
    Ok(out)
}

// ── renderer context ────────────────────────────────────────────────

struct Ctx {
    sheets: HashMap<String, Arc<SheetEntry>>,
    render: Canvas,
    imgx: usize,
    imgy: usize,
    items: BTreeMap<i64, ItemData>,
    classes: BTreeMap<i64, ClassData>,
    skins: BTreeMap<i64, SkinData>,
    pet_abilities: BTreeMap<i64, String>,
    textures: BTreeMap<i64, TextureData>,
    pets: BTreeMap<i64, PetData>,
    pet_skins: BTreeMap<i64, PetSkinData>,
    enchantments: BTreeMap<i64, EnchData>,
    skin_files: BTreeSet<String>,
    textile_files: BTreeSet<u32>,
    pet_skin_files: BTreeSet<String>,
    invalid_tex: HashMap<String, (i32, i32)>,
    ps32_bounds: HashMap<u32, (u32, u32)>,
    ps_bounds: HashMap<u32, (u32, u32)>,
    ps16_bounds: HashMap<u32, (u32, u32)>,
    players_bounds: HashMap<u32, (u32, u32)>,
}

/// Pre-scan alpha bounds per slot row (`ps32BoundsMap` and friends).
fn scan_bounds(entry: Option<&Arc<SheetEntry>>, slot_h: usize) -> HashMap<u32, (u32, u32)> {
    let mut map = HashMap::new();
    let Some(entry) = entry else {
        return map;
    };
    let img = &entry.image;
    if slot_h == 0 {
        return map;
    }
    let slots = img.h / slot_h;
    for idx in 0..slots {
        let row_off = idx * slot_h;
        let (mut max_w, mut max_h) = (0u32, 0u32);
        for row in 0..slot_h {
            for col in 0..img.w {
                if img.pixel(col, row_off + row)[3] > 0 {
                    max_w = max_w.max(col as u32 + 1);
                    max_h = max_h.max(row as u32 + 1);
                }
            }
        }
        if max_w > 0 {
            map.insert(idx as u32, (max_w, max_h));
        }
    }
    map
}

impl Ctx {
    fn new(sheets: HashMap<String, Arc<SheetEntry>>) -> Self {
        let mut items = BTreeMap::new();
        items.insert(
            -1,
            ItemData {
                name: "Empty Slot".into(),
                technical_name: "Empty Slot".into(),
                slot_type: Some(0),
                tier: Some(-1),
                x: 5,
                y: 5,
                fame_bonus: Some(0),
                feed_power: Some(0),
                bag_type: Some(0),
                is_soulbound: false,
                utst: 0,
                is_shiny: false,
            },
        );
        items.insert(
            0,
            ItemData {
                name: "Unknown Item".into(),
                technical_name: "Unknown Item".into(),
                slot_type: Some(0),
                tier: Some(-1),
                x: 50,
                y: 5,
                fame_bonus: Some(0),
                feed_power: Some(0),
                bag_type: Some(0),
                is_soulbound: false,
                utst: 0,
                is_shiny: false,
            },
        );
        Self {
            sheets,
            render: Canvas::new(CELL as usize * GRID + 5, CELL as usize * MAX_ROWS + 5),
            imgx: 2, // skip Empty and Unknown slots
            imgy: 0,
            items,
            classes: BTreeMap::new(),
            skins: BTreeMap::new(),
            pet_abilities: BTreeMap::new(),
            textures: BTreeMap::new(),
            pets: BTreeMap::new(),
            pet_skins: BTreeMap::new(),
            enchantments: BTreeMap::new(),
            skin_files: BTreeSet::from(["players".to_string()]),
            textile_files: BTreeSet::new(),
            pet_skin_files: BTreeSet::new(),
            invalid_tex: HashMap::new(),
            ps32_bounds: HashMap::new(),
            ps_bounds: HashMap::new(),
            ps16_bounds: HashMap::new(),
            players_bounds: HashMap::new(),
        }
    }

    fn cell_pos(&self) -> (i32, i32) {
        (
            self.imgx as i32 * CELL + 5,
            self.imgy as i32 * CELL + 5,
        )
    }

    fn advance(&mut self) {
        self.imgx += 1;
        if self.imgx >= GRID {
            self.imgx = 0;
            self.imgy += 1;
        }
    }

    fn invalid_cache_key(mask: &Element, is_tex1: bool) -> String {
        let mf = mask.child("File").and_then(|e| e.text()).unwrap_or("");
        let mi_f =
            js_hex_or_dec(mask.child("Index").and_then(|e| e.text()).unwrap_or("0"));
        let mi = if mi_f.is_finite() {
            format!("{}", mi_f as i64)
        } else {
            "NaN".to_string()
        };
        format!("{mf}:{mi}:{}", if is_tex1 { "tex1" } else { "tex2" })
    }

    fn process_objects(&mut self, root: &Element) {
        for obj in root.children_named("Object") {
            // if (!obj.Class) continue;
            let Some(class_el) = obj.child("Class") else {
                continue;
            };
            if !class_el.is_truthy() {
                continue;
            }
            let clazz = class_el.text().unwrap_or("").to_string();
            let obj_type = obj.attr("type").unwrap_or("");
            let obj_id = obj.attr("id").unwrap_or("").to_string();

            // The reference keys every map by `parseHexOrDec(type)`; a missing
            // or invalid type would produce a `"NaN"` key in JS. Game data
            // always has a valid type, so skip the object entirely instead.
            let type_f = js_hex_or_dec(obj_type);
            if !type_f.is_finite() {
                log::warn!(
                    "[assets] skipping object {:?}: unparsable type {:?}",
                    obj_id,
                    obj_type
                );
                continue;
            }
            let key = type_f as i64;

            // ── Player ──────────────────────────────────────────────
            if clazz == "Player" {
                let base_f: [f64; 8] =
                    PLAYER_STAT_NAMES.map(|n| child_number(obj, n));

                let mut avgs_map: HashMap<&str, f64> = HashMap::new();
                for li in obj.children_named("LevelIncrease") {
                    let stat = li.text().unwrap_or("undefined");
                    let min = li.attr("min").map_or(f64::NAN, js_parse_int);
                    let max = li.attr("max").map_or(f64::NAN, js_parse_int);
                    avgs_map.insert(stat, (min + max) / 2.0 * 19.0);
                }
                let averages: Vec<Option<f64>> = PLAYER_STAT_NAMES
                    .iter()
                    .enumerate()
                    .map(|(i, n)| {
                        let v = avgs_map.get(n).copied().unwrap_or(0.0) + base_f[i];
                        if v.is_finite() {
                            Some(v)
                        } else {
                            None
                        }
                    })
                    .collect();

                let maxes: Vec<Option<i64>> = PLAYER_STAT_NAMES
                    .iter()
                    .map(|n| {
                        finite_i64(js_parse_int(
                            obj.child(n)
                                .and_then(|e| e.attr("max"))
                                .unwrap_or("undefined"),
                        ))
                    })
                    .collect();

                let base: Vec<Option<i64>> = base_f.iter().map(|v| finite_i64(*v)).collect();

                // Reference crashes if SlotTypes is absent; stay resilient.
                let slots: Vec<Option<i64>> = match obj.child("SlotTypes").and_then(|e| e.text())
                {
                    Some(text) => text
                        .split(',')
                        .take(4)
                        .map(|s| finite_i64(js_parse_int(s)))
                        .collect(),
                    None => {
                        log::warn!(
                            "[assets] Player {:?} missing SlotTypes",
                            obj_id
                        );
                        vec![None, None, None, None]
                    }
                };

                self.classes.insert(
                    key,
                    ClassData {
                        name: obj_id.clone(),
                        base,
                        averages,
                        maxes,
                        slots,
                    },
                );

                match obj.child("AnimatedTexture") {
                    Some(anim) => {
                        let index = js_hex_or_dec(
                            anim.child("Index")
                                .and_then(|e| e.text())
                                .unwrap_or("undefined"),
                        );
                        let file = anim
                            .child("File")
                            .and_then(|e| e.text())
                            .map(|s| s.to_string());
                        self.skins.insert(
                            key,
                            SkinData {
                                name: obj_id.clone(),
                                index: finite_i64(index),
                                is16x16: false,
                                sheet: file,
                                class_type: Some(key),
                            },
                        );
                    }
                    None => {
                        log::warn!("[assets] Player {:?} missing AnimatedTexture", obj_id);
                    }
                }
            }

            // ── Skin ────────────────────────────────────────────────
            if clazz == "Skin" || obj.has_child("Skin") {
                let pct_el = obj.child("PlayerClassType");
                let anim_el = obj.child("AnimatedTexture");
                let pct_ok = pct_el.is_some_and(|e| e.is_truthy());
                let anim_ok = anim_el.is_some_and(|e| e.is_truthy());
                if !pct_ok || !anim_ok {
                    continue;
                }
                let pct_str = pct_el
                    .and_then(|e| e.text())
                    .unwrap_or("undefined")
                    .to_string();
                let anim = anim_el.expect("checked above");
                let index = js_hex_or_dec(
                    anim.child("Index")
                        .and_then(|e| e.text())
                        .unwrap_or("undefined"),
                );
                let file = anim
                    .child("File")
                    .and_then(|e| e.text())
                    .map(|s| s.to_string());
                let is16 = file.as_deref().is_some_and(|f| f.contains("16"));
                self.skins.insert(
                    key,
                    SkinData {
                        name: obj_id.clone(),
                        index: finite_i64(index),
                        is16x16: is16,
                        sheet: file.clone(),
                        class_type: finite_i64(js_hex_or_dec(&pct_str)),
                    },
                );
                if let Some(f) = file {
                    self.skin_files.insert(f);
                }
            }

            // ── PetAbility ──────────────────────────────────────────
            if clazz == "PetAbility" || obj.has_child("PetAbility") {
                self.pet_abilities.insert(key, obj_id.clone());
            }

            // ── Dye (textures table) ────────────────────────────────
            if clazz == "Dye" {
                let (tex_raw, offs): (Option<&str>, usize) =
                    if let Some(t1) = obj.child("Tex1") {
                        (t1.text(), 0)
                    } else if let Some(t2) = obj.child("Tex2") {
                        (t2.text(), 2)
                    } else {
                        continue;
                    };
                let tex_key = tex_raw.map_or(f64::NAN, js_hex_or_dec);
                if tex_key.is_finite() {
                    let entry = self.textures.entry(tex_key as i64).or_insert(TextureData {
                        clothing_id: None,
                        clothing_type: None,
                        accessory_id: None,
                        accessory_type: None,
                    });
                    if offs == 0 {
                        entry.clothing_id = Some(obj_id.clone());
                        entry.clothing_type = finite_i64(type_f);
                    } else {
                        entry.accessory_id = Some(obj_id.clone());
                        entry.accessory_type = finite_i64(type_f);
                    }
                }
            }

            // ── Equipment / Dye / Emote (item render) ───────────────
            if clazz == "Equipment" || clazz == "Dye" || clazz == "Emote" {
                let bag_type = obj.child("BagType").map_or(Some(0), |e| {
                    finite_i64(js_parse_int(e.text().unwrap_or("undefined")))
                });
                let display_name = if let Some(did) = obj.child("DisplayId").filter(|_| clazz != "Dye")
                {
                    match did.text() {
                        Some(t) => t.to_string(),
                        None => obj_id.clone(),
                    }
                } else {
                    obj_id.clone()
                };
                let tier = obj.child("Tier").map_or(Some(-1), |e| {
                    finite_i64(js_parse_int(e.text().unwrap_or("undefined")))
                });
                let xp = obj.child("XPBonus").map_or(Some(0), |e| {
                    finite_i64(js_parse_int(e.text().unwrap_or("undefined")))
                });
                let fp = obj.child("feedPower").map_or(Some(0), |e| {
                    finite_i64(js_parse_int(e.text().unwrap_or("undefined")))
                });
                let slot_type = obj.child("SlotType").map_or(Some(0), |e| {
                    finite_i64(js_parse_int(e.text().unwrap_or("undefined")))
                });
                let soulbound = obj.has_child("Soulbound");

                let mut utst = 0i64;
                if stringify_contains(obj, "setName") {
                    utst = 2;
                } else if slot_type.is_some_and(|s| (1..=9).contains(&s) || (11..=25).contains(&s))
                    && soulbound
                    && tier == Some(-1)
                {
                    utst = 1;
                }

                let labels = obj
                    .child("Labels")
                    .and_then(|e| e.text())
                    .unwrap_or("")
                    .to_string();
                let shiny = has_shiny_word(&labels) || has_shiny_substr(&obj_id);

                let item_data = |x: i32, y: i32| ItemData {
                    name: display_name.clone(),
                    technical_name: if shiny {
                        format!("{display_name} Shiny")
                    } else {
                        display_name.clone()
                    },
                    slot_type,
                    tier,
                    x,
                    y,
                    fame_bonus: xp,
                    feed_power: fp,
                    bag_type,
                    is_soulbound: soulbound,
                    utst,
                    is_shiny: shiny,
                };

                // Dedup identical invalid-textile mask renders.
                if let Some(mask) = obj.child("Mask").filter(|e| e.is_truthy()) {
                    if obj.child("Tex1").is_some() || obj.child("Tex2").is_some() {
                        let raw = if let Some(t1) = obj.child("Tex1") {
                            t1.text()
                        } else {
                            obj.child("Tex2").and_then(|t| t.text())
                        };
                        if let Some(raw) = raw.filter(|s| !s.is_empty()) {
                            let (ta, tr, tg, _) = argb_split(js_to_u32(js_hex_or_dec(raw)));
                            if ta != 1 && (tr > 0 || tg > 0) {
                                let ck =
                                    Self::invalid_cache_key(mask, obj.child("Tex1").is_some());
                                if let Some((cx, cy)) = self.invalid_tex.get(&ck) {
                                    let (cx, cy) = (*cx, *cy);
                                    self.items.insert(key, item_data(cx, cy));
                                    continue;
                                }
                            }
                        }
                    }
                }

                // Determine image source
                let (image_name, image_index) = if let Some(tex) =
                    obj.child("Texture").filter(|e| e.is_truthy())
                {
                    (
                        tex.child("File").and_then(|e| e.text()).map(|s| s.to_string()),
                        js_hex_or_dec(
                            tex.child("Index")
                                .and_then(|e| e.text())
                                .unwrap_or("undefined"),
                        ),
                    )
                } else if let Some(tex) =
                    obj.child("AnimatedTexture").filter(|e| e.is_truthy())
                {
                    (
                        tex.child("File").and_then(|e| e.text()).map(|s| s.to_string()),
                        js_hex_or_dec(
                            tex.child("Index")
                                .and_then(|e| e.text())
                                .unwrap_or("undefined"),
                        ),
                    )
                } else {
                    continue;
                };
                let Some(image_name) = image_name else {
                    log::warn!(
                        "  Warning: could not load sheet <missing>, skipping {}",
                        display_name
                    );
                    continue;
                };
                let Some(sheet_entry) = self.sheets.get(&image_name).cloned() else {
                    log::warn!(
                        "  Warning: could not load sheet {}, skipping {}",
                        image_name,
                        display_name
                    );
                    continue;
                };
                let img = &sheet_entry.image;

                let mut img_tile_size = 8u32;
                if image_name == "playerskins32" {
                    img_tile_size = 32;
                } else if image_name.contains("16") || image_name == "petsDivine" {
                    img_tile_size = 16;
                }
                if clazz == "Emote" {
                    img_tile_size = 16;
                }

                let normal_index = !SPECIAL_STRIDE_SHEETS.contains(&image_name.as_str());
                let idx_f = image_index;
                let (src_x, src_y) = if normal_index {
                    let cols = img.w as f64 / img_tile_size as f64;
                    (
                        img_tile_size as f64 * (idx_f % cols),
                        img_tile_size as f64 * (idx_f / cols).floor(),
                    )
                } else if image_name == "characters" {
                    (0.0, 3.0 * img_tile_size as f64 * idx_f)
                } else {
                    (0.0, img_tile_size as f64 * idx_f)
                };

                let bounds = if idx_f.is_finite() {
                    let idx = idx_f as u32;
                    match image_name.as_str() {
                        "playerskins32" => self.ps32_bounds.get(&idx).copied(),
                        "playerskins" => self.ps_bounds.get(&idx).copied(),
                        "playerskins16" => self.ps16_bounds.get(&idx).copied(),
                        "players" => self.players_bounds.get(&idx).copied(),
                        _ => None,
                    }
                } else {
                    None
                };
                let (src_w, src_h) = match bounds {
                    Some((w, h)) => (w as f64, h as f64),
                    None => (img_tile_size as f64, img_tile_size as f64),
                };

                let (dx, dy) = self.cell_pos();
                let mut item_render = Canvas::new(40, 40);
                let layers = build_icon(img, src_x as f32, src_y as f32, src_w as f32, src_h as f32);
                apply_icon_shadow(&mut item_render, &layers, 0, 0);
                item_render.draw_image(
                    &layers.icon,
                    1.0,
                    1.0,
                    38.0,
                    38.0,
                    1,
                    1,
                    38,
                    38,
                );

                let mut invalid_key_to_store: Option<(String, i32, i32)> = None;

                // ── Mask handling ───────────────────────────────────
                if let Some(mask) = obj.child("Mask").filter(|e| e.is_truthy()) {
                    let mask_name = mask.child("File").and_then(|e| e.text());
                    let mask_index = js_hex_or_dec(
                        mask.child("Index")
                            .and_then(|e| e.text())
                            .unwrap_or("0"),
                    );
                    let mask_entry = mask_name.and_then(|n| self.sheets.get(n)).cloned();
                    let mask_img: &Canvas = match &mask_entry {
                        Some(e) => &e.image,
                        None => img, // reference falls back to the item sheet
                    };

                    let msrcw = mask_img.w as f64 / img_tile_size as f64;
                    let msrcx = img_tile_size as f64 * (mask_index % msrcw);
                    let msrcy = img_tile_size as f64 * (mask_index / msrcw).floor();
                    let mut mask_canvas = Canvas::new(40, 40);
                    mask_canvas.draw_image(
                        mask_img,
                        msrcx as f32,
                        msrcy as f32,
                        img_tile_size as f32,
                        img_tile_size as f32,
                        4,
                        4,
                        32,
                        32,
                    );

                    // isTex1 = large clothes (Tex1), else small clothes (Tex2)
                    let (tex_str, is_tex1) = if let Some(t1) = obj.child("Tex1") {
                        (t1.text(), true)
                    } else if let Some(t2) = obj.child("Tex2") {
                        (t2.text(), false)
                    } else {
                        (None, false)
                    };

                    if let Some(tex_str) = tex_str.filter(|s| !s.is_empty()) {
                        let tex_val = js_hex_or_dec(tex_str);
                        let (a, r, g, b) = argb_split(js_to_u32(tex_val));

                        let fill: Option<Canvas> = if a == 1 {
                            let mut c = Canvas::new(40, 40);
                            c.fill_rect(0, 0, 40, 40, [r, g, b, 255]);
                            Some(c)
                        } else if r > 0 || g > 0 {
                            let mut c = Canvas::new(40, 40);
                            let rgb: [u8; 3] = if is_tex1 { [255, 0, 0] } else { [8, 226, 0] };
                            c.fill_rect(0, 0, 40, 40, [rgb[0], rgb[1], rgb[2], 255]);
                            Some(c)
                        } else {
                            self.textile_files.insert(a as u32);
                            let textile_name = format!("textile{a}x{a}");
                            match self.sheets.get(&textile_name).cloned() {
                                Some(tex_entry) => {
                                    let tex_img = &tex_entry.image;
                                    let tsrcw = tex_img.w as f64 / a as f64;
                                    let tsrcx = a as f64 * (b as f64 % tsrcw);
                                    let tsrcy = a as f64 * (b as f64 / tsrcw).floor();
                                    let mut tile = Canvas::new(a as usize, a as usize);
                                    tile.draw_image(
                                        tex_img,
                                        tsrcx as f32,
                                        tsrcy as f32,
                                        a as f32,
                                        a as f32,
                                        0,
                                        0,
                                        a as i32,
                                        a as i32,
                                    );
                                    let mut fill_c = Canvas::new(40, 40);
                                    for ty in (0..40).step_by((a as usize).max(1)) {
                                        for tx in (0..40).step_by((a as usize).max(1)) {
                                            fill_c.draw_image(
                                                &tile,
                                                0.0,
                                                0.0,
                                                a as f32,
                                                a as f32,
                                                tx as i32,
                                                ty as i32,
                                                a as i32,
                                                a as i32,
                                            );
                                        }
                                    }
                                    Some(fill_c)
                                }
                                None => {
                                    log::warn!("  Could not load {textile_name}");
                                    continue; // item skipped entirely
                                }
                            }
                        };
                        let Some(fill) = fill else { continue };

                        // Black underlay through the mask.
                        let mut temp = Canvas::new(40, 40);
                        temp.draw_over(&mask_canvas);
                        temp.source_in_fill([0, 0, 0]);
                        item_render.draw_over(&temp);

                        // Color/textile through the mask.
                        let mut fill_masked = Canvas::new(40, 40);
                        fill_masked.draw_over(&mask_canvas);
                        fill_masked.source_in(&fill);
                        item_render.draw_over(&fill_masked);

                        if a != 1 && (r > 0 || g > 0) {
                            let ck = Self::invalid_cache_key(mask, is_tex1);
                            if !self.invalid_tex.contains_key(&ck) {
                                invalid_key_to_store = Some((ck, dx, dy));
                            }
                        }
                    }
                }

                // ── Quantity text ───────────────────────────────────
                if let Some(q) = obj.child("Quantity") {
                    let num = q.text().unwrap_or("undefined");
                    draw_quantity(&mut item_render, num);
                }

                if let Some((ck, cx, cy)) = invalid_key_to_store {
                    self.invalid_tex.insert(ck, (cx, cy));
                }
                self.render
                    .draw_image(&item_render, 0.0, 0.0, 40.0, 40.0, dx, dy, 40, 40);
                self.items.insert(key, item_data(dx, dy));
                self.advance();
            }

            // ── Pet ─────────────────────────────────────────────────
            if clazz == "Pet" {
                let size = match obj.child("Size") {
                    None => None,
                    Some(e) => {
                        let sv = e.text().unwrap_or("").replace('\n', "");
                        let sv = sv.trim();
                        if sv.is_empty() {
                            None
                        } else {
                            finite_i64(js_parse_int(sv))
                        }
                    }
                };
                self.pets.insert(
                    key,
                    PetData {
                        name: obj_id.clone(),
                        family: text_or_null(obj, "Family"),
                        rarity: text_or_null(obj, "Rarity"),
                        default_skin: text_or_null(obj, "DefaultSkin"),
                        size,
                    },
                );
            }

            // ── PetSkin ─────────────────────────────────────────────
            if clazz == "PetSkin" {
                let item_tier = match obj.child("ItemTier") {
                    None => None,
                    Some(e) => {
                        let itv = e.text().unwrap_or("").replace('\n', "");
                        let itv = itv.trim();
                        if itv.is_empty() {
                            None
                        } else {
                            finite_i64(js_parse_int(itv))
                        }
                    }
                };
                let anim_el = match obj.child("AnimatedTexture").filter(|e| e.is_truthy()) {
                    Some(a) => a,
                    None => continue,
                };
                let index = js_hex_or_dec(
                    anim_el
                        .child("Index")
                        .and_then(|e| e.text())
                        .unwrap_or("undefined"),
                );
                let file = anim_el
                    .child("File")
                    .and_then(|e| e.text())
                    .map(|s| s.to_string());
                let is16 = file.as_deref().is_some_and(|f| f.contains("16"));
                self.pet_skins.insert(
                    key,
                    PetSkinData {
                        name: obj_id.clone(),
                        display_id: text_or_null(obj, "DisplayId"),
                        item_tier,
                        family: text_or_null(obj, "Family"),
                        rarity: text_or_null(obj, "Rarity"),
                        anim_index: finite_i64(index),
                        is16x16: is16,
                        sheet: file.clone(),
                    },
                );
                if let Some(f) = file {
                    self.pet_skin_files.insert(f);
                }
            }
        }
    }

    fn process_enchantments(&mut self, root: &Element) {
        for ench in root.children_named("Enchantment") {
            let ench_type = js_hex_or_dec(ench.attr("type").unwrap_or(""));
            if !ench_type.is_finite() {
                log::warn!(
                    "[assets] skipping enchantment {:?}: unparsable type",
                    ench.attr("id").unwrap_or("")
                );
                continue;
            }
            let display_id = ench
                .child("DisplayId")
                .and_then(|e| e.text())
                .unwrap_or("")
                .to_string();
            let description = ench
                .child("Description")
                .and_then(|e| e.text())
                .unwrap_or("")
                .to_string();

            let Some(tex) = ench.child("Texture").filter(|e| e.is_truthy()) else {
                continue;
            };
            let Some(image_name) = tex.child("File").and_then(|e| e.text()) else {
                log::warn!(
                    "  Warning: could not load sheet <missing>, skipping {display_id}"
                );
                continue;
            };
            let Some(sheet_entry) = self.sheets.get(image_name).cloned() else {
                log::warn!(
                    "  Warning: could not load sheet {}, skipping {display_id}",
                    image_name
                );
                continue;
            };
            let img = &sheet_entry.image;

            let image_index = js_hex_or_dec(
                tex.child("Index")
                    .and_then(|e| e.text())
                    .unwrap_or("undefined"),
            );
            const TILE: f64 = 16.0;
            let srcw = img.w as f64 / TILE;
            let srcx = TILE * (image_index % srcw);
            let srcy = TILE * (image_index / srcw).floor();

            let (dx, dy) = self.cell_pos();
            let layers = build_icon(img, srcx as f32, srcy as f32, TILE as f32, TILE as f32);
            apply_icon_shadow(&mut self.render, &layers, dx, dy);
            self.render.draw_image(
                &layers.icon,
                1.0,
                1.0,
                38.0,
                38.0,
                dx + 1,
                dy + 1,
                38,
                38,
            );

            self.enchantments.insert(
                ench_type as i64,
                EnchData {
                    display_id,
                    description,
                    x: dx,
                    y: dy,
                },
            );
            self.advance();
        }
    }
}

// ── entry point ─────────────────────────────────────────────────────

pub fn run_renderer(
    sheets: HashMap<String, Arc<SheetEntry>>,
    xmls: HashMap<String, String>,
    mut progress: impl FnMut(usize, usize, &str),
) -> Result<RenderOutput, String> {
    let mut ctx = Ctx::new(sheets);

    // error.png pasted at slot 1 (position 50,5)
    let err = image::load_from_memory(ERROR_PNG)
        .map_err(|e| format!("embedded error.png: {e}"))?
        .to_rgba8();
    let err_canvas = Canvas {
        w: err.width() as usize,
        h: err.height() as usize,
        data: err.into_raw(),
    };
    ctx.render.draw_image(
        &err_canvas,
        0.0,
        0.0,
        err_canvas.w as f32,
        err_canvas.h as f32,
        50,
        5,
        err_canvas.w as i32,
        err_canvas.h as i32,
    );

    // Pre-scans for per-skin pixel bounds.
    ctx.ps32_bounds = scan_bounds(ctx.sheets.get("playerskins32"), 32);
    ctx.ps_bounds = scan_bounds(ctx.sheets.get("playerskins"), 8);
    ctx.ps16_bounds = scan_bounds(ctx.sheets.get("playerskins16"), 16);
    ctx.players_bounds = scan_bounds(ctx.sheets.get("players"), 8);

    let mut names: Vec<String> = xmls.keys().cloned().collect();
    names.sort();
    let total = names.len();
    let (mut files_processed, mut files_skipped) = (0usize, 0usize);

    log::info!("[assets] Processing {total} XML files");
    for (i, name) in names.iter().enumerate() {
        progress(i, total, name);
        let content = &xmls[name];
        let doc = match crate::assets::xml::parse_document(content) {
            Ok(doc) => doc,
            Err(e) => {
                log::warn!("[assets] failed to parse {name}.xml: {e}");
                files_skipped += 1;
                continue;
            }
        };
        let Some(root) = root_element(&doc) else {
            files_skipped += 1;
            continue;
        };
        match root.name.as_str() {
            "Objects" => {
                if root.children_named("Object").next().is_some() {
                    ctx.process_objects(root);
                    files_processed += 1;
                } else {
                    files_skipped += 1;
                }
            }
            "Enchantments" => {
                if root.children_named("Enchantment").next().is_some() {
                    ctx.process_enchantments(root);
                    files_processed += 1;
                } else {
                    files_skipped += 1;
                }
            }
            _ => {
                files_skipped += 1;
            }
        }
    }
    progress(total, total, "done");

    // ── Crop render to actual size ─────────────────────────────────
    let final_height = CELL * (ctx.imgy as i32 + 1) + 5;
    let mut final_render = Canvas::new(CELL as usize * GRID + 5, final_height as usize);
    final_render.draw_image(
        &ctx.render,
        0.0,
        0.0,
        ctx.render.w as f32,
        ctx.render.h as f32,
        0,
        0,
        ctx.render.w as i32,
        ctx.render.h as i32,
    );

    // ── constants.json ─────────────────────────────────────────────
    let constants = ConstantsJson {
        items: keyed(ctx.items),
        classes: keyed(ctx.classes),
        skins: keyed(ctx.skins),
        pet_abilities: keyed(ctx.pet_abilities),
        textures: keyed(ctx.textures),
        pets: keyed(ctx.pets),
        pet_skins: keyed(ctx.pet_skins),
        enchantments: keyed(ctx.enchantments),
    };
    let stats = RenderStats {
        items: constants.items.len(),
        classes: constants.classes.len(),
        skins: constants.skins.len(),
        enchantments: constants.enchantments.len(),
        files_processed,
        files_skipped,
    };
    let constants_json =
        serde_json::to_vec_pretty(&constants).map_err(|e| format!("constants.json: {e}"))?;

    // ── renders.png ────────────────────────────────────────────────
    let renders_png = encode_png(&final_render)?;

    // ── sheets.json ────────────────────────────────────────────────
    let mut sheets_json = SheetsJson {
        textiles: BTreeMap::new(),
        skinsheets: BTreeMap::new(),
        petskinsheets: BTreeMap::new(),
        renders: "",
    };
    for tf in &ctx.textile_files {
        let name = format!("textile{tf}x{tf}");
        match ctx.sheets.get(&name) {
            Some(entry) => match encode_png(&entry.image) {
                Ok(png) => {
                    sheets_json.textiles.insert(
                        tf.to_string(),
                        format!("data:image/png;base64,{}", STANDARD.encode(png)),
                    );
                }
                Err(e) => log::warn!("[assets] {name}: {e}"),
            },
            None => log::warn!("[assets] Warning: could not read {name}.png"),
        }
    }
    for sf in &ctx.skin_files {
        if let Some(entry) = ctx.sheets.get(sf) {
            match encode_png(&entry.image) {
                Ok(png) => {
                    sheets_json.skinsheets.insert(
                        sf.clone(),
                        format!("data:image/png;base64,{}", STANDARD.encode(png)),
                    );
                }
                Err(e) => log::warn!("[assets] {sf}: {e}"),
            }
            if let Some(mask) = &entry.mask {
                match encode_png(mask) {
                    Ok(png) => {
                        sheets_json.skinsheets.insert(
                            format!("{sf}Mask"),
                            format!("data:image/png;base64,{}", STANDARD.encode(png)),
                        );
                    }
                    Err(e) => log::warn!("[assets] {sf}Mask: {e}"),
                }
            }
        } else {
            log::warn!("[assets] Warning: could not read {sf}.png");
        }
    }
    for psf in &ctx.pet_skin_files {
        if let Some(entry) = ctx.sheets.get(psf) {
            match encode_png(&entry.image) {
                Ok(png) => {
                    sheets_json.petskinsheets.insert(
                        psf.clone(),
                        format!("data:image/png;base64,{}", STANDARD.encode(png)),
                    );
                }
                Err(e) => log::warn!("[assets] {psf}: {e}"),
            }
        } else {
            log::warn!("[assets] Warning: could not read {psf}.png");
        }
    }
    let sheets_json_out =
        serde_json::to_vec_pretty(&sheets_json).map_err(|e| format!("sheets.json: {e}"))?;

    log::info!(
        "[assets] Renderer complete. {} items, {} classes, {} skins, {} enchantments.",
        stats.items,
        stats.classes,
        stats.skins,
        stats.enchantments
    );

    Ok(RenderOutput {
        constants_json,
        renders_png,
        sheets_json: sheets_json_out,
        stats,
    })
}
