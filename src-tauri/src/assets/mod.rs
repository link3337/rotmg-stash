//! Runtime asset pipeline: extract sprites/XML from the installed game's
//! `resources.assets`, recompile sprite sheets, render the frontend
//! contract (`constants.json`, `renders.png`, `sheets.json`), and cache
//! everything on disk. Ports the orchestration of
//! `rotmg-asset-creator/src/index.ts`.

pub mod commands;
pub mod flatbuf;
pub mod render;
pub mod sheet;
pub mod unity;
pub mod xml;

use render::{RenderOutput, RenderStats};
use serde::{Deserialize, Serialize};
use sheet::{build_atlases, recompile, Manifest, ManifestEntry};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub const CACHE_VERSION: u32 = 1;

const TARGET_TEXTURES: [&str; 4] = ["characters", "characters_masks", "groundTiles", "mapObjects"];

const CACHE_FILES: [&str; 3] = ["constants.json", "renders.png", "sheets.json"];

/// `config.copy` aliases from the reference tool.
fn copy_aliases() -> HashMap<String, Vec<String>> {
    HashMap::from([
        (
            "lofiChar8x8".to_string(),
            vec!["lofiChar".to_string()],
        ),
        (
            "lofiChar28x8".to_string(),
            vec!["lofiChar2".to_string()],
        ),
        (
            "d2LofiObjEmbed".to_string(),
            vec!["d2LofiObj".to_string()],
        ),
        (
            "d3Chars8x8rEmbed".to_string(),
            vec!["d3Chars8x8r".to_string()],
        ),
    ])
}

// ── progress ────────────────────────────────────────────────────────

#[derive(Serialize, Clone, Debug)]
pub struct Progress {
    /// `textures` | `text-assets` | `recompile` | `render` | `write`
    pub phase: String,
    pub current: usize,
    pub total: usize,
    pub message: String,
}

// ── cache ───────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CacheManifest {
    pub version: u32,
    pub source_path: String,
    pub source_size: u64,
    pub source_mtime_ms: u64,
    pub generated_at_ms: u64,
    pub stats: RenderStats,
}

#[derive(Serialize, Debug)]
pub struct AssetsStatus {
    /// `fresh` | `stale` | `missing`
    pub status: String,
    pub source_path: Option<String>,
    pub cache_dir: String,
    pub stats: Option<RenderStats>,
}

pub fn cache_dir() -> Result<PathBuf, String> {
    let base =
        dirs::data_local_dir().ok_or_else(|| "Could not get local data directory".to_string())?;
    Ok(base.join("RotMG Stash").join("game-assets"))
}

fn cache_manifest_path(dir: &Path) -> PathBuf {
    dir.join("manifest.json")
}

pub fn read_cache_manifest(dir: &Path) -> Option<CacheManifest> {
    let bytes = std::fs::read(cache_manifest_path(dir)).ok()?;
    let manifest: CacheManifest = serde_json::from_slice(&bytes).ok()?;
    (manifest.version == CACHE_VERSION).then_some(manifest)
}

