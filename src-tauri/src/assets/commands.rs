//! Tauri commands for the game-assets extraction pipeline.

use crate::assets::{self, AssetsStatus, CacheManifest, Progress};
use std::path::PathBuf;
use tauri::Emitter;

#[tauri::command]
pub fn get_game_assets_status(source_path: Option<String>) -> Result<AssetsStatus, String> {
    assets::assets_status(source_path.map(PathBuf::from))
}

/// Runs the extraction → render → cache pipeline on a blocking thread,
/// emitting `game-assets://progress` events (`crate::assets::Progress`).
#[tauri::command]
pub async fn extract_game_assets(
    app: tauri::AppHandle,
    source_path: Option<String>,
) -> Result<CacheManifest, String> {
    let source = assets::resolve_source(source_path.map(PathBuf::from)).ok_or_else(|| {
        "RotMG installation not found - set the game path in settings.".to_string()
    })?;
    let cache = assets::cache_dir()?;

    let handle = app.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        assets::extract_and_render(&source, &cache, |p: &Progress| {
            let _ = handle.emit("game-assets://progress", p);
        })
    })
    .await
    .map_err(|e| format!("Extraction task failed: {e}"))?;

    result
}
