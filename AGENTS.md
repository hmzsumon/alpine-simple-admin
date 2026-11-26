# Alpine release workflow

## Background synchronization

Keep background data refresh visually quiet in every app. Preserve the mounted screen, scroll position, focused input, draft values, selected filters and expanded rows. Retain the last matching data during transient refresh failures and show a compact non-displacing error with retry. Coalesce bursts of change events; never replace a populated report with a loading screen during normal sync. Changing the requested account, permissions or report filters must still prevent stale data and exports from the previous scope.

## Installer delivery location

The user requested all Waiter APK, Windows Counter and Local Server installers under `D:\alppine-restrent\Installers`. Keep per-app/per-version folders and SHA-256 verification. Retain old versions and do not replace different bytes with the same filename. Future completed builds must be copied there. Windows electron-builder `afterAllArtifactBuild` hooks and the Waiter release script archive automatically; do not bypass these hooks for a manual build. See `LATEST.txt` in each app folder for the current installer. This is an installer library; do not copy credentials, databases or app profiles into it.