fn file_fingerprint(path: &Path) -> Result<(u64, u64), String> {
    let meta = std::fs::metadata(path)
        .map_err(|e| format!("Cannot stat {}: {e}", path.display()))?;
    let mtime_ms = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    Ok((meta.len(), mtime_ms))
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Best-effort discovery of the installed game's `resources.assets`.
pub fn detect_resources_assets() -> Option<PathBuf> {
    let local = dirs::data_local_dir()?;
    let candidates = [
        local
            .join("RealmOfTheMadGod")
            .join("Production")
            .join("RotMG Exalt_Data")
            .join("resources.assets"),
        PathBuf::from(
            r"C:\Program Files (x86)\Steam\steamapps\common\Realm of the Mad God\RotMG Exalt_Data\resources.assets",
        ),
        PathBuf::from(
            r"C:\Program Files\Steam\steamapps\common\Realm of the Mad God\RotMG Exalt_Data\resources.assets",
        ),
    ];
    candidates.into_iter().find(|p| p.is_file())
}

/// Resolve the source path: explicit argument (from settings) or detection.
pub fn resolve_source(explicit: Option<PathBuf>) -> Option<PathBuf> {
    explicit
        .filter(|p| p.is_file())
        .or_else(detect_resources_assets)
}

pub fn assets_status(source: Option<PathBuf>) -> Result<AssetsStatus, String> {
    let cache = cache_dir()?;
    let cache_str = cache.display().to_string();
    let source = resolve_source(source);
    let source_str = source.as_ref().map(|p| p.display().to_string());

    let files_ok = CACHE_FILES.iter().all(|f| cache.join(f).is_file());
    let manifest = if files_ok {
        read_cache_manifest(&cache)
    } else {
        None
    };

    let Some(manifest) = manifest else {
        return Ok(AssetsStatus {
            status: "missing".to_string(),
            source_path: source_str,
            cache_dir: cache_str,
            stats: None,
        });
    };

    if let Some(src) = &source {
        if let Ok((size, mtime)) = file_fingerprint(src) {
            if size != manifest.source_size || mtime != manifest.source_mtime_ms {
                return Ok(AssetsStatus {
                    status: "stale".to_string(),
                    source_path: source_str,
                    cache_dir: cache_str,
                    stats: Some(manifest.stats),
                });
            }
        }
    }

    Ok(AssetsStatus {
        status: "fresh".to_string(),
        source_path: source_str,
        cache_dir: cache_str,
        stats: Some(manifest.stats),
    })
}

// ── manifest parsing ────────────────────────────────────────────────

/// JS `+attr` (unary plus): valid finite numbers map to u32, everything
/// else (missing, "", "abc", negative) maps to 0 and is treated as
/// invalid/falsy downstream — matching `frameWidth <= 0` checks in TS.
fn js_number_as_u32(attr: Option<&str>) -> u32 {
    attr.and_then(|v| v.trim().parse::<f64>().ok())
        .filter(|n| n.is_finite() && *n > 0.0 && *n <= u32::MAX as f64)
        .map(|n| n as u32)
        .unwrap_or(0)
}

/// Port of `loadManifest` in index.ts.
pub fn parse_manifest(xml: &str) -> Result<Manifest, String> {
    let doc = xml::parse_document(xml)?;
    let root = xml::root_element(&doc).ok_or("assets_manifest: empty document")?;
    if root.name != "Manifest" {
        return Err(format!("assets_manifest: unexpected root <{}>", root.name));
    }
    let importer = root
        .child("Importer")
        .ok_or("assets_manifest: <Importer> missing")?;

    let mut manifest = Manifest::new();
    let insert = |el: &xml::Element, manifest: &mut Manifest| {
        let Some(name) = el.attr("name") else {
            return;
        };
        manifest.insert(
            name.to_string(),
            ManifestEntry {
                frame_width: js_number_as_u32(el.attr("frameWidth")),
                frame_height: js_number_as_u32(el.attr("frameHeight")),
                // reference: `set["@_mask"] != null` → presence, not truthiness
                mask: el.attr("mask").is_some(),
            },
        );
    };
    if let Some(sets) = importer.child("AnimatedImageSets") {
        for el in sets.children_named("AnimatedImageSet") {
            insert(el, &mut manifest);
        }
    }
    if let Some(sets) = importer.child("ImageSets") {
        for el in sets.children_named("ImageSet") {
            insert(el, &mut manifest);
        }
    }
    Ok(manifest)
}

// ── pipeline ────────────────────────────────────────────────────────

fn write_atomic(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, bytes).map_err(|e| format!("write {}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("rename {}: {e}", path.display()))?;
    Ok(())
}

/// Full extraction → recompile → render → cache pipeline.
/// `progress` is invoked for each phase step; heavy work is expected to
/// run on a blocking thread (see `commands::extract_game_assets`).
pub fn extract_and_render(
    source: &Path,
    cache: &Path,
    mut progress: impl FnMut(&Progress),
) -> Result<CacheManifest, String> {
    log::info!("[assets] Extracting from {}", source.display());

    let mut textures: HashMap<String, unity::RgbaTexture> = HashMap::new();
    let mut spritesheetf: Option<Vec<u8>> = None;
    let mut xmls: HashMap<String, String> = HashMap::new();

    // ── Phase 1: extract Texture2D + TextAsset payloads (mmap scope) ──
    {
        let unity = unity::UnityAsset::open(source)?;

        let texture_objs: Vec<&unity::ObjectInfo> =
            unity.objects_of_class(28).collect();
        let mut found_textures = 0usize;
        for obj in &texture_objs {
            let name = unity.read_object_name(obj)?;
            if !TARGET_TEXTURES.contains(&name.as_str()) {
                continue;
            }
            let tex = unity.extract_texture2d(obj)?;
            log::info!(
                "[assets] Texture2D {name} {}x{} fmt={}",
                tex.width,
                tex.height,
                tex.texture_format
            );
            textures.insert(name.clone(), tex);
            found_textures += 1;
            progress(&Progress {
                phase: "textures".to_string(),
                current: found_textures,
                total: TARGET_TEXTURES.len(),
                message: name,
            });
        }

        let text_objs: Vec<&unity::ObjectInfo> =
            unity.objects_of_class(49).collect();
        let total_text = text_objs.len();
        for (i, obj) in text_objs.iter().enumerate() {
            let name = unity.read_object_name(obj)?;
            let ta = unity.extract_text_asset(obj)?;
            progress(&Progress {
                phase: "text-assets".to_string(),
                current: i + 1,
                total: total_text,
                message: name.clone(),
            });
            if name == "spritesheetf" {
                spritesheetf = Some(ta.data);
                continue;
            }
            if ta.data.starts_with(b"<?xml version=") {
                let content = String::from_utf8_lossy(&ta.data).into_owned();
                // Duplicate names: last one wins (matches sequential
                // writeFileSync in the reference tool).
                xmls.insert(name, content);
            }
        }
    } // mmap + textures released here

    let missing: Vec<&str> = TARGET_TEXTURES
        .iter()
        .filter(|t| !textures.contains_key(**t))
        .copied()
        .collect();
    if !missing.is_empty() {
        return Err(format!(
            "Missing Texture2D assets in resources.assets: {}",
            missing.join(", ")
        ));
    }
    let spritesheetf = spritesheetf.ok_or("spritesheetf TextAsset missing")?;

    // ── Phase 2: flatbuffer parse ──────────────────────────────────
    log::info!("[assets] Parsing spritesheetf ({} KiB)", spritesheetf.len() / 1024);
    let root = flatbuf::parse_sprite_sheet_root(&spritesheetf)?;
    drop(spritesheetf);
    log::info!(
        "[assets] {} sprite sheets, {} animated sprites",
        root.sprites.len(),
        root.animated_sprites.len()
    );

    // ── Phase 3: manifest ──────────────────────────────────────────
    let manifest_xml = xmls
        .get("assets_manifest")
        .ok_or("assets_manifest TextAsset missing")?;
    let manifest = parse_manifest(manifest_xml)?;
    log::info!("[assets] Manifest: {} image sets", manifest.len());

    // ── Phase 4: recompile sheets ──────────────────────────────────
    progress(&Progress {
        phase: "recompile".to_string(),
        current: 0,
        total: 1,
        message: "Recompiling sprite sheets…".to_string(),
    });
    let atlases = build_atlases(
        textures.remove("groundTiles").expect("checked above"),
        textures.remove("characters").expect("checked above"),
        textures.remove("mapObjects").expect("checked above"),
        textures.remove("characters_masks").expect("checked above"),
    );
    let sheets = recompile(&root, atlases, &manifest, &copy_aliases())?;
    drop(root);
    log::info!("[assets] Recompiled {} sheets", sheets.len());
    progress(&Progress {
        phase: "recompile".to_string(),
        current: 1,
        total: 1,
        message: format!("{} sheets", sheets.len()),
    });

    // ── Phase 5: renderer ──────────────────────────────────────────
    let out: RenderOutput = render::run_renderer(sheets, xmls, |current, total, message| {
        progress(&Progress {
            phase: "render".to_string(),
            current,
            total,
            message: message.to_string(),
        });
    })?;

    // ── Phase 6: cache to disk (manifest written last) ─────────────
    progress(&Progress {
        phase: "write".to_string(),
        current: 0,
        total: 4,
        message: "Writing cache…".to_string(),
    });
    std::fs::create_dir_all(cache)
        .map_err(|e| format!("Cannot create {}: {e}", cache.display()))?;
    write_atomic(&cache.join("constants.json"), &out.constants_json)?;
    progress(&Progress {
        phase: "write".to_string(),
        current: 1,
        total: 4,
        message: "constants.json".to_string(),
    });
    write_atomic(&cache.join("renders.png"), &out.renders_png)?;
    progress(&Progress {
        phase: "write".to_string(),
        current: 2,
        total: 4,
        message: "renders.png".to_string(),
    });
    write_atomic(&cache.join("sheets.json"), &out.sheets_json)?;
    progress(&Progress {
        phase: "write".to_string(),
        current: 3,
        total: 4,
        message: "sheets.json".to_string(),
    });

    let (source_size, source_mtime_ms) = file_fingerprint(source)?;
    let manifest_out = CacheManifest {
        version: CACHE_VERSION,
        source_path: source.display().to_string(),
        source_size,
        source_mtime_ms,
        generated_at_ms: now_ms(),
        stats: out.stats.clone(),
    };
    write_atomic(
        &cache_manifest_path(cache),
        serde_json::to_vec_pretty(&manifest_out)
            .map_err(|e| format!("manifest.json: {e}"))?
            .as_slice(),
    )?;
    progress(&Progress {
        phase: "write".to_string(),
        current: 4,
        total: 4,
        message: "done".to_string(),
    });

    log::info!(
        "[assets] Cached to {} — {} items, {} classes, {} skins, {} enchantments",
        cache.display(),
        manifest_out.stats.items,
        manifest_out.stats.classes,
        manifest_out.stats.skins,
        manifest_out.stats.enchantments
    );
    Ok(manifest_out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_finds_installed_game() {
        let path = detect_resources_assets();
        println!("detected: {path:?}");
    }

    #[test]
    fn manifest_numbers_js_style() {
        assert_eq!(js_number_as_u32(Some("8")), 8);
        assert_eq!(js_number_as_u32(Some("56.0")), 56);
        assert_eq!(js_number_as_u32(Some("")), 0);
        assert_eq!(js_number_as_u32(Some("abc")), 0);
        assert_eq!(js_number_as_u32(Some("-4")), 0);
        assert_eq!(js_number_as_u32(None), 0);
    }

    /// Full pipeline against the real game file (long-running).
    #[test]
    #[ignore]
    fn full_extract_against_installed_game() {
        let source = detect_resources_assets().expect("game not installed");
        let cache = cache_dir().expect("cache dir");
        let started = std::time::Instant::now();
        let mut last_phase = String::new();
        let mut phase_started = std::time::Instant::now();
        let manifest = extract_and_render(&source, &cache, |p| {
            if p.phase != last_phase {
                if !last_phase.is_empty() {
                    println!("  phase {} took {:.1?}", last_phase, phase_started.elapsed());
                }
                last_phase = p.phase.clone();
                phase_started = std::time::Instant::now();
            }
            if p.current % 50 == 0 || p.current + 1 == p.total {
                println!("[{}] {}/{} {}", p.phase, p.current, p.total, p.message);
            }
        })
        .expect("pipeline failed");
        println!("  phase {} took {:.1?}", last_phase, phase_started.elapsed());
        println!("TOTAL: {:.1?}", started.elapsed());
        println!("{manifest:#?}");
        for f in CACHE_FILES {
            let meta = std::fs::metadata(cache.join(f)).expect(f);
            println!("{f}: {} bytes", meta.len());
        }
        let status = assets_status(Some(source)).unwrap();
        assert_eq!(status.status, "fresh");
    }
}
