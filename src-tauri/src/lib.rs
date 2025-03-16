// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod util;

use dirs;
use log;
use regex::Regex;
use reqwest::{header, Client};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::Instant;
use tauri_plugin_log;
use url::form_urlencoded;
use util::generate_hex_key;

#[derive(Debug)]
enum AccountError {
    TokenNotFound,
    CouldNotParseToken,
    InvalidResponse(String),
}

#[derive(Serialize, Deserialize, Default, Debug)]
struct Settings {
    secret_key: Option<String>, // used for encryption
                                // other settings...
}

impl std::fmt::Display for AccountError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::TokenNotFound => write!(f, "Access token not found in response"),
            Self::CouldNotParseToken => write!(f, "Could not parse access token"),
            Self::InvalidResponse(msg) => write!(f, "Invalid response: {}", msg),
        }
    }
}

// credits: https://github.com/faynt0
#[tauri::command]
async fn get_account(guid: &str, password: &str) -> Result<String, String> {
    let base_url: &str = "https://www.realmofthemadgod.com";
    let client: Client = Client::new();

    let is_steam: bool = guid.starts_with("steamworks:");

    let mut form_data: Vec<(&str, &str)> = vec![("clientToken", "0"), ("guid", guid)];

    if is_steam {
        form_data.push(("steamid", guid));
        form_data.push(("secret", password));
    } else {
        form_data.push(("password", password));
    }

    let verify_url: String = format!("{}/account/verify", base_url);
    log::info!("[RotMG API] Sending /account/verify request");

    let start = Instant::now();

    let response: reqwest::Response = client
        .post(&verify_url)
        .header(header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .form(&form_data)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let body: String = response.text().await.map_err(|e| e.to_string())?;

    log::info!("[RotMG API] Parsing Access Token");

    // get access token
    let token_regex: Regex = Regex::new(r#"<AccessToken>(.*?)</AccessToken>"#)
        .map_err(|e| AccountError::InvalidResponse(e.to_string()).to_string())?;

    let access_token: String = match token_regex.captures(&body) {
        Some(caps) => caps.get(1).map(|m| m.as_str().to_string()).ok_or_else(|| {
            log::error!(
                "[RotMG API] Failed to parse access token. Response body: {}",
                body
            );
            AccountError::CouldNotParseToken.to_string()
        })?,
        None => {
            log::error!(
                "[RotMG API] Access token not found. Response body: {}",
                body
            );
            return Err(AccountError::TokenNotFound.to_string());
        }
    };

    // send another request to /charlist
    let char_list_url: String = format!(
        "{}/char/list?muleDump=true&{}",
        base_url,
        form_urlencoded::Serializer::new(String::new())
            .append_pair("accessToken", &access_token)
            .finish()
    );

    log::info!("[RotMG API] Sending /char/list request");

    let char_list_response = client
        .get(char_list_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let char_list_body = char_list_response.text().await.map_err(|e| e.to_string())?;
    let duration = start.elapsed();
    log::info!(
        "[RotMG API] Request completed in {:.2}ms",
        duration.as_secs_f64() * 1000.0
    );

    Ok(char_list_body)
}

#[tauri::command]
async fn get_settings() -> Result<Settings, String> {
    let settings_path: PathBuf = get_settings_file_path();
    log::info!("[Settings] Checking settings at: {:?}", settings_path);

    let settings: Settings = if PathBuf::from(&settings_path).exists() {
        let content: String = fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
        log::info!("[Settings] Found existing settings");
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        log::info!("[Settings] No settings found, generating settings file.");
        // generate new key
        let key: String = generate_hex_key(32);

        let new_settings = Settings {
            secret_key: Some(key),
            ..Default::default()
        };

        // save new settings
        let settings_json =
            serde_json::to_string_pretty(&new_settings).map_err(|e| e.to_string())?;
        fs::write(&settings_path, settings_json).map_err(|e| e.to_string())?;

        new_settings
    };

    Ok(settings)
}

fn get_save_file_path() -> PathBuf {
    let path: PathBuf = dirs::data_local_dir()
        .ok_or("Could not get local data directory")
        .unwrap()
        .join("RotMGStash");

    if !path.exists() {
        log::info!("[Settings] Creating directory: {:?}", path);
        fs::create_dir_all(&path)
            .map_err(|e| format!("Failed to create directory: {}", e))
            .unwrap();
    }

    path
}

fn get_settings_file_path() -> PathBuf {
    let base_path: PathBuf = get_save_file_path();
    log::info!("[Settings] Base path: {:?}", base_path);

    let settings_path: PathBuf = PathBuf::from(base_path).join("rotmg-stash-settings.json");
    log::info!("[Settings] Settings path: {:?}", settings_path);
    settings_path
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Info)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir { file_name: None },
                ))
                .max_file_size(100000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![get_account, get_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
