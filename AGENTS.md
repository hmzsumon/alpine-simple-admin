# Alpine release workflow

## Installer delivery location

The user requested all Waiter APK, Windows Counter and Local Server installers under `D:\alppine-restrent\Installers`. Keep per-app/per-version folders and SHA-256 verification. Retain old versions and do not replace different bytes with the same filename. Future completed builds must be copied there. Windows electron-builder `afterAllArtifactBuild` hooks and the Waiter release script archive automatically; do not bypass these hooks for a manual build. See `LATEST.txt` in each app folder for the current installer. This is an installer library; do not copy credentials, databases or app profiles into it.
