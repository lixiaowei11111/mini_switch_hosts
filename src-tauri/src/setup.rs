use super::core::init;
use tauri::{App, Manager};
use window_vibrancy::{self, NSVisualEffectMaterial};
/// setup
pub fn init(app: &mut App) -> std::result::Result<(), Box<dyn std::error::Error>> {
    tauri::async_runtime::block_on(async {
        init::on_app_init(&app).await;
    });
    let win = (&app).get_webview_window("main").unwrap();

    // 仅在 macOS 下执行
    #[cfg(target_os = "macos")]
    window_vibrancy::apply_vibrancy(&win, NSVisualEffectMaterial::FullScreenUI)
        .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

    // 仅在 windows 下执行
    #[cfg(target_os = "windows")]
    window_vibrancy::apply_blur(&win, Some((18, 18, 18, 64)))
        .expect("Unsupported platform! 'apply_blur' is only supported on Windows");

    Ok(())
}