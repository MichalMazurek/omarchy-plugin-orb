# Develop and verify Orb

Portable checks (Node 22+, Bash, jq, Lua 5.4 or texlua; no npm dependencies):

```bash
./tests/run
```

This retains the starter identity/CI checks and adds geometry/config tests. On Omarchy, `./tests/native` also runs the installed manifest validator and Qt's QML parser. Parsing is not runtime verification.

`node --test tests/surface.test.mjs` exercises the JavaScript handlers and readiness expressions extracted from Orb's `PanelWindow`: focused-output selection, stable placement across focus changes, geometry/scale readiness, deferred reveal cancellation and output removal. These fixtures do not instantiate QML or exercise layer-shell mapping. For issue #10, verify on an Omarchy release shell without `qs.Ui.OverlayWindow`: fresh enable initializes settings and the shortcut, status reports `setupReady`, summon/keyboard/outside-click/hide work, and focus returns after closing. Repeat on additional outputs and fractional scale, including disconnecting the selected output while open.

Install from main with `omarchy plugin add https://github.com/tcballard/omarchy-plugin-orb.git --enable`. For a committed development checkout, use the supported local Git URL with `omarchy plugin add "$PWD" --enable --yes`. Normal updates use `omarchy plugin update io.github.tcballard.orb`; remove with `omarchy plugin remove io.github.tcballard.orb`. The compatibility `./install` and `./uninstall` wrappers only forward to the native manager. No post-install terminal command is needed.

The opt-in live harness controls the actual desktop. It saves/restores workspace, focused window and pointer, uses an empty named workspace, launches real actions and closes only newly created test windows:

```bash
./tests/build-pointer
ORB_POINTER="$PWD/artifacts/input/pointer" node tests/live.cjs --actions --theme --agents
```

The pointer is a test-only C Wayland client, never a runtime dependency. Building it needs wayland-scanner, wayland-client, pkg-config and a C compiler. Keyboard input uses wtype. This XPS harness requires scale 1 and no rotation; unit tests cover logical geometry independently. The theme option applies another palette through real shell IPC and restores it in cleanup without changing theme/app files. The actions option exercises six real launchers. A browser can reuse an existing window; the harness never closes that existing window or its tabs.

Results and captures stay under ignored `artifacts/`. Review before sharing; personal wallpapers may be visible. Acceptance records identify the tested source. The Workbench companion remains optional and does not grant trust automatically.

Final physical-key check: Super+Alt+O, Right, Enter; then repeat with Escape and an outside click. On other hardware verify additional monitors, scale changes and hotplug. Do not infer those from a single-panel XPS result.

The optional `--agents` check uses real pointer clicks to open Agents and launch Codex, verifies the default-agent file is unchanged, closes only its new test terminal and captures still images. It sends no prompt or task. No video recording is performed.

Focused circular-menu check: `ORB_POINTER="$PWD/artifacts/input/pointer" node tests/live.cjs --menus-only --agents --settings`. The harness paces keyboard input and waits after surface mapping for compositor focus delivery.

Run `node tests/settings-live.cjs` for the native settings panel. It changes size and animation through the UI, verifies Cancel and Save, restores the original values, checks screen bounds and verifies that no configuration editor opens. It assumes the XPS scale-1 layout used by the main live harness.

Run `node tests/slots-live.cjs` for all six slot drafts, cancellation, an installed Files app save/launch, Postcard save/reopen/launch, and panel bounds. It restores the configuration it started with; `--apply-postcard` deliberately retains Postcard in slot four on success. Keep the desktop idle during this input-driven check. It captures stills only. The older full-action harness assumes the default six-slot layout; use focused checks when you have customized it.

`./tests/native` also uses Lua to check desktop hit-testing and passthrough. `node tests/rightclick-live.cjs` checks real desktop right-click, left-click, the retained Super+right-click resize binding, and a Files context menu in a temporary workspace, then restores workspace/focus/pointer. Native binding contract: https://wiki.hypr.land/configuring/core/binds/#auto-consuming-binds-and-return--ok--false- .

`node tests/expanded-slots-live.cjs` starts with a six-slot configuration, verifies cancel/add/save/reopen for seven and eight slots, all eight pointer hit regions, the eighth action launch, and removal back to six. It restores the starting configuration and captures stills only.

`node tests/extras-live.cjs` checks a saved layout containing Make something cool: all pointer sectors, last-slot keyboard selection, its circular submenu and back navigation, and removal/Cancel without saving. It compares the starter prompts against the installed Agents panel and deliberately does not execute them.

`node tests/compact-live.cjs` checks 280px, 467px and 700px layouts on this XPS, growing pointer/keyboard captions, submenu captions and screen-edge clearance, then restores the original diameter without overwriting slot changes.

`node tests/preview-live.cjs` captures a real still on an empty workspace and restores workspace, pointer and focus. It rejects an intervening workspace change or visible application window; visually inspect the result before publishing. It does not record video.

`node tests/lifecycle-live.cjs` explicitly removes and reinstalls Orb on the live desktop. It backs up relevant configuration under ignored `artifacts/`, refuses a modified installed checkout, checks unload/owned-binding removal, compares configuration and unrelated settings, then tests a fresh Git reinstall and repeated install. It checks saved slots/appearance, three summon/Escape cycles and focus restoration. If removal starts but a check fails before reinstall finishes, it attempts reinstall in cleanup. It leaves Orb installed and retains backups. Physical key presses and action launches are separate checks.
