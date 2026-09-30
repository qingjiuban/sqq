use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

const SERVICE: &str = "com.root.ai-code-studio";

fn fallback_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("secrets.json"))
}

fn read_fallback(app: &AppHandle) -> serde_json::Map<String, serde_json::Value> {
    let Ok(path) = fallback_path(app) else {
        return Default::default();
    };
    if !path.exists() {
        return Default::default();
    }
    let Ok(text) = fs::read_to_string(&path) else {
        return Default::default();
    };
    let value: serde_json::Value =
        serde_json::from_str(&text).unwrap_or_else(|_| serde_json::json!({}));
    value.as_object().cloned().unwrap_or_default()
}

fn write_fallback(
    app: &AppHandle,
    map: &serde_json::Map<String, serde_json::Value>,
) -> Result<(), String> {
    let path = fallback_path(app)?;
    let text = serde_json::to_string_pretty(map).map_err(|e| e.to_string())?;
    fs::write(&path, text).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = fs::set_permissions(&path, fs::Permissions::from_mode(0o600));
    }
    Ok(())
}

/// Persist a secret in the OS credential store (Keychain / Credential Manager /
/// Secret Service). Falls back to a 0600 file in the app config dir when the
/// platform credential store is unavailable.
#[tauri::command]
pub fn save_secret(app: AppHandle, key: String, value: String) -> Result<(), String> {
    if let Ok(entry) = keyring::Entry::new(SERVICE, &key) {
        if entry.set_password(&value).is_ok() {
            return Ok(());
        }
    }
    let mut map = read_fallback(&app);
    map.insert(key, serde_json::Value::String(value));
    write_fallback(&app, &map)
}

#[tauri::command]
pub fn get_secret(app: AppHandle, key: String) -> Result<Option<String>, String> {
    if let Ok(entry) = keyring::Entry::new(SERVICE, &key) {
        if let Ok(password) = entry.get_password() {
            return Ok(Some(password));
        }
    }
    let map = read_fallback(&app);
    Ok(map
        .get(&key)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string()))
}

#[tauri::command]
pub fn delete_secret(app: AppHandle, key: String) -> Result<(), String> {
    if let Ok(entry) = keyring::Entry::new(SERVICE, &key) {
        let _ = entry.delete_credential();
    }
    let mut map = read_fallback(&app);
    if map.remove(&key).is_some() {
        write_fallback(&app, &map)?;
    }
    Ok(())
}
