# Develop and verify Orb

Portable checks (Node 22+, Bash, no npm dependencies):

```bash
./tests/run
```

This retains the starter identity/CI checks and adds geometry/config tests. On Omarchy, `./tests/native` also runs the installed manifest validator and Qt's QML parser. Parsing is not runtime verification.

Install from a committed checkout with `./install`. After changes, commit and rerun it; let the shell finish reloading plugins before summoning. A rescan retained cached QML during live development on this build. If the old UI persists, `omarchy restart shell` loads the new runtime; this briefly reloads the bar.

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
