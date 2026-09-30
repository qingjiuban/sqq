mod commands;

use commands::filesystem::{
    create_dir, delete_path, ensure_workspace, get_file_tree, get_project_root,
    is_mobile_platform, list_dir, read_file, rename_path, search_files, set_project_root,
    write_file, ProjectState,
};
use commands::process::{
    check_port, find_free_port, get_process_output, kill_process, list_processes, run_command,
    ProcessState,
};
use commands::secrets::{delete_secret, get_secret, save_secret};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(ProjectState {
            root: Mutex::new(None),
        })
        .manage(ProcessState::default())
        .invoke_handler(tauri::generate_handler![
            set_project_root,
            get_project_root,
            is_mobile_platform,
            ensure_workspace,
            list_dir,
            read_file,
            write_file,
            create_dir,
            rename_path,
            delete_path,
            search_files,
            get_file_tree,
            save_secret,
            get_secret,
            delete_secret,
            run_command,
            get_process_output,
            kill_process,
            list_processes,
            check_port,
            find_free_port
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
