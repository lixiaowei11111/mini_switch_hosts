// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
mod core;
mod setup;

use core::{conf, constants::LOG_PATH, group, init};
fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Folder {
                        path: LOG_PATH.clone(),
                        file_name: None,
                    },
                ))
                .build(),
        )
        .setup(setup::init)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            group::add_group,
            group::del_group,
            group::update_group_content,
            group::read_group,
            conf::read_conf,
            conf::update_conf,
            conf::update_group_status,
            conf::del_single_group,
            init::read_system_hosts,
            init::update_system_hosts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
