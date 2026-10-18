# Orb architecture

`io.github.tcballard.orb` declares only `menu`, mapping to the hosted `Item` in `Wheel.qml`. It exposes `open(payloadJson)`, `close()` and `opened`. `keepLoaded` avoids repeated construction and permits a 120ms launch handoff after unmapping. No standalone Quickshell, background service, Rust helper, Python, network or privileged operations.

`qs.Ui.OverlayWindow` owns the focused-monitor surface and scale readiness. Exclusive keyboard focus exists only while open. Cancellation clears pointer sampling and pending launches, unmaps the layer and lets Hyprland restore focus. Completed actions hide before launching. Repeated summon resets one surface; toggle cancels it.

`hyprctl -j cursorpos` runs once per summon; failure falls back to monitor centre. `Model.js` clamps logical coordinates against reserved edges and tests radial hit regions. Selection starts neutral; sectors run clockwise from Browser at the top. `PointerMoveGate` prevents stationary pointer events replacing keyboard selection. Theme, typography, spacing and reduced-motion tokens are live bindings. Canvas redraws on palette/selection changes; `LineIcon.qml` draws original vector paths. `ActionIcon.qml` renders bundled Codex/Claude/Grok SVG marks, choosing contrasting variants from the menu background luminance; the generic icon is a fallback for unsupported agents or a failed asset load.

`~/.config/omarchy/orb.json` owns durable configuration, watched by FileView. Six bounded top-level actions are validated, with one optional submenu level or the dynamic installed-agent catalog. All displayed labels are plain text. IPC payloads cannot provide commands or file paths. Configuration is trusted local code: `scripts/launch` executes argv without eval and notifies on missing/failed commands. Apps run independently of the shell's lifetime.

The installer owns `hypr/orb.lua` and one exact include in `hypr/bindings.lua`. It checks conflicts, uses the supported Git plugin installer and validates Hyprland after editing. Removal preserves config and unrelated files. Authoring scripts/tests are never loaded by the plugin and are excluded from archive exports; standard host Git clones retain repository source.

The repository starts from the user's starter `0605227`; `.template/blueprint` is unchanged. Conventions were checked against installed Omarchy `5f7aaeb8c`, its active `dock-controls-desktop` checkout, and the upstream shell reference. Existing unrelated source edits were preserved.

Deferred: deeper nesting, visual editing, hold/release gestures, physical multi-monitor acceptance, release and marketplace publication.

The compact wheel defaults to 240 theme units. Submenus reuse the same circular geometry, position and diameter; their centre button returns to the main wheel. More than six submenu actions are paged using footer arrows, scrolling or Page Up/Down. Escape/Left/Backspace returns to the wheel; outside click closes the entire interaction. `scripts/agents` performs one read-only mise inventory query plus executable checks, excluding auto-install stubs. `scripts/agent` launches an installed client in Omarchy’s agent terminal with the selected account, without changing the default agent or submitting a prompt.

The main hub uses a theme-accent glow on hover or Home-key selection. Activation opens a compact SettingsPanel inside the same overlay. Size and animation edits stay in a draft until Save; the latest configuration is re-read, those two fields are merged, and FileView writes atomically with success/failure handling. Cancel discards the draft. Submenu hubs still navigate back.
