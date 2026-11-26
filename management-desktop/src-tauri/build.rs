fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new().commands(&["open_workspace","detect_local_server"]),
        ),
    ).expect("Unable to prepare Alpine desktop resources");
}
